var crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const systemArr = ['delFlag', 'createTime', 'createUser', 'updateTime', 'updateUser', 'rowVersion']

exports.md5 = function (str) {
    str = str || ''
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}
// 把DB命名转换成驼峰命名
exports.transferFromList = function (arr, fields) {
    var that = this
    return arr.map(function (row) {
        return that.transferFromRow(row, fields)
        // return row
    })
}
exports.transferFromRow = function (row, fields) {
    if (!row) {
        return null
    }
    var result = {}
    fields.map(function (field) {
        result[exports.underLineToHump(field.name)] = row[field.name]
    })
    return result
}
// 下划线转驼峰
exports.underLineToHump = function (str) {
    return str.split('_').map(function (word, index) {
        if (index === 0) return word
        return word.split('').map(function (char, charIndex) {
            return charIndex === 0 ? char.toLocaleUpperCase() : char
        }).join('')
    }).join('')
}

// 驼峰转下划线
exports.humpToUnderLine = function (str) {
    return str.split('').map(function (word) {
        if (word.toLocaleUpperCase() === word) {
            return '_' + word.toLocaleLowerCase()
        } else {
            return word
        }
    }).join('')
}

exports.loginChecker = function(req, res, next) {
    if (req.session.userInfo) {
        return next()
    } else {
        res.json({
            success: false,
            loginError: true,
            data: null,
            errMsg: '您尚未登录，请前往登录页面登录'
        })
    }
}

exports.getSuccessData = function (data) {
    return {
        success: true,
        data: data,
        errMsg: null
    }
}

exports.getFailureData = function (errMsg, data) {
    return {
        success: false,
        data: data,
        errMsg: errMsg
    }
}

exports.getTableName = function (dataType) {
    var tableName = ''
    switch (dataType) {
        case '1':
            tableName = 't_medical'
            break
        case '2':
            tableName = 't_healthy'
            break
        case '3':
            tableName = 't_mall_goods'
            break
        default:
            tableName = 't_medical'
    }
    return tableName
}

exports.leftPad = function (number, n) {
    return (Array(n).join('0') + number).slice(-n);
}

exports.rightPad = function (number, n) {
    return (number + Array(n).join('0')).slice(0, n);
}

exports.isUpdateColumn = function (columnName) {
    return systemArr.filter(function (value) {
        return value === columnName
    }).length == 0
}

exports.mkdirsSync = function (dirpath) {
    if (!fs.existsSync(path.dirname(dirpath))) {
        this.mkdirsSync(path.dirname(dirpath))
    }
    fs.mkdirSync(dirpath)
}