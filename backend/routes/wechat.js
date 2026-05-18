const router = require('koa-router')();
const wechatLogin = require('../controller/wechatLogin.js');

router.get('/wechat/qr', wechatLogin.getQr);
router.get('/wechat/status', wechatLogin.getStatus);
router.get('/wechat/callback', wechatLogin.callback);

module.exports = router;
