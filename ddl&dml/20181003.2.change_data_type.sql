ALTER TABLE `t_medical`
CHANGE COLUMN `sample_requirement` `sample_requirement` TEXT NOT NULL COMMENT '样本要求' ,
CHANGE COLUMN `sample_transport_condition` `sample_transport_condition` TEXT NOT NULL COMMENT '样本运输条件' ;
ALTER TABLE `t_healthy`
CHANGE COLUMN `sample_requirement` `sample_requirement` TEXT NOT NULL COMMENT '样本要求' ,
CHANGE COLUMN `sample_transport_condition` `sample_transport_condition` TEXT NOT NULL COMMENT '样本运输条件' ;
