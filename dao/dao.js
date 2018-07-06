var mysql =  require('mysql');
var dbParams = require('../config/dbConnection')
var appLog = require('../logger/appLogger')
const pool =  mysql.createPool(dbParams);

// var executor = function (statement, params, callback) {
//     this.statement = statement
//     this.params = params
//     this.callback = callback
//     var that = this
//     this.execute = function () {
//         appLog.info('execute sql: ' + that.statement)
//         appLog.info('params: ' + that.params)
//         pool.getConnection(function (err, connection) {
//             if (err) {
//                 appLog.error(err)
//                 if (connection) connection.release()
//                 throw err
//             }
//             appLog.info('start sql')
//             connection.query(that.statement, that.params, function () {
//
//             });
//             appLog.info('end sql')
//             connection.release();
//             appLog.info('source released')
//         })
//     }
// }

var executeSqlFunc = function (sqlFunc) {
    appLog.info('execute sql: ' + sqlFunc.statement)
    appLog.info('params: ' + sqlFunc.params)
    pool.getConnection(function (err, connection) {
        if (err) {
            appLog.error(err)
            if (connection) connection.release()
            sqlFunc.callback(err)
        }
        appLog.info('start sql')
        executeSql(connection, sqlFunc.statement, sqlFunc.params, function (error, results, fields) {
            sqlFunc.bizCallback(error, results, fields)
        })
        appLog.info('end sql')
        connection.release();
        appLog.info('source released')
    })
}

var executeSql = function (connection, statement, params, callback) {
    appLog.info('execute sql: ' + statement)
    appLog.info('params: ' + params)
    appLog.info('start sql')
    connection.query(statement, params, callback);
    appLog.info('end sql')
}

/**
 *
 * @param commonParams 用来存放sql操作中所需要用到的参数的，或者在callback中需要用到的参数
 * @param sqlFuncArr 同一个事务里的所有sql操作
 */
var transactionSqlFunc = function (commonParams, sqlFuncs) {
    var sqlFuncArr = Array.prototype.slice.apply(arguments).slice(1)
    if (sqlFuncArr.length === 0) {
        return
    }
    var firstSqlFunc = sqlFuncArr[0]
    pool.getConnection(function (err, connection) {
        if (err) {
            appLog.error(err)
            if (connection) connection.release()
            firstSqlFunc.callback(err)
        }
        appLog.info('start transaction')
        connection.beginTransaction(function(err) {
            if (err) {
                appLog.error(err)
                connection.release()
                firstSqlFunc.callback(err)
            }
            // for (var i = 0; i < sqlFuncArr.length - 1; i++) {
            //     var callback = sqlFuncArr[i].bizCallback
            //     var next = sqlFuncArr[i + 1]
            //     sqlFuncArr[i].next = next
            //     sqlFuncArr[i].bizCallback = function (error, results, fields) {
            //         if (error) {
            //             appLog.error(error)
            //             return connection.rollback(function() {
            //                 sqlFuncArr[i].callback(error)
            //             });
            //         }
            //         try {
            //             callback(error, results, fields, {
            //                 commonParams: commonParams,
            //                 next: next
            //             })
            //         } catch (err) {
            //             appLog.error(err)
            //             return connection.rollback(function() {
            //                 sqlFuncArr[i].callback(err)
            //             });
            //         }
            //         executeSql(connection, next.statement, next.params, next.bizCallback)
            //     }
            // }
            var newSqlFuncArr =  sqlFuncArr.map(function (sqlFunc, index) {
                if (index === sqlFuncArr.length - 1) {
                    return sqlFunc
                }
                var callback = sqlFunc.bizCallback
                var next = sqlFuncArr[index + 1]
                sqlFunc.next = next
                sqlFunc.bizCallback = function (error, results, fields) {
                    if (error) {
                        appLog.error(error)
                        return connection.rollback(function () {
                            connection.release()
                            sqlFunc.callback(error)
                        });
                    }
                    try {
                        callback(error, results, fields, {
                            commonParams: commonParams,
                            next: next
                        })
                    } catch (err) {
                        appLog.error(err)
                        return connection.rollback(function () {
                            connection.release()
                            sqlFunc.callback(err)
                        });
                    }
                    executeSql(connection, next.statement, next.params, next.bizCallback)
                }
                return sqlFunc
            })
            firstSqlFunc = newSqlFuncArr[0]

            var lastSqlFunc = newSqlFuncArr[sqlFuncArr.length - 1]
            var lastCallback = lastSqlFunc.bizCallback
            lastSqlFunc.bizCallback = function (error, results, fields) {
                if (error) {
                    appLog.error(error)
                    return connection.rollback(function() {
                        appLog.error('doing rollback')
                        connection.release()
                        lastSqlFunc.callback(error)
                    })
                }
                connection.commit(function(error) {
                    if (error) {
                        appLog.error(error)
                        return connection.rollback(function() {
                            appLog.error('doing rollback')
                            connection.release()
                            lastSqlFunc.callback(error)
                        });
                    }
                    connection.release()
                    console.log('success!');
                });
                try {
                    lastCallback(error, results, fields, {
                        commonParams: commonParams
                    })
                } catch (err) {
                    appLog.error(err)
                    lastSqlFunc.callback(err)
                }
            }

            // 开始执行
            executeSql(connection, firstSqlFunc.statement, firstSqlFunc.params, firstSqlFunc.bizCallback)
        })
        appLog.info('end transaction')
    })
}

var baseFunc = function (statement, params, callback) {
    this.statement = statement
    this.params = params
    this.callback = callback
}


var selectOneFunc = function (statement, params, callback) {
    baseFunc.apply(this, arguments)
    this.bizCallback = function(error, results, fields, others) {
        if (!error && results.length > 1) {
            error = new Error('too many results but expect one')
        }
        callback.apply(null, [error, results.length == 0 ? null : results[0], fields, others])
    }
}

var selectListFunc = function (statement, params, callback) {
    baseFunc.apply(this, arguments)
    this.bizCallback = function(error, results, fields, others) {
        callback.apply(null, [error, results, fields, others])
    }
}

var insertFunc = function (statement, params, callback) {
    baseFunc.apply(this, arguments)
    this.bizCallback = function(error, results, fields, others) {
        callback.apply(null, [error, results ? results.insertId : null, others])
    }
}

var updateFunc = function (statement, params, callback) {
    baseFunc.apply(this, arguments)
    this.bizCallback = function(error, results, fields, others) {
        callback.apply(null, [error, results.changedRows, others])
    }
}

var deleteFunc = function (statement, params, callback) {
    baseFunc.apply(this, arguments)
    this.bizCallback = function(error, results, fields, others) {
        callback.apply(null, [error, results.affectedRows, others])
    }
}

const dbInterface = {
    selectOne: selectOneFunc,
    selectList: selectListFunc,
    insert: insertFunc,
    update: updateFunc,
    delete: deleteFunc,
    execute: executeSqlFunc,
    executeTransaction: transactionSqlFunc
}
module.exports = dbInterface;