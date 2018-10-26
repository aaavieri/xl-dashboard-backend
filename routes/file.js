var express = require('express');
var router = express.Router();
var dao = require('../dao/dao');
var util = require('../util/util')
var env = require('../config/env')
var appLog = require('../logger/appLogger')

const multer = require("multer")
const fs = require("fs")

if (!fs.existsSync(env.picStorePath)) {
    util.mkdirsSync(env.picStorePath)
}

var storage = multer.diskStorage({
    destination: function (req, file, cb){
        // 文件上传成功后会放入public下的upload文件夹
        cb(null, env.picStorePath)
    },
    filename: function (req, file, cb){
        // 设置文件的名字为其原本的名字，也可以添加其他字符，来区别相同文件，例如file.originalname+new Date().getTime();利用时间来区分
        file.saveName = new Date().getTime() + '.' + file.originalname
        cb(null, file.saveName)
    }
});

var upload = multer({
    storage: storage
});

router.post('/uploadMallPic/:goodsId', upload.single('file'), function (req, res, next) {
    appLog.info(`${req.file.originalname} uploaded`)
    let goodsId = req.params.goodsId
    dao.executeTransaction({}, new dao.insert('insert into t_mall_picture (name, url, local_flag, del_flag) values (?, ?, true, false)',
        [req.file.originalname, req.file.saveName], function (error, insertId, others) {
        if (error) {
            return next(error)
        }
        others.commonParams.pictureData = {
            id: insertId,
            url: env.picPrefix + req.file.saveName,
            rowVersion: 1
        }
        others.next.params.push(insertId)
    }), new dao.insert('insert into t_mall_goods_picture (goods_id, picture_id, del_flag) values (?, ?, false)', [goodsId], function (error, results, others) {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData(others.commonParams.pictureData))
    }))
})

router.post('/deleteMallPic/:goodsId', function (req, res, next) {
    let goodsId = req.params.goodsId
    let { file: { id: picId, rowVersion } } = req.body
    let sessionUser = req.session.userInfo.userId
    dao.executeTransaction({}, new dao.update('update t_mall_goods_picture set del_flag = true, update_user = ?, update_time = sysdate(), row_version = row_version + 1' +
        ' where goods_id = ? and picture_id = ? and row_version = ?', [sessionUser, goodsId, picId, rowVersion], function (error, changeRows, others) {
        if (error) {
            return next(error)
        }
        if (changeRows === 0) {
            throw new Error('更新失败')
        }
    }), new dao.selectOne('select p.id, p.url, p.row_version, gp.use_count from t_mall_picture p inner join ' +
        '(select count(*) as use_count, picture_id from t_mall_goods_picture where picture_id = ? and del_flag = false) gp' +
        ' on (true) where p.id = ? and p.del_flag = false', [picId, picId], function (error, results, fields, others) {
        if (error) {
            return next(error)
        }
        let rowData = util.transferFromRow(results, fields)
        if (rowData.useCount === 0) {
            others.next.params.push(true)
        } else {
            others.next.params.push(false)
        }
        others.next.params.push(sessionUser)
        others.next.params.push(picId)
        others.commonParams.rowData = rowData
    }), new dao.update('update t_mall_picture set del_flag = ?, update_user = ?, update_time = sysdate(), row_version = row_version + 1 where id = ?',
        [], function (error, changeRows, others) {
        if (error) {
            return next(error)
        }
        if (others.commonParams.rowData.useCount === 0) {
            fs.unlinkSync(env.picStorePath + others.commonParams.rowData.url)
        }
        res.json(util.getSuccessData({}))
    }))
})

// 暂时未使用
router.post('/uploadMallPicList', upload.any(), function (req, res, next) {
    let insetFunList = req.files.map(file => {
        return new dao.insert('insert into t_mall_picture (name, url, local_flag, del_flag) values (?, ?, true, false)',
            [file.originalname, file.saveName], function (error, insertId, others) {
                if (error) {
                    return next(error)
                }
                others.commonParams.pictureList.push({
                    id: insertId,
                    url: env.picPrefix + file.saveName,
                    rowVersion: 1
                })
                if (others.commonParams.pictureList.length === req.files.length) {
                    res.json(util.getSuccessData(others.commonParams.pictureList))
                }
            })
    })
    dao.executeTransaction({pictureList: []}, ...insetFunList)
})

// attempt to use this function
router.post('/uploadSingleMallPic', upload.single('file'), function (req, res, next) {
    dao.execute(new dao.insert('insert into t_mall_picture (name, url, local_flag, del_flag) values (?, ?, true, false)',
        [req.file.originalname, req.file.saveName], function (error, insertId) {
       if (error) {
           return next(error)
       }
       res.json(util.getSuccessData({
           id: insertId,
           name: req.file.originalname,
           url: env.picPrefix + req.file.saveName,
           rowVersion: 1
       }))
    }))
})

module.exports = router;