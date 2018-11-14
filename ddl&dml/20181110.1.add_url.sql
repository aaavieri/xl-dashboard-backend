ALTER TABLE `t_healthy`
ADD COLUMN `detail_url` VARCHAR(255) NULL COMMENT '产品详细页' AFTER laboratory;

ALTER TABLE `t_medical`
ADD COLUMN `detail_url` VARCHAR(255) NULL COMMENT '产品详细页' AFTER laboratory;

INSERT INTO `t_column_info` VALUES
 ('t_medical', 'detail_url', '产品详细页', 0, 1, 1, 1, 'url', 1, 14, 1, 0, sysdate(), 'system', sysdate(), 'system', 1);

INSERT INTO `t_column_info` VALUES
 ('t_healthy', 'detail_url', '产品详细页', 0, 1, 1, 1, 'url', 1, 14, 1, 0, sysdate(), 'system', sysdate(), 'system', 1);

ALTER TABLE `t_user`
ADD COLUMN `settings` TEXT NULL COMMENT '用户设置' AFTER user_pass;