const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const { resolve } = require('path')
const ip = require('koa-ip')
const onerror = require('koa-onerror')
const logger = require('koa-logger')
const { koaBody } = require('koa-body')
const cors = require('koa2-cors')
const jwt = require('koa-jwt')

// 环境配置
const envFilePath = resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)
require('dotenv').config({
  path: envFilePath
})

// 配置文件
const config = require('./config/index.js')

// 路由
const index = require('./routes/index')
const users = require('./routes/users')
const upload = require('./routes/upload')
const bigupload = require('./routes/bigupload.js')

// error handler
onerror(app)

// IP中间件
app.use(ip({
  proxy: true,
  proxyIpHeader: 'X-Forwarded-For'
}))

// 静态文件CORS处理中间件
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/uploads/')) {
    ctx.set('Access-Control-Allow-Origin', ctx.request.header.origin)
    ctx.set('Access-Control-Allow-Credentials', 'true')
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204
      return
    }
  }
  await next()
})

// 静态文件服务
app.use(require('koa-static')(__dirname + '/public'))

// CORS配置
app.use(cors({
  origin: (ctx) => process.env.CORS_ORIGIN,
  exposeHeaders: [
    'WWW-Authenticate', 
    'Content-Type', 
    'Server-Authorization',
    'X-File-Ext',
    'X-File-Name',
    'X-File-Type',
    'X-File-Size'
  ],
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
  ]
}))

// Body解析
app.use(koaBody({
  multipart: true,
  json: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024,
    keepExtensions: true,
  },
  jsonLimit: '50mb',
  formLimit: '50mb',
  textLimit: '50mb'
}))

// 基础中间件
app.use(json())
app.use(logger())
app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// JWT身份认证错误处理
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    if (err.status === 401) {
      ctx.status = 401
      ctx.body = {
        code: 401,
        msg: 'Token expired or invalid'
      }
    } else {
      throw err
    }
  }
})

// JWT中间件
app.use(jwt({
  secret: config.jwt.secret,
  expiresIn: '30m'
}).unless({
  path: [
    /^\/register/,
    /^\/login/,
    /^\/logout/,
    /^\/public/,
    /^\/favicon.ico/,  
    /^\/mergeSlice/
  ]
}))

// 请求日志中间件
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// 路由注册
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(upload.routes(), upload.allowedMethods())
app.use(bigupload.routes(), bigupload.allowedMethods())

// 全局错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

module.exports = app