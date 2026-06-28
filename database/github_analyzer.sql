-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: github_analyzer
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `profile_insights`
--

DROP TABLE IF EXISTS `profile_insights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `profile_insights` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) NOT NULL,
  `top_language` varchar(100) DEFAULT NULL COMMENT 'Most frequently used language',
  `language_distribution` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON map of language -> repo count' CHECK (json_valid(`language_distribution`)),
  `total_stars` int(11) NOT NULL DEFAULT 0 COMMENT 'Sum of stargazers across all repos',
  `total_forks` int(11) NOT NULL DEFAULT 0,
  `total_watchers` int(11) NOT NULL DEFAULT 0,
  `avg_repo_size_kb` decimal(10,2) DEFAULT NULL,
  `repos_with_description_pct` decimal(5,2) DEFAULT NULL COMMENT 'Percentage of repos with a description',
  `most_starred_repo` varchar(200) DEFAULT NULL,
  `most_starred_repo_url` varchar(500) DEFAULT NULL,
  `most_starred_count` int(11) NOT NULL DEFAULT 0,
  `most_forked_repo` varchar(200) DEFAULT NULL,
  `most_forked_repo_url` varchar(500) DEFAULT NULL,
  `most_forked_count` int(11) NOT NULL DEFAULT 0,
  `original_repos_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Non-fork repos',
  `forked_repos_count` int(11) NOT NULL DEFAULT 0,
  `archived_repos_count` int(11) NOT NULL DEFAULT 0,
  `account_age_days` int(11) DEFAULT NULL,
  `activity_score` decimal(5,2) DEFAULT NULL COMMENT 'Computed score 0-100',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profile_insight` (`profile_id`),
  CONSTRAINT `fk_insights_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Computed analytics derived from a user''s repositories';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profile_insights`
--

