INSERT INTO `t_column_info` VALUES ('t_mall_goods', 'picture_list', '图片列表', 0, 0, 1, 1, 'imgList', 1, 10, 1, 1, sysdate(), 'system', sysdate(), 'system', 1);

ALTER TABLE `t_mall_picture`
ADD COLUMN `name` VARCHAR(100) NOT NULL COMMENT '文件名' AFTER `id`;