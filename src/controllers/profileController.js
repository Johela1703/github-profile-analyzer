/**
 * profileController.js
 *
 * Handles all HTTP request/response logic for profile operations.
 * Business logic lives in githubService.js; DB access happens here.
 */

const { validationResult } = require('express-validator');
const { pool }             = require('../config/db');
const { analyzeProfile }   = require('../services/githubService');

// ----------------------------------------------------------------
// Helper: format a DB profile row into the public API shape
// ----------------------------------------------------------------
function formatProfile(row) {
  return {
    id:                 row.id,
    username:           row.username,
    name:               row.name,
    bio:                row.bio,
    location:           row.location,
    company:            row.company,
    email:              row.email,
    blog:               row.blog,
    avatar_url:         row.avatar_url,
    github_url:         row.github_url,
    public_repos:       row.public_repos,
    public_gists:       row.public_gists,
    followers:          row.followers,
    following:          row.following,
    account_created_at: row.account_created_at,
    account_updated_at: row.account_updated_at,
    analyzed_at:        row.analyzed_at,
  };
}

function formatInsights(row) {
  if (!row) return null;
  return {
    top_language:               row.top_language,
    language_distribution:      row.language_distribution
      ? (typeof row.language_distribution === 'string'
          ? JSON.parse(row.language_distribution)
          : row.language_distribution)
      : {},
    total_stars:                row.total_stars,
    total_forks:                row.total_forks,
    total_watchers:             row.total_watchers,
    avg_repo_size_kb:           row.avg_repo_size_kb,
    repos_with_description_pct: row.repos_with_description_pct,
    most_starred_repo:          row.most_starred_repo,
    most_starred_repo_url:      row.most_starred_repo_url,
    most_starred_count:         row.most_starred_count,
    most_forked_repo:           row.most_forked_repo,
    most_forked_repo_url:       row.most_forked_repo_url,
    most_forked_count:          row.most_forked_count,
    original_repos_count:       row.original_repos_count,
    forked_repos_count:         row.forked_repos_count,
    archived_repos_count:       row.archived_repos_count,
    account_age_days:           row.account_age_days,
    activity_score:             row.activity_score,
  };
}