LOCK TABLES `profile_insights` WRITE;
/*!40000 ALTER TABLE `profile_insights` DISABLE KEYS */;
INSERT INTO `profile_insights` VALUES (1,1,'C','{\"C\":10,\"C++\":1,\"OpenSCAD\":1}',250459,64000,250459,537531.33,100.00,'linux','https://github.com/torvalds/linux',237874,'linux','https://github.com/torvalds/linux',62912,9,3,1,5411,65.73,'2026-06-28 12:46:30');
/*!40000 ALTER TABLE `profile_insights` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `company` varchar(200) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `blog` varchar(500) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `github_url` varchar(500) DEFAULT NULL,
  `public_repos` int(11) NOT NULL DEFAULT 0,
  `public_gists` int(11) NOT NULL DEFAULT 0,
  `followers` int(11) NOT NULL DEFAULT 0,
  `following` int(11) NOT NULL DEFAULT 0,
  `account_created_at` datetime DEFAULT NULL COMMENT 'GitHub account creation date',
  `account_updated_at` datetime DEFAULT NULL COMMENT 'GitHub account last update date',
  `analyzed_at` datetime NOT NULL COMMENT 'Timestamp of the last analysis fetch',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`),
  KEY `idx_followers` (`followers`),
  KEY `idx_analyzed_at` (`analyzed_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GitHub user profile snapshots';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
INSERT INTO `profiles` VALUES (1,'torvalds','Linus Torvalds',NULL,'Portland, OR','Linux Foundation',NULL,NULL,'https://avatars.githubusercontent.com/u/1024025?v=4','https://github.com/torvalds',12,1,309133,0,'2011-09-03 15:26:22','2026-06-17 17:35:14','2026-06-28 12:51:14','2026-06-28 12:46:30');
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repositories`
--

DROP TABLE IF EXISTS `repositories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repositories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) NOT NULL,
  `repo_name` varchar(200) NOT NULL,
  `full_name` varchar(300) NOT NULL,
  `description` text DEFAULT NULL,
  `language` varchar(100) DEFAULT NULL,
  `stars` int(11) NOT NULL DEFAULT 0,
  `forks` int(11) NOT NULL DEFAULT 0,
  `watchers` int(11) NOT NULL DEFAULT 0,
  `is_fork` tinyint(1) NOT NULL DEFAULT 0,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `open_issues` int(11) NOT NULL DEFAULT 0,
  `repo_size_kb` int(11) NOT NULL DEFAULT 0,
  `repo_url` varchar(500) DEFAULT NULL,
  `topics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of repo topics/tags' CHECK (json_valid(`topics`)),
  `created_at_github` datetime DEFAULT NULL,
  `pushed_at` datetime DEFAULT NULL COMMENT 'Last push timestamp',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_profile_id` (`profile_id`),
  KEY `idx_stars` (`stars`),
  KEY `idx_language` (`language`),
  CONSTRAINT `fk_repos_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Snapshot of public repositories for each analyzed profile';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repositories`
--

LOCK TABLES `repositories` WRITE;
/*!40000 ALTER TABLE `repositories` DISABLE KEYS */;
INSERT INTO `repositories` VALUES (13,1,'linux','torvalds/linux','Linux kernel source tree','C',237874,62912,237874,0,0,3,6206564,'https://github.com/torvalds/linux',NULL,'2011-09-04 22:48:12','2026-06-28 11:43:09','2026-06-28 12:51:14'),(14,1,'test-tlb','torvalds/test-tlb','Stupid memory latency and TLB tester','C',1023,218,1023,0,0,13,19,'https://github.com/torvalds/test-tlb',NULL,'2017-03-24 20:06:37','2024-08-19 21:13:36','2026-06-28 12:51:14'),(15,1,'ScrollWheel','torvalds/ScrollWheel','Minimalist RP2350 magnetic sensor scroll wheel toy project','C',347,13,347,0,0,8,15,'https://github.com/torvalds/ScrollWheel',NULL,'2026-06-02 15:48:56','2026-06-02 15:52:37','2026-06-28 12:51:14'),(16,1,'subsurface-for-dirk','torvalds/subsurface-for-dirk','Do not use - the real upstream is  Subsurface-divelog/subsurface','C++',465,67,465,1,0,2,155337,'https://github.com/torvalds/subsurface-for-dirk',NULL,'2017-01-11 18:03:01','2024-08-28 08:00:07','2026-06-28 12:51:14'),(17,1,'AudioNoise','torvalds/AudioNoise','Random digital audio effects','C',4393,207,4393,0,0,31,1428,'https://github.com/torvalds/AudioNoise',NULL,'2026-01-09 02:33:29','2026-05-08 17:20:22','2026-06-28 12:51:14'),(18,1,'GuitarPedal','torvalds/GuitarPedal','Linus learns analog circuits','C',2048,83,2048,0,0,3,9110,'https://github.com/torvalds/GuitarPedal',NULL,'2025-09-17 01:01:29','2026-06-27 04:04:58','2026-06-28 12:51:14'),(19,1,'HunspellColorize','torvalds/HunspellColorize','Wrapper around \'less\' to colorize spelling mistakes using Hunspell','C',349,15,349,0,0,2,15,'https://github.com/torvalds/HunspellColorize',NULL,'2026-01-18 19:57:03','2026-01-19 20:23:09','2026-06-28 12:51:14'),(20,1,'1590A','torvalds/1590A','Random odd guitar pedal design in kicad','OpenSCAD',568,21,568,0,1,0,10882,'https://github.com/torvalds/1590A',NULL,'2025-03-01 04:36:29','2025-09-19 02:54:14','2026-06-28 12:51:14'),(21,1,'uemacs','torvalds/uemacs','Random version of microemacs with my private modificatons','C',2065,311,2065,0,0,15,478,'https://github.com/torvalds/uemacs',NULL,'2018-01-17 22:32:21','2026-02-25 19:15:47','2026-06-28 12:51:14'),(22,1,'pesconvert','torvalds/pesconvert','Brother PES file converter','C',566,74,566,0,0,6,17,'https://github.com/torvalds/pesconvert',NULL,'2017-12-04 21:58:56','2022-12-22 10:46:37','2026-06-28 12:51:14'),(23,1,'libgit2','torvalds/libgit2','A cross-platform, linkable library implementation of Git that you can use in your application.','C',367,28,367,1,0,1,62768,'https://github.com/torvalds/libgit2',NULL,'2022-07-30 03:30:56','2023-12-19 11:45:42','2026-06-28 12:51:14'),(24,1,'libdc-for-dirk','torvalds/libdc-for-dirk','Only use for syncing with Dirk, don\'t use for anything else','C',394,51,394,1,0,1,3743,'https://github.com/torvalds/libdc-for-dirk',NULL,'2017-01-17 00:25:49','2024-12-26 20:12:43','2026-06-28 12:51:14');
/*!40000 ALTER TABLE `repositories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `v_profile_summary`
--

DROP TABLE IF EXISTS `v_profile_summary`;
/*!50001 DROP VIEW IF EXISTS `v_profile_summary`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_profile_summary` AS SELECT
 1 AS `username`,
  1 AS `name`,
  1 AS `location`,
  1 AS `followers`,
  1 AS `following`,
  1 AS `public_repos`,
  1 AS `top_language`,
  1 AS `total_stars`,
  1 AS `total_forks`,
  1 AS `activity_score`,
  1 AS `account_age_days`,
  1 AS `analyzed_at` */;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_profile_summary`
--

/*!50001 DROP VIEW IF EXISTS `v_profile_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_profile_summary` AS select `p`.`username` AS `username`,`p`.`name` AS `name`,`p`.`location` AS `location`,`p`.`followers` AS `followers`,`p`.`following` AS `following`,`p`.`public_repos` AS `public_repos`,`pi`.`top_language` AS `top_language`,`pi`.`total_stars` AS `total_stars`,`pi`.`total_forks` AS `total_forks`,`pi`.`activity_score` AS `activity_score`,`pi`.`account_age_days` AS `account_age_days`,`p`.`analyzed_at` AS `analyzed_at` from (`profiles` `p` left join `profile_insights` `pi` on(`pi`.`profile_id` = `p`.`id`)) order by `pi`.`activity_score` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-28 18:59:54
