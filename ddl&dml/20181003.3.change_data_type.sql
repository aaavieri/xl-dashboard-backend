INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'id', '序列号', 1, 1, 0, 0, 'number', 0, 1, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);
INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'serial', '关联项目编号', 1, 1, 0, 0, 'string', 0, 2, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);
INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'name', '商品名称', 1, 1, 1, 1, 'string', 0, 3, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);
INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'type_id', '商品类别', 0, 1, 1, 0, 'dictionary', 0, 4, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);
INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'price', '价格', 0, 1, 1, 1, 'number', 0, 5, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);
INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'introduction', '商品介绍', 0, 1, 1, 1, 'text', 1, 6, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);
INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'attributes', '属性', 0, 1, 1, 1, 'jsonObject', 1, 7, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);
INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'faqs', '常见问题', 0, 1, 1, 1, 'jsonArray', 1, 8, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);
INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'out_flag', '缺货标志', 0, 0, 0, 0, 'check', 1, 9, 0, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system', 1);

UPDATE `t_dictionary` SET `table_name`='t_mall_goods' WHERE `table_name`='t_goods';

ALTER TABLE `t_column_info`
CHANGE COLUMN `data_type` `data_type` VARCHAR(10) NOT NULL COMMENT '数据类型：string,number,text(表示很多文字),dictionary,check,jsonArray,jsonObject' ;

ALTER TABLE `t_column_info`
ADD COLUMN `nullable` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '可以为空' AFTER `order`;

UPDATE `t_column_info` SET `nullable`='1' WHERE `column_name`='attributes' and`table_name`='t_mall_goods';
UPDATE `t_column_info` SET `nullable`='1' WHERE `column_name`='faqs' and`table_name`='t_mall_goods';
