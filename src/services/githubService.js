/**
 * githubService.js
 *
 * Handles all communication with the GitHub REST API v3.
 * Fetches user profile data + public repositories, then computes
 * a rich set of derived insights.
 */

require('dotenv').config();
const axios = require('axios');

// ----------------------------------------------------------------
// Axios instance with optional auth header for higher rate limits
// ----------------------------------------------------------------
const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 15000,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  },
});

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * Calculate an "activity score" (0–100) based on several signals.
 *
 * Weights:
 *   - followers           30 %  (capped at 1000, so 1000 followers = full)
 *   - total_stars         25 %  (capped at 500)
 *   - public_repos        20 %  (capped at 100)
 *   - recent_push_ratio   25 %  (fraction of repos pushed in last 90 days)
 *
 * @param {object} user      GitHub user object
 * @param {Array}  repos     Array of repo objects
 * @returns {number}         Score rounded to 2 decimal places
 */
function computeActivityScore(user, repos) {
  const followerScore = Math.min(user.followers / 1000, 1) * 30;
  const starsTotal    = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const starScore     = Math.min(starsTotal / 500, 1) * 25;
  const repoScore     = Math.min(user.public_repos / 100, 1) * 20;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentPushes  = repos.filter(
    (r) => r.pushed_at && new Date(r.pushed_at) >= ninetyDaysAgo
  ).length;
  const pushRatio     = repos.length > 0 ? recentPushes / repos.length : 0;
  const pushScore     = pushRatio * 25;

  return parseFloat((followerScore + starScore + repoScore + pushScore).toFixed(2));
}

/**
 * Build a language distribution map from repo data.
 * @param {Array} repos
 * @returns {{ distribution: object, topLanguage: string|null }}
 */
function computeLanguageStats(repos) {
  const dist = {};
  repos.forEach((r) => {
    if (r.language) {
      dist[r.language] = (dist[r.language] || 0) + 1;
    }
  });

  const topLanguage =
    Object.keys(dist).length > 0
      ? Object.entries(dist).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  return { distribution: dist, topLanguage };
}

/**
 * Find the repo with the highest value for a given field.
 * @param {Array}  repos
 * @param {string} field  e.g. 'stargazers_count'
 * @returns {object|null}
 */
function topRepo(repos, field) {
  if (!repos.length) return null;
  return repos.reduce((best, r) => (r[field] > best[field] ? r : best), repos[0]);
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Fetch the GitHub user object for a given username.
 * @param {string} username
 * @returns {Promise<object>} GitHub user object
 */
async function fetchUser(username) {
  try {
    const { data } = await githubClient.get(`/users/${username}`);
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      const error = new Error(`GitHub user "${username}" not found`);
      error.statusCode = 404;
      throw error;
    }
    if (err.response?.status === 403) {
      const error = new Error('GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env to increase limits.');
      error.statusCode = 429;
      throw error;
    }
    throw err;
  }
}

/**
 * Fetch all public repositories for a user (up to 500 via pagination).
 * @param {string} username
 * @returns {Promise<Array>} Array of repo objects
 */
async function fetchRepos(username) {
  const repos = [];
  let page    = 1;
  const PER_PAGE = 100;

  while (true) {
    const { data } = await githubClient.get(`/users/${username}/repos`, {
      params: { per_page: PER_PAGE, sort: 'updated', page },
    });

    repos.push(...data);

    if (data.length < PER_PAGE || repos.length >= 500) break;
    page++;
  }

  return repos;
}

/**
 * Main entry point: fetch profile + repos, compute insights.
 *
 * @param {string} username  GitHub login
 * @returns {Promise<{ user: object, repos: Array, insights: object }>}
 */
async function analyzeProfile(username) {
  const [user, repos] = await Promise.all([
    fetchUser(username),
    fetchRepos(username),
  ]);

  // Language stats
  const { distribution, topLanguage } = computeLanguageStats(repos);

  // Aggregate numerics
  const totalStars    = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks    = repos.reduce((s, r) => s + r.forks_count, 0);
  const totalWatchers = repos.reduce((s, r) => s + r.watchers_count, 0);
  const totalSizeKb   = repos.reduce((s, r) => s + (r.size || 0), 0);
  const avgSizeKb     = repos.length > 0 ? totalSizeKb / repos.length : 0;

  // Repo composition
  const originalRepos  = repos.filter((r) => !r.fork);
  const forkedRepos    = repos.filter((r) => r.fork);
  const archivedRepos  = repos.filter((r) => r.archived);
  const reposWithDesc  = repos.filter((r) => r.description && r.description.trim().length > 0);
  const descriptionPct = repos.length > 0 ? (reposWithDesc.length / repos.length) * 100 : 0;

  // Top repos
  const starredRepo = topRepo(originalRepos.length ? originalRepos : repos, 'stargazers_count');
  const forkedRepo  = topRepo(originalRepos.length ? originalRepos : repos, 'forks_count');

  // Account age
  const joinDate       = new Date(user.created_at);
  const accountAgeDays = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

  // Activity score
  const activityScore = computeActivityScore(user, repos);

  const insights = {
    topLanguage,
    languageDistribution:      distribution,
    totalStars,
    totalForks,
    totalWatchers,
    avgRepoSizeKb:             parseFloat(avgSizeKb.toFixed(2)),
    reposWithDescriptionPct:   parseFloat(descriptionPct.toFixed(2)),
    mostStarredRepo:           starredRepo?.name          || null,
    mostStarredRepoUrl:        starredRepo?.html_url      || null,
    mostStarredCount:          starredRepo?.stargazers_count || 0,
    mostForkedRepo:            forkedRepo?.name           || null,
    mostForkedRepoUrl:         forkedRepo?.html_url       || null,
    mostForkedCount:           forkedRepo?.forks_count    || 0,
    originalReposCount:        originalRepos.length,
    forkedReposCount:          forkedRepos.length,
    archivedReposCount:        archivedRepos.length,
    accountAgeDays,
    activityScore,
  };

  return { user, repos, insights };
}

module.exports = { analyzeProfile };
