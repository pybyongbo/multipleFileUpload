const router = require('koa-router')()

// router.prefix('/users')
const userController = require("../controller/user.js");

// post 注册用户
router.post("/register", userController.insertUserData);

// post 用户登录
router.post("/login", userController.userLogin);


// 获取当前用户信息（需要认证，由 koa-jwt 中间件处理）
router.get('/getUserInfo', userController.getCurrentUser);

// 用户登出
router.post('/logout', userController.userLogout);

// 更新用户邮箱信息
router.post('/updateEmail', userController.updateEmail);


// 用户头像上传
router.post('/uploadAvatar', userController.uploadAvatar);


// 更新用户基本信息
router.post('/updateUserInfo', userController.updateUserInfo);

// router.get('/', function (ctx, next) {
//   ctx.body = 'this is a users response!'
// })

// router.get('/bar', function (ctx, next) {
//   ctx.body = 'this is a users/bar response'
// })

module.exports = router
