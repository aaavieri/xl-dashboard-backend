var dao = require('../dao/dao');
var util = require('../util/util')

/**
 * 自动获取序列号
 * @param tableName 表名
 * @param prefix 前缀词
 * @param callback 回调函数，应该是function(error, sequenceNo)
 */
exports.getSequence = function (tableName, prefix, callback) {
    dao.executeTransaction({}, new dao.selectOne('select sequence_number, row_version from t_sequence where table_name = ? and prefix = ? and del_flag = false for update',
        [tableName, prefix], function (error, results, fields, others) {
            if (error) {
                return callback(error)
            }
            if (!results) {
                throw new Error('没有该序列定义!')
            }
            others.commonParams.rowData = util.transferFromRow(results, fields)
            others.next.params.push(others.commonParams.rowData.rowVersion)
        }
        ), new dao.update('update t_sequence set sequence_number = sequence_number + 1, row_version = row_version + 1' +
        ' where table_name = ? and prefix = ? and del_flag = false and row_version = ?',
        [tableName, prefix], function (error, results, others) {
            if (!error && results !== 1) {
                throw  new Error('数据被锁或其它原因导致更新失败!')
            }
            if (error) {
                return callback(error)
            }
            var sequenceNumber = others.commonParams.rowData.sequenceNumber
            return callback(null, prefix + util.leftPad(sequenceNumber, 3))
        })
    )
}