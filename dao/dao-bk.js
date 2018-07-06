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
            connection.query(that.statement, that.params, that.callback);
            appLog.info('end sql')
            connection.release();
            appLog.info('source released')
        })
    }
}

const dbInterface = {
    selectOne: function (statement, params, callback) {
        var dbaccses = this
        this.execute(statement, params, function (error, results, fields) {
            if (results.length > 1) {
                throw new Error('too many results but expect one')
            }
            callback(results.length == 0 ? null : results[0], fields)
        })
    },
    selectList: function (statement, params, callback) {
        this.execute(statement, params, function (error, results, fields) {
            callback(results, fields)
        })
    },
    insert: function (statement, params, callback) {
        this.execute(statement, params, function (error, results) {
            callback(results.insertId)
        })
    },
    update: function (statement, params, callback) {
        this.execute(statement, params, function (error, results) {
            callback(results.changedRows)
        })
    },
    delete: function (statement, params, callback) {
        this.execute(statement, params, function (error, results) {
            callback(results.affectedRows)
        })
    },
    execute: function (statement, params, callback) {
        appLog.info('execute sql: ' + statement)
        appLog.info('params: ' + params)
        pool.getConnection(function (err, connection) {
            if (err) {
                appLog.error(err)
                if (connection) connection.release()
                throw err
            }
            appLog.info('start sql')
            connection.query(statement, params, callback);
            appLog.info('end sql')
            connection.release();
            appLog.info('source released')
        })
    },
    executeTransaction: function () {
        var sqlFuncs = Array.apply(null, arguments)
        sqlFuncs.map(function (sqlFunc) {

        })
    }
}
module.exports = dbInterface;