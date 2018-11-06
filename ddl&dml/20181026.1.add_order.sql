ALTER TABLE `t_dictionary`
ADD COLUMN `display_order` INT(11) NOT NULL DEFAULT '0' COMMENT '显示顺序' AFTER `name`;

ALTER TABLE `t_healthy`
ADD COLUMN `display_order` INT(11) NOT NULL DEFAULT '0' COMMENT '显示顺序' AFTER `laboratory`;

ALTER TABLE `t_medical`
ADD COLUMN `display_order` INT(11) NOT NULL DEFAULT '0' COMMENT '显示顺序' AFTER `laboratory`;

ALTER TABLE `t_mall_goods`
ADD COLUMN `display_order` INT(11) NOT NULL DEFAULT '0' COMMENT '显示顺序' AFTER `out_flag`;

ALTER TABLE `t_healthy`
COMMENT = '大健康数据' ;

ALTER TABLE `t_medical`
COMMENT = '医疗版数据' ;

ALTER TABLE `t_mall_goods`
COMMENT = '商城商品数据' ;

ALTER TABLE `t_healthy`
CHANGE COLUMN `type_id` `type_id` VARCHAR(5) NOT NULL COMMENT '产品系列' ;

ALTER TABLE `t_medical`
CHANGE COLUMN `type_id` `type_id` VARCHAR(5) NOT NULL COMMENT '产品系列' ;
