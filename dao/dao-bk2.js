var mysql =  require('mysql');
var dbParams = require('../config/dbConnection')
var appLog = require('../logger/appLogger')
const pool =  mysql.createPool(dbParams);

var executor = function (statement, params, callback) {
    this.statement = statement
    this.params = params
    this.callback = callback
    var that = this
    this.execute = function () {
        appLog.info('execute sql: ' + that.statement)
        appLog.info('params: ' + that.params)
        pool.getConnection(function (err, connection) {
            if (err) {
                appLog.error(err)
                if (connection) connection.release()
                throw err
            }
            appLog.info('start sql')
            connection.query(that.statement, that.params, function () {
                
            });
            appLog.info('end sql')
            connection.release();
            appLog.info('source released')
        })
    }
}

var comProcessErrCallback = function (error) {
    if (error) throw error
}

var selectOneFunc = function (statement, params, callback) {
    this.statement = statement
    this.params = params
    this.originCallback = callback
    this.callback = function (error, results, fields) {
        if (results.length > 1) {
            throw new Error('too many results but expect one')
        }
        callback(results.length == 0 ? null : results[0], fields)
    }
    this.processErrCallback = comProcessErrCallback
    var func = this
    this.wholeCallback = function (error, results, fields) {
        func.processErrCallback(error)
    }
    var instance = new executor(this.statement, this.params, this.wholeCallback)
    this.execute = function () {
        instance.execute()
    }
}

var selectListFunc = function (statement, params, callback) {
    this.statement = statement
    this.params = params
    this.callback = callback
    var instance = new executor(this.statement, this.params, this.callback)
    this.execute = function () {
        instance.execute()
    }
}

var insertFunc = function (statement, params, callback) {
    this.statement = statement
    this.params = params
    this.callback = callback
    var that = this
    var instance = new executor(this.statement, this.params, function (error, results) {
        that.callback(results.insertId)
    })
    this.execute = function () {
        instance.execute()
    }
}

var updateFunc = function (statement, params, callback) {
    this.statement = statement
    this.params = params
    this.callback = callback
    var that = this
    var instance = new executor(this.statement, this.params, function (error, results) {
        that.callback(results.changedRows)
    })
    this.execute = function () {
        instance.execute()
    }
}

var deleteFunc = function (statement, params, callback) {
    this.statement = statement
    this.params = params
    this.callback = callback
    var that = this
    var instance = new executor(this.statement, this.params, function (error, results) {
        that.callback(results.affectedRows)
    })
    this.execute = function () {
        instance.execute()
    }
}

const dbInterface = {
    selectOne: selectOneFunc,
    selectList: selectListFunc,
    insert: insertFunc,
    update: updateFunc,
    delete: deleteFunc,
    executeTransaction: function () {
        var sqlFuncs = Array.apply(null, arguments)
        // sqlFuncs.map(function (sqlFunc) {
        //
        // })
    }
}
module.exports = dbInterface;