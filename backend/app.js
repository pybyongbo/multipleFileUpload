const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const { resolve } = require('path');
const ip = require('koa-ip');
const onerror = require('koa-onerror')
const logger = require('koa-logger')
// 使用 koa-ip 中间件
app.use(ip({
  proxy: true, // 如果使用代理
  proxyIpHeader: 'X-Forwarded-For' // 指定代理头
}));
const envFilePath = resolve(__dirname,  `.env.${process.env.NODE_ENV || 'development'}`);
require('dotenv').config({
  path: envFilePath
});

// 添加静态文件CORS处理中间件
app.use(async (ctx, next) => {
  // 如果是/uploads/路径下的请求，添加CORS头部
  if (ctx.path.startsWith('/uploads/')) {
    ctx.set('Access-Control-Allow-Origin', ctx.request.header.origin );
    ctx.set('Access-Control-Allow-Credentials', 'true');
    // 如果是OPTIONS预检请求，直接返回
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }
  }
  await next();
});
app.use(require('koa-static')(__dirname + '/public'))
// 添加 koa-body,使用解构赋值的方式导入 koaBody
const { koaBody } = require('koa-body')
const cors = require('koa2-cors');
const jwt = require('koa-jwt');
const config = require('./config/index.js');

const index = require('./routes/index')

const users = require('./routes/users')

const upload = require('./routes/upload')


const bigupload = require('./routes/bigupload.js')

// error handler
onerror(app)
// app.use(cors())
app.use(
  cors({
    origin: function (ctx) {
      return process.env.CORS_ORIGIN;
    }, 
    // origin: 'http://localhost:3000',
    exposeHeaders: ['WWW-Authenticate', 'Content-Type', 'Server-Authorization'],
    maxAge: 3600,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'X-Requested-With',
      'Cache-Control',
      'X-File-Ext',
      'X-File-Name',
      'X-File-Type',
      'X-File-Size'
    ],
    exposeHeaders: [
      'X-File-Ext',
      'X-File-Name',
      'X-File-Type',
      'X-File-Size'
    ]
  })
);


// middlewares
// app.use(bodyparser({
//   jsonLimit: '50mb',     // 默认通常是 1mb
//   formLimit: '50mb',     // 默认通常是 500kb
//   textLimit: '50mb',     // 文本数据限制
//   enableTypes:['json', 'form', 'text']
// }))

app.use(koaBody({
  multipart: true, // 支持文件上传
  json: true,      // 支持 JSON 格式
  formidable: {
    maxFileSize: 200 * 1024 * 1024, // 设置最大文件大小为 200MB
    keepExtensions: true,           // 保持文件扩展名
    // uploadDir: path.join((__dirname + '/public'), 'uploads'),
  },
  // 设置大小限制
  jsonLimit: '50mb',
  formLimit: '50mb',
  textLimit: '50mb'
}));

app.use(json())
app.use(logger())
app.use(views(__dirname + '/views', {
  extension: 'pug'
}))
//  身份认证错误中间件
app.use(async (ctx, next) => {
  return next().catch(err => {
    if (err.status === 401) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        msg: 'Token expired or invalid'
      };
    } else {
      throw err;
    }
  });
});

// JWT 中间件 - 排除不需要认证的路径
app.use(
  jwt({
    secret: config.jwt.secret,
    expiresIn: '30m'
  }).unless({
    path: [
      // /^/, 
      /^\/register/,
      /^\/login/,
      /^\/logout/,
      // /^\/upload/,
      /^\/public/,
      /^\/favicon.ico/,  
      /^\/mergeSlice/
    ]
  })
);

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

// upload
app.use(upload.routes(), upload.allowedMethods())

// 分片上传
app.use(bigupload.routes(), bigupload.allowedMethods())



// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
