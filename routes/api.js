var express = require('express');
var router = express.Router();
var dao = require('../dao/dao');
var util = require('../util/util')
var env = require('../config/env')

const dbInfo = require('../config/dbConnection')

const fs = require("fs")

router.use(util.loginChecker)
router.get('/getDictionary', function(req, res, next) {
    dao.execute(new dao.selectList(`select concat(d.table_name, '-', d.column_name) as category_name, d.table_name, d.column_name, d.value, d.name, d.display_order, d.del_flag,
        c.COLUMN_COMMENT as column_comment, c.ORDINAL_POSITION as ordinal_position, t.TABLE_COMMENT as table_comment from t_dictionary d inner join information_schema.COLUMNS c 
        on (c.TABLE_SCHEMA = '${dbInfo.database}' and d.table_name = c.TABLE_NAME and d.column_name = c.COLUMN_NAME)
        inner join information_schema.TABLES t on (t.TABLE_SCHEMA = '${dbInfo.database}' and d.table_name = t.TABLE_NAME)
        where d.del_flag = false order by d.table_name, c.ORDINAL_POSITION, d.display_order`, [], function (error, results, fields) {
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
                let displaySort = item1.displayOrder - item2.displayOrder
                return displaySort !== 0 ? displaySort : (item1.value - item2.value)
            })
        })
        res.json(util.getSuccessData(retData))
    }))
});

