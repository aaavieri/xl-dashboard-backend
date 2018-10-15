var express = require('express');
var router = express.Router();
var dao = require('../dao/dao');
var util = require('../util/util')

router.use(util.loginChecker)
router.get('/getDictionary', function(req, res, next) {
    dao.execute(new dao.selectList('select concat(table_name, \'-\', column_name) as category_name, column_name, value, name from t_dictionary where del_flag = false', [], function (error, results, fields) {
        if (error) {
            return next(error)
        }
        var data = util.transferFromList(results, fields)
        var retData = {}
        data.map(function (item) {
            if (!retData[item.categoryName]) {
                retData[item.categoryName] = []
            }
            if (item.columnName !== 'type_id') {
                item.value = Number(item.value)
            }
            retData[item.categoryName].push(item)
        })
        Object.keys(retData).map(function (key) {
            if (key === 'type_id') {
                return
            }
            retData[key] = retData[key].sort(function (item1, item2) {
                return item1.value - item2.value
            })
        })
        res.json(util.getSuccessData(retData))
    }))
});

router.post('/addDictionary/:dataType/:type/:value', function(req, res, next) {
    var dataType = req.params.dataType
    var tableName = util.getTableName(dataType)
    var type = req.params.type
    var value = req.params.value
    var name = req.body.name
    var sessionUser = req.session.userInfo.userId
    dao.execute(new dao.insert('insert into t_dictionary values (?, ?, ?, ?, 0, sysdate(), ?, sysdate(), ?, 1)',
        [tableName, type, value, name, sessionUser, sessionUser], function (error, results) {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData(results))
    }))
});

router.get('/getColumnInfo/:dataType', function(req, res, next) {
    var dataType = req.params.dataType
    var tableName = util.getTableName(dataType)
    dao.execute(new dao.selectList('select * from t_column_info where table_name = ? and del_flag = false', [tableName], function (error, results, fields) {
        if (error) {
            return next(error)
        }
        var transferResults = util.transferFromList(results, fields).map(function (item) {
            item.columnName = util.underLineToHump(item.columnName)
            return item
        })
        res.json(util.getSuccessData(transferResults))
    }))
});

router.get('/getDataByType/:dataType', function(req, res, next) {
    var dataType = req.params.dataType
    var tableName = util.getTableName(dataType)
    dao.execute(new dao.selectList('select * from ' + tableName + ' where del_flag = false', [], function (error, results, fields) {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData(util.transferFromList(results, fields)))
    }))
});

router.get('/getRecord/:dataType/:serial', function(req, res, next) {
    var dataType = req.params.dataType
    var serial = req.params.serial
    var tableName = util.getTableName(dataType)
    dao.execute(new dao.selectOne('select * from ' + tableName + 'where serial = ? and del_flag = false', [serial], function (error, results, fields) {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData(util.transferFromRow(results, fields)))
    }))
});

router.post('/updateRecord/:dataType/:serial', function(req, res, next) {
    var dataType = req.params.dataType
    var serial = req.params.serial
    var rowData = req.body.rowData
    var tableName = util.getTableName(dataType)
    var sql = 'update ' + tableName + ' set '
    var params = []
    Object.keys(rowData).map(function (key) {
        if (util.isUpdateColumn(key) && key != 'serial') {
            sql += util.humpToUnderLine(key) + ' = ?, '
            params.push(rowData[key])
        }
    })
    sql += 'update_time = sysdate(), row_version = row_version + 1 where serial = ? and row_version = ?'
    params.push(serial, rowData.rowVersion)
    dao.execute(new dao.update(sql, params, function (error, results) {
        if (error) {
            return next(error)
        }
        if (results === 0) {
            res.json(util.getFailureData('更新失败，数据不是最新，请重新检索后再操作'))
        } else {
            res.json(util.getSuccessData(results))
        }
    }))
});

router.post('/deleteRecord/:dataType/:serial', function(req, res, next) {
    var dataType = req.params.dataType
    var serial = req.params.serial
    var rowVersion = req.body.rowVersion
    var tableName = util.getTableName(dataType)
    var sessionUser = req.session.userInfo.userId
    var sql = 'update ' + tableName + ' set del_flag = true, update_time = sysdate(), update_user = ?, row_version = row_version + 1 where serial = ? and row_version = ?'
    var params = [sessionUser, serial, rowVersion]
    dao.execute(new dao.update(sql, params, function (error, results) {
        if (error) {
            return next(error)
        }
        if (results === 0) {
            res.json(util.getFailureData('删除失败，数据不是最新，请重新检索后再操作'))
        } else {
            res.json(util.getSuccessData(results))
        }
    }))
});

