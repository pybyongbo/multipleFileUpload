const userModel = require('../lib/user.js');
const config = require('../config/index.js');
const md5 = require("md5");
const jwt = require('jsonwebtoken');
/**
 * 返回值
 * @param code 返回码
 * @param msg	返回信息
 * @param data 返回数据
 * @return
 */

const resObj = (code,data, msg ) => {
  return {
    code: code,
    data: data,
    msg: msg,
  };
};


// 新增用户信息(注册)
exports.insertUserData = async (ctx) => {
  try {
    
    const { username, email, password } = ctx.request.body;
    
    // 必填字段验证
    if (!username || typeof username !== 'string' || username.trim() === '') {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '用户名不能为空且必须是字符串',
      };
      return;
    }
    
    // if (!email || typeof email !== 'string' || email.trim() === '') {
    //   ctx.status = 400;
    //   ctx.body = {
    //     code: 400,
    //     message: '邮箱不能为空且必须是字符串',
    //   };
    //   return;
    // }
    
    if (!password || typeof password !== 'string' || password.trim() === '') {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '密码不能为空且必须是字符串',
      };
      return;
    }
    
    // 处理可选字段
    const created_at = ctx.request.body.created_at || new Date();
    const updated_at = ctx.request.body.updated_at || new Date();
    const last_login = ctx.request.body.last_login || null;
    const is_active = ctx.request.body.is_active !== undefined ? ctx.request.body.is_active : 0;
    
    // 插入数据库
   const result = await userModel.registerUser([
      username.trim(), 
      email?.trim(), 
      md5(password.trim()), // 使用 md5 加密密码
      created_at, 
      updated_at, 
      last_login, 
      is_active
    ]);

    ctx.body = resObj(200, { 
      id: result.id,  // 返回用户ID
      username: username.trim(),
      email: email?.trim()
    },'注册成功', );
    

  } catch (err) {
    console.error('数据库操作错误:', err);
    
    // 根据错误类型返回不同的错误信息
    if (err.code === 'ER_DUP_ENTRY') {
      ctx.status = 409; // 冲突
      ctx.body = resObj(409, {}, '用户名或邮箱已存在');
      // ctx.body = {
      //   code: 409,
      //   message: '用户名或邮箱已存在',
      // };
    } else {
      ctx.status = 500;
      ctx.body = resObj(500, {}, `服务器内部错误,${process.env.NODE_ENV} === 'development' ? ${err.message} : undefined`);
      // ctx.body = {
      //   code: 500,
      //   message: '服务器内部错误',
      //   error: process.env.NODE_ENV === 'development' ? err.message : undefined
      // };
    }
  }
};


// 用户登录
exports.userLogin = async ctx => {

  let { username, password } = ctx.request.body;
  await userModel
    .findDataByName(username)
    .then(async result => {
      let res = result;
      if (
        res.length &&
        username === res[0]["username"] &&
        md5(password) === res[0]["password"]
      ) {

        // 生成 JWT token
      const userInfo = {
        id: res[0].id,
        username: res[0].username,
        email: res[0].email
      };
      
      const token = jwt.sign(userInfo, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
       // 更新最后登录时间
       await userModel.updateUserLastLogin(res[0].id, new Date());

       // 更新登录IP地址
       await userModel.updateUserLastLoginIp(res[0].id, ctx.request.ip);

       ctx.body = resObj(200, 
        {
          user: userInfo,
          token: token
        }, '登录成功'
       )
        // ctx.body = {
        //   code: 200,
        //   data: {
        //   user: userInfo,
        //   token: token
        // },
        //   message: "登录成功"
        // };

      } else {

        ctx.body = resObj(500, {}, '用户名或密码错误,或者没有激活账号')
        // ctx.body = {
        //   code: 500,
        //   message: "用户名或密码错误,或者没有激活账号"
        // };
        console.log("用户名或密码错误!");
      }
    })
    .catch(err => {
      console.log(err);
    });
};


// 获取当前用户信息（需要认证）
exports.getCurrentUser = async ctx => {
  try {
    // 通过 koa-jwt 解析的用户信息在 ctx.state.user 中
    const userId = ctx.state.user.id;
    const result = await userModel.findUserById(userId);
    
    if (result.length) {
      const user = result[0];
      delete user.password; // 不返回密码字段

      ctx.body = resObj(200, user, '获取用户信息成功');

      // ctx.body = {
      //   code: 200,
      //   message: '获取用户信息成功',
      //   data: user
      // };
    } else {
      ctx.status = 404;

       ctx.body = resObj(404, null, '用户不存在');
      // ctx.body = {
      //   code: 404,
      //   message: '用户不存在'
      // };
    }
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = resObj(500, null, '服务器内部错误');
    // ctx.body = {
    //   code: 500,
    //   message: '服务器内部错误'
    // };
  }
};

// 用户登出
exports.userLogout = async ctx => {
  try {
    // JWT 本身是无状态的，客户端删除 token 即可实现登出
    ctx.body = resObj(200, null, '登出成功');
    // ctx.body = {
    //   code: 200,
    //   message: '登出成功'
    // };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = resObj(500, null, '服务器内部错误');
    // ctx.body = {
    //   code: 500,
    //   message: '服务器内部错误'
    // };
  }
};

// 更新用户邮箱信息
exports.updateEmail = async ctx => {
  try {
    const userId = ctx.state.user.id;
    const { email } = ctx.request.body;

    await userModel.updateUserEmail(userId, email.trim());
    ctx.body = resObj(200, null, '更新邮箱成功');
    // ctx.body = {
    //   code: 200,
    //   message: '更新邮箱成功',
    // };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = resObj(500, null, '服务器内部错误');
    // ctx.body = {
    //   code: 500,
    //   message: '服务器内部错误'
    // };
  }
}