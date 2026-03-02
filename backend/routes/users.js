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


// 更新用户密码
router.post('/updatePassword', userController.updatePassword);


// 管理员角色 获取用户列表
router.get('/getUserList', userController.getUserList);

// 根据用户ID查询用户信息
router.get('/getUserInfoById/:id', userController.getUserInfoById);



// 管理员更新用户所有信息接口
router.post('/updateUserAllInfo', userController.updateUserAllInfo);


// 删除用户接口
router.post('/deleteUser', userController.deleteUser);




module.exports = router
