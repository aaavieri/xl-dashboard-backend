var express = require('express');
var router = express.Router();
var dao = require('../dao/dao')
var util = require('../util/util')

/* GET users listing. */
router.post('/login', function(req, res, next) {
    var userId = req.body.userId
    var password = req.body.password
    dao.execute(new dao.selectOne('select user_id, user_pass from t_user where del_flag = false', [userId], function (error, result, fields) {
        if (error) {
            return next(error)
        }
        var success = false
        var rowData = util.transferFromRow(result, fields)
        if (rowData && rowData.userPass === password) {
            req.session.userInfo = rowData
            success = true
        }
        res.json({
            success: success,
            data: null,
            errMsg: success ? null : '用户名或密码错误，请重新输入'
        })
    }))
});

router.post('/logout', function(req, res, next) {
    req.session.userInfo = null
    res.json({
        success: true,
        data: null,
        errMsg: null
    })
});

router.post('/checkLogin', function(req, res, next) {
    var success = false
    if (req.session.userInfo) {
        success = true
    }
    res.json({
        success: success,
        data: null,
        errMsg: success ? null : '您尚未登录，请前往登录页面登录'
    })
});

module.exports = router;