router.post('/addRecord/:dataType', function(req, res, next) {
    var dataType = req.params.dataType
    var rowData = req.body.rowData
    var tableName = util.getTableName(dataType)
    var sessionUser = req.session.userInfo.userId
    var prefix = rowData.typeId || ''

    var sql = 'insert into ' + tableName + ' (serial, '
    var insertValueSql = ' values (?, '
    var params = ['']
    Object.keys(rowData).map(function (key) {
        if (util.isUpdateColumn(key) && key != 'serial') {
            sql += util.humpToUnderLine(key) + ', '
            insertValueSql += '?, '
            params.push(rowData[key])
        }
    })
    sql += 'del_flag, create_time, create_user, update_time, update_user, row_version)'
    insertValueSql += 'false, sysdate(), ?, sysdate(), ?, 1)'
    params.push(sessionUser, sessionUser)

    dao.executeTransaction({}, new dao.selectOne('select sequence_number, row_version from t_sequence where table_name = ? and prefix = ? and del_flag = false for update',
        [tableName, prefix], function (error, results, fields, others) {
            if (error) {
                return next(error)
            }
            if (!results) {
                throw new Error('没有该序列定义!')
            }
            others.commonParams.rowData = util.transferFromRow(results, fields)
            others.next.params.push(others.commonParams.rowData.rowVersion)
        }), new dao.update('update t_sequence set sequence_number = sequence_number + 1, row_version = row_version + 1' +
        ' where table_name = ? and prefix = ? and del_flag = false and row_version = ?',
        [tableName, prefix], function (error, results, others) {
            if (!error && results !== 1) {
                throw  new Error('数据被锁更新失败!')
            }
            if (error) {
                return next(error)
            }
            var sequenceNumber = others.commonParams.rowData.sequenceNumber
            others.commonParams.sequenceNumber = prefix + util.leftPad(sequenceNumber, 3)
            others.next.params[0] = others.commonParams.sequenceNumber
        }), new dao.insert(sql + insertValueSql, params, function (error, results, others) {
            if (error) {
                return next(error)
            }
            res.json(util.getSuccessData(others.commonParams.sequenceNumber))
        })
    )
});

router.get('/getSerial/:dataType/:prefix', function(req, res, next) {
    var dataType = req.params.dataType
    var prefix = req.params.prefix
    var tableName = util.getTableName(dataType)
    dao.executeTransaction({}, new dao.selectOne('select sequence_number, row_version from t_sequence where table_name = ? and prefix = ? and del_flag = false for update',
        [tableName, prefix], function (error, results, fields, others) {
            if (error) {
                return next(error)
            }
            if (!results) {
                return next(new Error('没有该序列定义!'))
            }
            others.commonParams.rowData = util.transferFromRow(results, fields)
            others.next.params.push(others.commonParams.rowData.rowVersion)
        }
    ), new dao.update('update t_sequence set sequence_number = sequence_number + 1, row_version = row_version + 1' +
        ' where table_name = ? and prefix = ? and del_flag = false and row_version = ?',
        [tableName, prefix], function (error, results, others) {
            if (!error && results !== 1) {
                error =  new Error('数据被锁更新失败!')
            }
            if (error) {
                return next(error)
            }
            var sequenceNumber = others.commonParams.rowData.sequenceNumber
            res.json(util.getSuccessData(util.leftPad(sequenceNumber, 5)))
        })
    )
});

// added by yinjiaolong 20181012 for goods
router.post('/updateGoods/:id', function(req, res, next) {
    let id = req.params.id
    let rowData = req.body.rowData
    let sql = 'update t_mall_goods set '
    let params = []
    Object.keys(rowData).map(function (key) {
        if (util.isUpdateColumn(key) && key != 'id') {
            sql += util.humpToUnderLine(key) + ' = ?, '
            params.push(rowData[key])
        }
    })
    sql += 'update_time = sysdate(), row_version = row_version + 1 where id = ? and row_version = ?'
    params.push(id, rowData.rowVersion)
    dao.execute(new dao.update(sql, params, function (error, results) {
        if (error) {
            return next(error)
        }
        if (results === 0) {
            res.json(util.getFailureData('更新失败，数据不是最新，请重新检索后再操作'))
        } else {
            res.json(util.getSuccessData(results))
        }
    }))
});

router.post('/deleteGoods/:serial', function(req, res, next) {
    let id = req.params.id
    let rowVersion = req.body.rowVersion
    let sessionUser = req.session.userInfo.userId
    let sql = 'update t_mall_goods set del_flag = true, update_time = sysdate(), update_user = ?, row_version = row_version + 1 where id = ? and row_version = ?'
    let params = [sessionUser, id, rowVersion]
    dao.execute(new dao.update(sql, params, function (error, results) {
        if (error) {
            return next(error)
        }
        if (results === 0) {
            res.json(util.getFailureData('删除失败，数据不是最新，请重新检索后再操作'))
        } else {
            res.json(util.getSuccessData(results))
        }
    }))
});

router.post('/addGoods', function(req, res, next) {
    let rowData = req.body.rowData
    let sessionUser = req.session.userInfo.userId

    let sql = 'insert into t_mall_goods (id, '
    let insertValueSql = ' values (?, '
    let params = [null]
    Object.keys(rowData).map(function (key) {
        if (util.isUpdateColumn(key) && key != 'id') {
            sql += util.humpToUnderLine(key) + ', '
            insertValueSql += '?, '
            params.push(rowData[key])
        }
    })
    sql += 'del_flag, create_time, create_user, update_time, update_user, row_version)'
    insertValueSql += 'false, sysdate(), ?, sysdate(), ?, 1)'
    params.push(sessionUser, sessionUser)

    dao.execute(new dao.insert(sql + insertValueSql, params, function (error, results, others) {
            if (error) {
                return next(error)
            }
            res.json(util.getSuccessData(others.commonParams.sequenceNumber))
        })
    )
});

module.exports = router;