// ----------------------------------------------------------------
// POST /api/profiles/analyze/:username
// ----------------------------------------------------------------
exports.analyzeAndStore = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username } = req.params;

    // 1. Fetch from GitHub
    const { user, repos, insights } = await analyzeProfile(username);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 2. Upsert profile row
      const profileValues = [
        user.login,
        user.name         || null,
        user.bio          || null,
        user.location     || null,
        user.company      || null,
        user.email        || null,
        user.blog         || null,
        user.avatar_url   || null,
        user.html_url     || null,
        user.public_repos || 0,
        user.public_gists || 0,
        user.followers    || 0,
        user.following    || 0,
        user.created_at   ? new Date(user.created_at) : null,
        user.updated_at   ? new Date(user.updated_at) : null,
        new Date(),
      ];

      const [profileResult] = await conn.query(
        `INSERT INTO profiles
           (username, name, bio, location, company, email, blog,
            avatar_url, github_url, public_repos, public_gists,
            followers, following, account_created_at, account_updated_at, analyzed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name               = VALUES(name),
           bio                = VALUES(bio),
           location           = VALUES(location),
           company            = VALUES(company),
           email              = VALUES(email),
           blog               = VALUES(blog),
           avatar_url         = VALUES(avatar_url),
           github_url         = VALUES(github_url),
           public_repos       = VALUES(public_repos),
           public_gists       = VALUES(public_gists),
           followers          = VALUES(followers),
           following          = VALUES(following),
           account_created_at = VALUES(account_created_at),
           account_updated_at = VALUES(account_updated_at),
           analyzed_at        = VALUES(analyzed_at)`,
        profileValues
      );

      // Resolve the actual profile id (insert gives insertId; update keeps existing id)
      let profileId = profileResult.insertId;
      if (profileId === 0) {
        const [[existing]] = await conn.query(
          'SELECT id FROM profiles WHERE username = ?',
          [user.login]
        );
        profileId = existing.id;
      }

      // 3. Upsert insights row
      await conn.query(
        `INSERT INTO profile_insights
           (profile_id, top_language, language_distribution, total_stars, total_forks,
            total_watchers, avg_repo_size_kb, repos_with_description_pct,
            most_starred_repo, most_starred_repo_url, most_starred_count,
            most_forked_repo, most_forked_repo_url, most_forked_count,
            original_repos_count, forked_repos_count, archived_repos_count,
            account_age_days, activity_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           top_language               = VALUES(top_language),
           language_distribution      = VALUES(language_distribution),
           total_stars                = VALUES(total_stars),
           total_forks                = VALUES(total_forks),
           total_watchers             = VALUES(total_watchers),
           avg_repo_size_kb           = VALUES(avg_repo_size_kb),
           repos_with_description_pct = VALUES(repos_with_description_pct),
           most_starred_repo          = VALUES(most_starred_repo),
           most_starred_repo_url      = VALUES(most_starred_repo_url),
           most_starred_count         = VALUES(most_starred_count),
           most_forked_repo           = VALUES(most_forked_repo),
           most_forked_repo_url       = VALUES(most_forked_repo_url),
           most_forked_count          = VALUES(most_forked_count),
           original_repos_count       = VALUES(original_repos_count),
           forked_repos_count         = VALUES(forked_repos_count),
           archived_repos_count       = VALUES(archived_repos_count),
           account_age_days           = VALUES(account_age_days),
           activity_score             = VALUES(activity_score)`,
        [
          profileId,
          insights.topLanguage,
          JSON.stringify(insights.languageDistribution),
          insights.totalStars,
          insights.totalForks,
          insights.totalWatchers,
          insights.avgRepoSizeKb,
          insights.reposWithDescriptionPct,
          insights.mostStarredRepo,
          insights.mostStarredRepoUrl,
          insights.mostStarredCount,
          insights.mostForkedRepo,
          insights.mostForkedRepoUrl,
          insights.mostForkedCount,
          insights.originalReposCount,
          insights.forkedReposCount,
          insights.archivedReposCount,
          insights.accountAgeDays,
          insights.activityScore,
        ]
      );

      // 4. Replace repositories: delete old rows then batch insert
      await conn.query('DELETE FROM repositories WHERE profile_id = ?', [profileId]);

      if (repos.length > 0) {
        const repoRows = repos.map((r) => [
          profileId,
          r.name,
          r.full_name,
          r.description || null,
          r.language    || null,
          r.stargazers_count || 0,
          r.forks_count      || 0,
          r.watchers_count   || 0,
          r.fork     ? 1 : 0,
          r.archived ? 1 : 0,
          r.open_issues_count || 0,
          r.size              || 0,
          r.html_url          || null,
          r.topics            && r.topics.length ? JSON.stringify(r.topics) : null,
          r.created_at ? new Date(r.created_at) : null,
          r.pushed_at  ? new Date(r.pushed_at)  : null,
        ]);

        await conn.query(
          `INSERT INTO repositories
             (profile_id, repo_name, full_name, description, language,
              stars, forks, watchers, is_fork, is_archived, open_issues,
              repo_size_kb, repo_url, topics, created_at_github, pushed_at)
           VALUES ?`,
          [repoRows]
        );
      }

      await conn.commit();

      // 5. Fetch the freshly stored data and return it
      const [[storedProfile]] = await conn.query(
        'SELECT * FROM profiles WHERE id = ?',
        [profileId]
      );
      const [[storedInsights]] = await conn.query(
        'SELECT * FROM profile_insights WHERE profile_id = ?',
        [profileId]
      );
      const [storedRepos] = await conn.query(
        'SELECT * FROM repositories WHERE profile_id = ? ORDER BY stars DESC',
        [profileId]
      );

      return res.status(200).json({
        success: true,
        message: `Profile for "${username}" analyzed and stored successfully.`,
        data: {
          profile:    formatProfile(storedProfile),
          insights:   formatInsights(storedInsights),
          repositories: storedRepos,
          meta: {
            repos_fetched: repos.length,
          },
        },
      });
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------------------
// GET /api/profiles
// ----------------------------------------------------------------
exports.getAllProfiles = async (req, res, next) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page     || '1',  10));
    const pageSize = Math.min(
      parseInt(req.query.page_size || process.env.DEFAULT_PAGE_SIZE || '10', 10),
      parseInt(process.env.MAX_PAGE_SIZE || '50', 10)
    );
    const offset   = (page - 1) * pageSize;

    // Optional sort
    const allowedSort  = ['followers', 'public_repos', 'analyzed_at', 'activity_score'];
    const sortBy       = allowedSort.includes(req.query.sort_by) ? req.query.sort_by : 'analyzed_at';
    const sortDir      = req.query.sort_dir === 'asc' ? 'ASC' : 'DESC';

    // Join with insights for richer list
    const query = `
      SELECT
        p.id, p.username, p.name, p.avatar_url, p.github_url,
        p.location, p.public_repos, p.public_gists,
        p.followers, p.following, p.analyzed_at,
        pi.top_language, pi.total_stars, pi.activity_score,
        pi.account_age_days
      FROM profiles p
      LEFT JOIN profile_insights pi ON pi.profile_id = p.id
      ORDER BY ${sortBy === 'activity_score' ? 'pi.' : 'p.'}${sortBy} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM profiles');
    const [rows]        = await pool.query(query, [pageSize, offset]);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------------------
// GET /api/profiles/:username
// ----------------------------------------------------------------
exports.getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const [[profile]] = await pool.query(
      'SELECT * FROM profiles WHERE username = ?',
      [username]
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Profile "${username}" has not been analyzed yet. Use POST /api/profiles/analyze/${username} first.`,
      });
    }

    const [[insights]] = await pool.query(
      'SELECT * FROM profile_insights WHERE profile_id = ?',
      [profile.id]
    );

    const [repos] = await pool.query(
      'SELECT * FROM repositories WHERE profile_id = ? ORDER BY stars DESC',
      [profile.id]
    );

    // Parse JSON fields on repos
    const formattedRepos = repos.map((r) => ({
      ...r,
      topics: r.topics
        ? (typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics)
        : [],
    }));

    return res.status(200).json({
      success: true,
      data: {
        profile:      formatProfile(profile),
        insights:     formatInsights(insights),
        repositories: formattedRepos,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------------------
// DELETE /api/profiles/:username
// ----------------------------------------------------------------
exports.deleteProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const [[profile]] = await pool.query(
      'SELECT id FROM profiles WHERE username = ?',
      [username]
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Profile "${username}" not found.`,
      });
    }

    // Cascade via FK will also remove profile_insights + repositories
    await pool.query('DELETE FROM profiles WHERE id = ?', [profile.id]);

    return res.status(200).json({
      success: true,
      message: `Profile "${username}" and all related data deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};
