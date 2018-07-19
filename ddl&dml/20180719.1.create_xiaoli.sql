-- MySQL dump 10.13  Distrib 8.0.11, for Win64 (x86_64)
--
-- Host: localhost    Database: xiaoli
-- ------------------------------------------------------
-- Server version	8.0.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `t_column_info`
--

DROP TABLE IF EXISTS `t_column_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t_column_info` (
  `table_name` varchar(30) NOT NULL COMMENT '表名',
  `column_name` varchar(45) NOT NULL COMMENT '字段名',
  `label` varchar(70) NOT NULL COMMENT '显示名称',
  `fixed` int(11) NOT NULL COMMENT '在列表页是否固定列：1:left,2:right,0:不固定',
  `list_display` tinyint(1) NOT NULL COMMENT '是否在列表页显示',
  `edit_display` tinyint(1) NOT NULL COMMENT '是否在编辑页显示',
  `editable` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否可编辑',
  `data_type` varchar(10) NOT NULL COMMENT '数据类型：string,number,text(表示很多文字),dictionary',
  `list_display_position` int(11) NOT NULL COMMENT '在列表页显示位置：0:正常显示,1:在扩展行显示',
  `order` int(11) NOT NULL COMMENT '顺序',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`column_name`,`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_dictionary`
--

DROP TABLE IF EXISTS `t_dictionary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t_dictionary` (
  `table_name` varchar(30) NOT NULL COMMENT '字典所在字段表名',
  `column_name` varchar(45) NOT NULL COMMENT '字典字段名',
  `value` varchar(10) NOT NULL COMMENT '字典值',
  `name` varchar(45) NOT NULL COMMENT '字典名',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`table_name`,`column_name`,`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `t_dictionary_AFTER_INSERT` AFTER INSERT ON `t_dictionary` FOR EACH ROW BEGIN
DECLARE sequenceExist INT;
if NEW.column_name = 'type_id' then
	select count(*) into sequenceExist from t_sequence where table_name = NEW.table_name and prefix = NEW.value;
    if sequenceExist = 0 then
		insert into t_sequence values (NEW.table_name, NEW.value, 1, 0, sysdate(), NEW.create_user, sysdate(), NEW.update_user, 1);
	else
		update t_sequence set sequence_number = 1, del_flag = 0, update_time = sysdate(), update_user = NEW.update_user, row_version = row_version + 1  where table_name = NEW.table_name and prefix = NEW.value;
    end if;
end if;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `t_healthy`
--

DROP TABLE IF EXISTS `t_healthy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t_healthy` (
  `serial` varchar(7) NOT NULL COMMENT '项目编号',
  `name` varchar(45) NOT NULL COMMENT '项目名称',
  `type_id` varchar(5) NOT NULL COMMENT '产品系列ID',
  `test_method` int(11) NOT NULL COMMENT '检测方法',
  `sample_requirement` int(11) NOT NULL COMMENT '样本要求',
  `sample_transport_condition` int(11) NOT NULL COMMENT '样本运输条件',
  `test_cycle_min` int(11) NOT NULL COMMENT '最小检测周期(工作日)',
  `test_cycle_max` int(11) NOT NULL COMMENT '最大检测周期(工作日)',
  `standard_charge` decimal(7,2) NOT NULL COMMENT '标准收费/人次',
  `agent_quotation` decimal(7,2) NOT NULL COMMENT '代理报价',
  `agent_price` varchar(45) NOT NULL COMMENT '代理价',
  `test_index` text COMMENT '检测指标及临床意义',
  `laboratory` int(11) NOT NULL COMMENT '实验室',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`serial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_medical`
--

DROP TABLE IF EXISTS `t_medical`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t_medical` (
  `serial` varchar(7) NOT NULL COMMENT '项目编号',
  `name` varchar(45) NOT NULL COMMENT '项目名称',
  `type_id` varchar(5) NOT NULL COMMENT '产品系列ID',
  `test_method` int(11) NOT NULL COMMENT '检测方法',
  `sample_requirement` int(11) NOT NULL COMMENT '样本要求',
  `sample_transport_condition` int(11) NOT NULL COMMENT '样本运输条件',
  `test_cycle_min` int(11) NOT NULL COMMENT '最小检测周期(工作日)',
  `test_cycle_max` int(11) NOT NULL COMMENT '最大检测周期(工作日)',
  `standard_charge` decimal(7,2) NOT NULL COMMENT '标准收费/人次',
  `agent_quotation` decimal(7,2) NOT NULL COMMENT '代理报价',
  `agent_price` varchar(45) NOT NULL COMMENT '代理价',
  `test_index` text COMMENT '检测指标及临床意义',
  `laboratory` int(11) NOT NULL COMMENT '实验室',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`serial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_sequence`
--

DROP TABLE IF EXISTS `t_sequence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t_sequence` (
  `table_name` varchar(30) NOT NULL COMMENT '使用序列的表名',
  `prefix` varchar(5) NOT NULL COMMENT '序列的前缀',
  `sequence_number` int(11) NOT NULL DEFAULT '1' COMMENT '当前该使用的序列号',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`table_name`,`prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_user`
--

DROP TABLE IF EXISTS `t_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `t_user` (
  `user_id` varchar(10) NOT NULL COMMENT '用户ID',
  `user_pass` varchar(50) NOT NULL COMMENT '用户密码',
  `del_flag` tinyint(4) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-07-19 10:38:52