router.post('/addDictionary/:dataType/:type/:value', function(req, res, next) {
    let dataType = req.params.dataType
    let tableName = util.getTableName(dataType)
    let type = req.params.type
    let value = req.params.value
    let name = req.body.name
    let displayOrder = req.body.displayOrder || 0
    let sessionUser = req.session.userInfo.userId
    dao.execute(new dao.insert('insert into t_dictionary values (?, ?, ?, ?, ?, 0, sysdate(), ?, sysdate(), ?, 1)',
        [tableName, type, value, name, displayOrder, sessionUser, sessionUser], function (error, results) {
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
    // let sql = 'update t_mall_goods set '
    // let params = []
    // Object.keys(rowData).map(function (key) {
    //     if (util.isUpdateColumn(key) && key != 'id' && key != 'pictureList') {
    //         sql += util.humpToUnderLine(key) + ' = ?, '
    //         params.push(rowData[key])
    //     }
    // })
    // sql += 'update_time = sysdate(), row_version = row_version + 1 where id = ? and row_version = ?'
    // params.push(id, rowData.rowVersion)
    let {sql, params} = getGoodsUpdateInfo(id, rowData)
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

router.post('/deleteGoods/:id', function(req, res, next) {
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

router.get('/getPictureList/:goodsId', function (req, res, next) {
    let goodsId = req.params.goodsId
    let sql = `select p.id, p.name, p.url, p.local_flag, p.row_version from t_mall_goods_picture gp inner join t_mall_picture p
        on (gp.picture_id = p.id) where gp.goods_id = ? and gp.del_flag = false and p.del_flag = false`
    dao.execute(new dao.selectList(sql, goodsId, function (error, results, fields) {
        if (error) {
            return next(error)
        }
        let pictureList = util.transferFromList(results, fields)
        pictureList.map(function (picture) {
            if (picture.localFlag == 1) {
                picture.url = env.picPrefix + picture.url
            }
            return picture
        })
        res.json(util.getSuccessData(pictureList))
    }))
})

router.get('/getGoodsList', function(req, res, next) {
    dao.executeTransaction({}, new dao.selectList('select * from t_mall_goods where del_flag = false', [], function (error, results, fields, others) {
        if (error) {
            return next(error)
        }
        others.commonParams.goodsList = util.transferFromList(results, fields)
    }), new dao.selectList('select gp.goods_id, p.id, p.name, p.url, p.local_flag, p.row_version from t_mall_goods_picture gp inner join t_mall_picture p on (gp.picture_id = p.id)' +
        ' where gp.del_flag = false and p.del_flag = false', [], function (error, results, fields, others) {
        if (error) {
            return next(error)
        }
        let pictureList = util.transferFromList(results, fields).map(picture => {
            if (picture.localFlag == 1) {
                picture.url = env.picPrefix + picture.url
            }
            return picture
        })
        let goodsList = others.commonParams.goodsList.map(goods => {
            goods.pictureList = pictureList.filter(picture => picture.goodsId === goods.id)
            return goods
        })
        res.json(util.getSuccessData(goodsList))
    }))
});

// 暂时未使用
router.post('/v2/updateGoods/:id', function(req, res, next) {
    let id = req.params.id
    let rowData = req.body.rowData
    let sessionUser = req.session.userInfo.userId
    // let sql = 'update t_mall_goods set '
    // let params = []
    // Object.keys(rowData).map(function (key) {
    //     if (util.isUpdateColumn(key) && key != 'id' && key != 'pictureList') {
    //         sql += util.humpToUnderLine(key) + ' = ?, '
    //         params.push(rowData[key])
    //     }
    // })
    // sql += 'update_time = sysdate(), row_version = row_version + 1 where id = ? and row_version = ?'
    // params.push(id, rowData.rowVersion)
    let {sql, params} = getGoodsUpdateInfo(id, rowData)
    let insertPicSql = 'insert into t_mall_goods_picture (goods_id, picture_id, del_flag) (select 0 as goods_id, 0 as picture_id, false as del_flag from dual where false '
    let insertPicParam = []
    let updatePicSql = 'update t_mall_goods_picture gp set del_flag = true, update_time = sysdate(), update_user = ?, row_version = row_version + 1 '
        + 'where not exists (select * from (select 0 as goods_id, 0 as picture_id, false as del_flag from dual where false '
    let updatePicParam = [sessionUser]
    let snippets = rowData.pictureList.map(picture => {
        insertPicParam.push(id, picture.id)
        updatePicParam.push(id, picture.id)
        return 'select ? as goods_id, ? as picture_id, false as del_flag from dual'
    })
    if (snippets.length > 0) {
        insertPicSql += `union all select * from (${snippets.join(' union all ')}) d
        where not exists (select * from t_mall_goods_picture gp where d.goods_id = gp.goods_id and d.picture_id = gp.picture_id and gp.del_flag = false)`
        updatePicSql += `union all ${snippets.join(' union all ')}`
    }
    insertPicSql += ')'
    updatePicSql += ') d where d.goods_id = gp.goods_id and d.picture_id = gp.picture_id)'
    dao.executeTransaction({}, new dao.update(sql, params, function (error, changeRows) {
        if (error) {
            return next(error)
        }
        if (changeRows === 0) {
            throw new Error('更新失败，数据不是最新，请重新检索后再操作')
        }
    }), new dao.insert(insertPicSql, insertPicParam, function (error, insertIds, others) {
        if (error) {
            return next(error)
        }
    }), new dao.update(updatePicSql, updatePicParam, function (error, changeRows, others) {
        if (error) {
            return next(error)
        }
    }), new dao.update('update t_mall_picture p set del_flag = true, update_time = sysdate(), update_user = ?, row_version = row_version + 1 ' +
        'where not exists (select * from t_mall_goods_picture gp where p.id = gp.picture_id and gp.del_flag = false) and p.del_flag = false', [sessionUser],
        function (error, changeRows, others) {
        if (error) {
            return next(error)
        }
    }), new dao.selectList('select p.id, p.url, p.local_flag from t_mall_picture p inner join t_mall_goods_picture gp on ' +
        '(p.id = gp.picture_id) where gp.goods_id = ? and gp.del_flag = true and p.del_flag = true', [id], function (error, results, fields, others) {
        if (error) {
            return next(error)
        }
        let deletePics = util.transferFromList(results, fields).filter(picture => picture.localFlag == 1)
        deletePics.map(picture => {
            if (fs.existsSync(env.picStorePath + picture.url)) {
                fs.unlinkSync(env.picStorePath + picture.url)
            }
        })
        res.json(util.getSuccessData({}))
    }))
});

router.post('/v2/deleteGoods/:id', function(req, res, next) {
    let id = req.params.id
    let rowVersion = req.body.rowVersion
    let sessionUser = req.session.userInfo.userId
    let goodsSql = 'update t_mall_goods set del_flag = true, update_time = sysdate(), update_user = ?, row_version = row_version + 1 where id = ? and row_version = ?'
    let pictureSql = 'update t_mall_goods_picture gp, t_mall_picture p set gp.del_flag = true, gp.update_time = sysdate(), gp.update_user = ?, gp.row_version = gp.row_version + 1, ' +
        'p.del_flag = true, p.update_time = sysdate(), p.update_user = ?, p.row_version = p.row_version + 1  where gp.goods_id = ? and gp.picture_id = p.id'
    let params = [sessionUser, id, rowVersion]
    dao.executeTransaction({}, new dao.update(goodsSql, params, function (error, results) {
        if (error) {
            return next(error)
        }
        if (results === 0) {
            throw new Error('删除失败，数据不是最新，请重新检索后再操作')
        }
    }), new dao.update(pictureSql, [sessionUser, sessionUser, id], function (error, results) {
        if (error) {
            return next(error)
        }
    }), new dao.selectList('select p.id, p.url, p.local_flag from t_mall_goods_picture gp, t_mall_picture p ' +
        'where gp.goods_id = ? and gp.picture_id = p.id and gp.del_flag = true and p.del_flag = true', [id], function (error, results, fields) {
        if (error) {
            return next(error)
        }
        let deletePics = util.transferFromList(results, fields).filter(picture => picture.localFlag == 1)
        deletePics.map(picture => {
            if (fs.existsSync(env.picStorePath + picture.url)) {
                fs.unlinkSync(env.picStorePath + picture.url)
            }
        })
        res.json(util.getSuccessData({}))
    }))
});

router.post('/v2/addGoods', function(req, res, next) {
    let rowData = req.body.rowData
    let sessionUser = req.session.userInfo.userId

    let sql = 'insert into t_mall_goods (id, '
    let insertValueSql = ' values (?, '
    let params = [null]
    Object.keys(rowData).map(function (key) {
        if (util.isUpdateColumn(key) && key != 'id' && key != 'pictureList') {
            sql += util.humpToUnderLine(key) + ', '
            insertValueSql += '?, '
            if (key == 'coverPicId' && rowData[key] == 0) {
                params.push(null)
            } else {
                params.push(rowData[key])
            }
        }
    })
    sql += 'del_flag, create_time, create_user, update_time, update_user, row_version)'
    insertValueSql += 'false, sysdate(), ?, sysdate(), ?, 1)'
    params.push(sessionUser, sessionUser)

    let insertPicSql = 'insert into t_mall_goods_picture (goods_id, picture_id, del_flag) (select 0 as goods_id, 0 as picture_id, false as del_flag from dual where false '
    let snippets = rowData.pictureList.map(picture => {
        return 'select ? as goods_id, ? as picture_id, false as del_flag from dual'
    })
    if (snippets.length > 0) {
        insertPicSql += `union all select * from (${snippets.join(' union all ')}) d 
        where not exists (select * from t_mall_goods_picture gp where d.goods_id = gp.goods_id 
        and d.picture_id = gp.picture_id and gp.del_flag = false)`
    }
    insertPicSql += ')'
    dao.executeTransaction({}, new dao.insert(sql + insertValueSql, params, function (error, insertId, others) {
        if (error) {
            return next(error)
        }
        others.commonParams.id = insertId
        rowData.pictureList.map(picture => {
            others.next.params.push(...[insertId, picture.id])
        })
    }), new dao.insert(insertPicSql, [], function (error, insertIds, others) {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData(others.commonParams.id))
    }))
});

// 删除无用的图片
router.post('/deleteSurplusPictures', function (req, res, next) {
    let sessionUser = req.session.userInfo.userId
    dao.executeTransaction({}, new dao.selectList('select p.id, p.url, p.local_flag from t_mall_picture p left join t_mall_goods_picture gp' +
        ' on (p.id = gp.picture_id) where p.del_flag <> gp.del_flag or gp.del_flag is null', [], function (error, results, fields, others) {
        if (error) {
            return next(error)
        }
        let deletePics = util.transferFromList(results, fields)
        let deleteIds = deletePics.map(picture => picture.id)
        others.next.params.push(sessionUser, -1, ...deleteIds)
        others.next.statement = `update t_mall_picture p set p.del_flag = true, p.update_time = sysdate(), p.update_user = ?, p.row_version = p.row_version + 1 
        where p.id in (${new Array(deleteIds.length + 1).fill('?').join(',')}) and p.del_flag = false`
        others.commonParams.deleteInfo = {
            deletePics,
            deleteIds
        }
    }), new dao.update('', [], function (error, results, others) {
        if (error) {
            return next(error)
        }
        let {deleteIds} = others.commonParams.deleteInfo
        others.next.params.push(sessionUser, -1, ...deleteIds)
        others.next.statement = `update t_mall_goods_picture gp set gp.del_flag = true, gp.update_time = sysdate(), gp.update_user = ?, gp.row_version = gp.row_version + 1 
        where gp.picture_id in (${new Array(deleteIds.length + 1).fill('?').join(',')}) and gp.del_flag = false`
    }), new dao.update('', [], function (error, results, others) {
        if (error) {
            return next(error)
        }
        let {deletePics} = others.commonParams.deleteInfo
        deletePics.filter(picture => picture.localFlag == 1).map(picture => {
            if (fs.existsSync(env.picStorePath + picture.url)) {
                fs.unlinkSync(env.picStorePath + picture.url)
            }
        })
        res.json(util.getSuccessData({}))
    }))
})

router.post('/updateDictionary', function (req, res, next) {
    let needSaveData = req.body.needSaveData
    let sessionUser = req.session.userInfo.userId
    let sqlFuncs = []
    needSaveData.map(item => {
        let itemSqlFuncs = item.updateDataList.map(data => {
            if (data.isInDb) {
                return new dao.update('update t_dictionary set name = ?, display_order = ?, del_flag = ?, update_time = sysdate(), update_user = ?, row_version = row_version + 1' +
                    ' where table_name = ? and column_name = ? and value = ? and del_flag = false',
                [data.editName, data.editDisplayOrder, data.delFlag, sessionUser, item.tableName, item.columnName, data.value], function (error, changeRows, others) {
                    if (error) {
                        return next(error)
                    }
                })
            } else {
                return new dao.insert('insert into t_dictionary (table_name, column_name, value, name, display_order, del_flag, create_time, create_user, update_time, update_user, row_version)' +
                    ' values (?, ?, ?, ?, ?, 0, sysdate(), ?, sysdate(), ?, 1)',
                [item.tableName, item.columnName, data.value, data.editName, data.editDisplayOrder, sessionUser, sessionUser], function (error, insertId, others) {
                    if (error) {
                        return next(error)
                    }
                })
            }
        })
        sqlFuncs.push(...itemSqlFuncs)
    })
    sqlFuncs.push(new dao.delete('delete from t_dictionary where del_flag = true', [], function (error) {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData({}))
    }))
    dao.executeTransaction({}, ...sqlFuncs)
})

function getGoodsUpdateInfo (id, rowData) {
    let sql = 'update t_mall_goods set '
    let params = []
    Object.keys(rowData).map(function (key) {
        if (util.isUpdateColumn(key) && key != 'id' && key != 'pictureList') {
            sql += util.humpToUnderLine(key) + ' = ?, '
            if (key == 'coverPicId' && rowData[key] == 0) {
                params.push(null)
            } else {
                params.push(rowData[key])
            }
        }
    })
    sql += 'update_time = sysdate(), row_version = row_version + 1 where id = ? and row_version = ?'
    params.push(id, rowData.rowVersion)
    return {sql, params}
}
module.exports = router;
