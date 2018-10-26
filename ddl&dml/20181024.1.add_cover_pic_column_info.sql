INSERT INTO `t_column_info` (`table_name`, `column_name`, `label`, `fixed`, `list_display`, `edit_display`, `editable`, `data_type`, `list_display_position`, `order`, `nullable`, `del_flag`)
VALUES ('t_mall_goods', 'cover_pic_id', '封面图片', 0, 0, 1, 1, 'imgSelect', 0, 11, 1, 0);
DELETE FROM `t_column_info` WHERE `table_name` = 't_mall_goods' AND `column_name` = 'picture_list';
INSERT INTO `t_column_info` (`table_name`, `column_name`, `label`, `fixed`, `list_display`, `edit_display`, `editable`, `data_type`, `list_display_position`, `order`, `nullable`, `del_flag`)
VALUES ('t_mall_goods', 'picture_list', '图片列表', 0, 1, 0, 0, 'imgList', 1, 10, 1, 0);