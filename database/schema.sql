-- ============================================================
-- GitHub Profile Analyzer — Database Schema
-- ============================================================
-- Run this file to initialize the database and all tables.
-- Usage: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS github_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE github_analyzer;

-- ------------------------------------------------------------
-- Table: profiles
-- Stores the top-level GitHub user snapshot
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                  INT           NOT NULL AUTO_INCREMENT,
  username            VARCHAR(100)  NOT NULL,
  name                VARCHAR(200)  DEFAULT NULL,
  bio                 TEXT          DEFAULT NULL,
  location            VARCHAR(200)  DEFAULT NULL,
  company             VARCHAR(200)  DEFAULT NULL,
  email               VARCHAR(200)  DEFAULT NULL,
  blog                VARCHAR(500)  DEFAULT NULL,
  avatar_url          VARCHAR(500)  DEFAULT NULL,
  github_url          VARCHAR(500)  DEFAULT NULL,
  public_repos        INT           NOT NULL DEFAULT 0,
  public_gists        INT           NOT NULL DEFAULT 0,
  followers           INT           NOT NULL DEFAULT 0,
  following           INT           NOT NULL DEFAULT 0,
  account_created_at  DATETIME      DEFAULT NULL COMMENT 'GitHub account creation date',
  account_updated_at  DATETIME      DEFAULT NULL COMMENT 'GitHub account last update date',
  analyzed_at         DATETIME      NOT NULL    COMMENT 'Timestamp of the last analysis fetch',
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username),
  INDEX idx_followers (followers DESC),
  INDEX idx_analyzed_at (analyzed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='GitHub user profile snapshots';

-- ------------------------------------------------------------
-- Table: profile_insights
-- Derived analytics computed from repositories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_insights (
  id                          INT           NOT NULL AUTO_INCREMENT,
  profile_id                  INT           NOT NULL,
  top_language                VARCHAR(100)  DEFAULT NULL COMMENT 'Most frequently used language',
  language_distribution       JSON          DEFAULT NULL COMMENT 'JSON map of language -> repo count',
  total_stars                 INT           NOT NULL DEFAULT 0 COMMENT 'Sum of stargazers across all repos',
  total_forks                 INT           NOT NULL DEFAULT 0,
  total_watchers              INT           NOT NULL DEFAULT 0,
  avg_repo_size_kb            DECIMAL(10,2) DEFAULT NULL,
  repos_with_description_pct  DECIMAL(5,2)  DEFAULT NULL COMMENT 'Percentage of repos with a description',
  most_starred_repo           VARCHAR(200)  DEFAULT NULL,
  most_starred_repo_url       VARCHAR(500)  DEFAULT NULL,
  most_starred_count          INT           NOT NULL DEFAULT 0,
  most_forked_repo            VARCHAR(200)  DEFAULT NULL,
  most_forked_repo_url        VARCHAR(500)  DEFAULT NULL,
  most_forked_count           INT           NOT NULL DEFAULT 0,
  original_repos_count        INT           NOT NULL DEFAULT 0 COMMENT 'Non-fork repos',
  forked_repos_count          INT           NOT NULL DEFAULT 0,
  archived_repos_count        INT           NOT NULL DEFAULT 0,
  account_age_days            INT           DEFAULT NULL,
  activity_score              DECIMAL(5,2)  DEFAULT NULL COMMENT 'Computed score 0-100',
  created_at                  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_profile_insight (profile_id),
  CONSTRAINT fk_insights_profile
    FOREIGN KEY (profile_id) REFERENCES profiles (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Computed analytics derived from a user''s repositories';

-- ------------------------------------------------------------
-- Table: repositories
-- Snapshot of each public repository
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS repositories (
  id                INT           NOT NULL AUTO_INCREMENT,
  profile_id        INT           NOT NULL,
  repo_name         VARCHAR(200)  NOT NULL,
  full_name         VARCHAR(300)  NOT NULL,
  description       TEXT          DEFAULT NULL,
  language          VARCHAR(100)  DEFAULT NULL,
  stars             INT           NOT NULL DEFAULT 0,
  forks             INT           NOT NULL DEFAULT 0,
  watchers          INT           NOT NULL DEFAULT 0,
  is_fork           TINYINT(1)    NOT NULL DEFAULT 0,
  is_archived       TINYINT(1)    NOT NULL DEFAULT 0,
  open_issues       INT           NOT NULL DEFAULT 0,
  repo_size_kb      INT           NOT NULL DEFAULT 0,
  repo_url          VARCHAR(500)  DEFAULT NULL,
  topics            JSON          DEFAULT NULL COMMENT 'Array of repo topics/tags',
  created_at_github DATETIME      DEFAULT NULL,
  pushed_at         DATETIME      DEFAULT NULL COMMENT 'Last push timestamp',
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_profile_id (profile_id),
  INDEX idx_stars (stars DESC),
  INDEX idx_language (language),
  CONSTRAINT fk_repos_profile
    FOREIGN KEY (profile_id) REFERENCES profiles (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Snapshot of public repositories for each analyzed profile';

-- ============================================================
-- Helpful Views
-- ============================================================

CREATE OR REPLACE VIEW v_profile_summary AS
SELECT
  p.username,
  p.name,
  p.location,
  p.followers,
  p.following,
  p.public_repos,
  pi.top_language,
  pi.total_stars,
  pi.total_forks,
  pi.activity_score,
  pi.account_age_days,
  p.analyzed_at
FROM profiles p
LEFT JOIN profile_insights pi ON pi.profile_id = p.id
ORDER BY pi.activity_score DESC;

-- ============================================================
-- Done
-- ============================================================
SELECT 'Database schema initialized successfully.' AS status;
