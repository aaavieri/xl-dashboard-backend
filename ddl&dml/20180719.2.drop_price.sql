ALTER TABLE `t_medical` DROP COLUMN `agent_quotation`;
ALTER TABLE `t_healthy` DROP COLUMN `agent_quotation`;
DELETE FROM `t_column_info` WHERE column_name = 'agent_quotation';
