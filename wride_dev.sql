-- MySQL dump 10.16  Distrib 10.1.21-MariaDB, for osx10.6 (i386)
--
-- Host: localhost    Database: localhost
-- ------------------------------------------------------
-- Server version	10.1.21-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actions`
--

DROP TABLE IF EXISTS `actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(2) NOT NULL,
  `username` varchar(20) NOT NULL,
  `wid` int(11) NOT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `seen` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `username_action` (`username`),
  KEY `wid` (`wid`),
  CONSTRAINT `actions_ibfk_1` FOREIGN KEY (`wid`) REFERENCES `wrides` (`id`),
  CONSTRAINT `username_action` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actions`
--

LOCK TABLES `actions` WRITE;
/*!40000 ALTER TABLE `actions` DISABLE KEYS */;
INSERT INTO `actions` VALUES (1,'1','john',10,'2018-02-26 17:33:03',0),(2,'1','john',11,'2018-02-26 17:33:03',0),(3,'2','john',12,'2018-02-26 17:33:04',0),(4,'2','john',11,'2018-02-26 17:33:06',0),(5,'1','john',12,'2018-02-26 17:43:55',0),(7,'1','hec',13,'2018-03-01 04:19:45',0);
/*!40000 ALTER TABLE `actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `followers`
--

DROP TABLE IF EXISTS `followers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `followers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `follower_username` varchar(20) NOT NULL,
  `username` varchar(20) NOT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `username_follower` (`username`),
  KEY `follower` (`follower_username`),
  CONSTRAINT `follower` FOREIGN KEY (`follower_username`) REFERENCES `users` (`username`),
  CONSTRAINT `username_follower` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `followers`
--

LOCK TABLES `followers` WRITE;
/*!40000 ALTER TABLE `followers` DISABLE KEYS */;
INSERT INTO `followers` VALUES (10,'john','hec','2018-02-23 00:13:41'),(13,'hec','john','2018-03-01 04:15:57');
/*!40000 ALTER TABLE `followers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `username` varchar(20) NOT NULL,
  `fname` varchar(50) NOT NULL,
  `lname` varchar(50) NOT NULL,
  `email` varchar(250) NOT NULL,
  `password` varchar(250) NOT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bio` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('hec','Hec','Hec','hec','$2a$10$Gi2AVQADjmSFxHxgtHYwaOUU2K./kSoPcSSuYXglu9u6j5UmsI6Su','2018-02-15 03:04:14',NULL),('john','John','Doyle','john@me.com','$2a$10$XYGW0u7NIt41Q.WheRb.tuwJR5GOqDW2Qb69wx0wqHbWM97owzvfO','2018-02-22 02:59:36',NULL),('mdavis','Miles','Davis','hec@me.com','$2a$10$f6LlkH1eWq9s97M6mq54hOwr3Yz3ei75hSceO1ZeWwMJIhFM63eym','2018-03-01 03:35:00',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wrides`
--

DROP TABLE IF EXISTS `wrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wrides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `title` varchar(50) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wrides` (`username`),
  CONSTRAINT `wrides` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wrides`
--

LOCK TABLES `wrides` WRITE;
/*!40000 ALTER TABLE `wrides` DISABLE KEYS */;
INSERT INTO `wrides` VALUES (1,'First post','Hex','2016-10-17 15:48:53','hec'),(2,'But I’m too old to go chasing you around, wasting my precious energy','Give me one reason','2018-02-17 16:52:34','hec'),(3,'We are gonna come together, we are gonna celebrate.','Birth','2018-02-17 16:53:58','hec'),(4,'Is in the way she often calls me out','KOL','2018-02-17 16:54:35','hec'),(5,'Life on Mars?','Bowie','2018-02-17 16:55:21','hec'),(6,'Look at those caveman go','Starman','2018-02-17 16:56:08','hec'),(7,'Penthouse','John Legend','2018-02-17 16:58:17','hec'),(8,'You cant always get what you want','RS','2018-02-17 16:59:02','hec'),(9,'Hello goodbye ','TB','2018-02-17 20:30:23','hec'),(10,'Took the break pads out the car... and it flew','Sampha','2018-02-17 23:59:07','hec'),(11,'Twice as much, ain’t twice as good','Mayer','2018-02-22 22:14:06','john'),(12,'Is there any love left to make?','Arrow','2018-02-22 22:14:41','john'),(13,' Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.','Test','2018-02-26 17:57:31','john'),(14,'Don’t over react... I pretended she was you. You wouldn’t want me to be lonely.','Amy','2018-03-01 03:16:03','hec'),(15,'How to disappear completely\n\nI am not here... this isn’t happening','How','2018-03-01 21:37:01','hec');
/*!40000 ALTER TABLE `wrides` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-03-01 16:05:32
