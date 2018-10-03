update t_column_info set data_type = 'string' where column_name in ('sample_requirement', 'sample_transport_condition');
ALTER TABLE `t_healthy`
CHANGE COLUMN `sample_requirement` `sample_requirement` VARCHAR(100) NOT NULL COMMENT '样本要求' ,
CHANGE COLUMN `sample_transport_condition` `sample_transport_condition` VARCHAR(100) NOT NULL COMMENT '样本运输条件' ;
ALTER TABLE `t_medical`
CHANGE COLUMN `sample_requirement` `sample_requirement` VARCHAR(100) NOT NULL COMMENT '样本要求' ,
CHANGE COLUMN `sample_transport_condition` `sample_transport_condition` VARCHAR(100) NOT NULL COMMENT '样本运输条件' ;
