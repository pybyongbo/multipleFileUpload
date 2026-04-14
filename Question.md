# 项目问题梳理与优化建议（multipleFileUpload）

## 项目概览

- **前端**：`frontend/`（Vue3 + Vite + Element Plus + Pinia + Axios）
  - 覆盖：multipart 上传 / Base64 上传 / 二进制流上传 / 分片上传、文件列表与回收站、用户中心、用户列表等。
- **后端**：`backend/`（Koa + koa-jwt + koa-body + koa-multer + mysql）
  - 提供：用户鉴权、文件上传/删除/查询/下载、分片上传与合并等 API。
- **数据库**：根目录 `users.sql`、`files.sql`

---

## 高优先级问题（建议优先修复）

### 1) 普通上传链路字段名/中间件不一致，易导致“收不到文件”

- **现状**：
  - 后端路由：`backend/routes/upload.js` 使用 `upload.array('files', 5)`（multer，字段名 `files`）
  - 后端控制器：`backend/controller/uploadFile.js` 的 `uploadFile` 读取 `ctx.request.files.file`（更像 koa-body 的结构，字段名 `file`）
  - 前端：`frontend/src/views/uploadFile.vue` 使用 `FormData.append('file', file)`
- **风险**：三处对不上时，会出现“上传偶发失败/后端取不到文件/只能单文件/多文件失败”等问题。
- **建议**：
  - 统一一种上传解析方案：要么统一用 `koa-body`（并统一字段名），要么统一用 `multer`（并按 multer 的方式取文件）。

### 2) 分片上传合并后没有入库，导致“文件列表看不到分片上传的文件”

- **现状**：`backend/controller/uploadBigfile.js` 的 `mergeSlice` 主要负责合并与返回 URL，未看到将合并后的文件元信息写入 `files` 表。
- **影响**：分片上传更像“上传完打开链接”，而不是“成为系统可管理文件资产（可检索/可删除/可下载）”。
- **建议**：
  - 合并成功后补齐入库逻辑（size、mime、original_name、uploader_id、file_path、upload_time 等），并与文件列表接口对齐。

### 3) SQL 注入风险（lib 层存在字符串拼接）

- **现状**：在 `backend/lib/user.js`、`backend/lib/uploadFile.js` 中存在将变量直接拼到 SQL 字符串的写法（如 username/userId/filepath 等）。
- **风险**：注入攻击、越权访问、数据泄露与破坏。
- **建议**：
  - 全量改为 **参数化查询**（`?` 占位符 + values 数组）。
  - 同时梳理“按 userId 过滤”的所有查询，避免越权。

### 4) 密码使用 MD5 存储，安全性不足

- **现状**：`backend/controller/user.js` 使用 `md5(password)` 存储/校验密码。
- **风险**：MD5 抗破解能力弱，撞库/彩虹表风险高。
- **建议**：
  - 改用 `bcrypt` 或 `argon2`（带盐 + 合理 cost）。
  - 兼容迁移策略：新密码用新算法；老用户登录后逐步升级哈希。

### 5) 配置安全：DB/JWT 密钥硬编码

- **现状**：`backend/config/index.js` 中包含数据库账号密码、JWT secret 明文。
- **风险**：配置泄露、环境切换困难。
- **建议**：
  - 全部迁移到 `.env.`*，代码只读 `process.env`，确保 `.env` 不提交。

### 6) 前端路由守卫存在拼写问题

- **现状**：`frontend/router/index.js` 中出现 `to.full_path`，正确应为 `to.fullPath`。
- **影响**：登录后重定向回原页面逻辑可能失效。
- **建议**：修正拼写并回归登录/跳转流程。

---

## 中优先级优化点（稳定性/一致性/可维护性）

### 1) 上传链路混用 koa-body 与 multer，维护成本高

- **现状**：`backend/app.js` 启用 `koaBody({ multipart: true ... })`，同时普通上传路由又使用 `koa-multer`。
- **问题**：不同中间件产生的文件对象结构不同，控制器取值方式混乱。
- **建议**：
  - 普通上传统一一套解析方式；
  - raw 二进制上传走独立接口（`application/octet-stream`）；
  - 分片上传走独立接口。

### 2) 文件路径/URL 字段命名不统一（前后端容易对不上）

- **现状**：返回体里同时出现 `filePath/path/url/full_path` 等字段，前端页面也存在不同字段混用。
- **风险**：预览/下载/删除等功能出现“某些页面正常某些页面异常”的隐性 bug。
- **建议**：
  - 统一返回字段约定（例如：`url` 永远是可访问 URL；`file_path` 永远是 DB 内部相对路径；`id` 为主键操作）。

### 3) 删除/彻底删除接口参数语义不清

- **现状**：接口参数叫 `filename`，但实际可能传的是 `/uploads/...` 路径。
- **建议**：
  - 尽量使用 `fileId` 做主键操作；
  - 若必须用路径，字段名应明确为 `filePath`，并统一是相对路径还是完整 URL。

### 4) CORS/静态资源跨域逻辑重复

- **现状**：对 `/uploads/` 既有手写 CORS 处理，又有 `koa2-cors`。
- **风险**：header 重复、缺失、不同接口表现不一致。
- **建议**：统一 CORS 策略与 header 暴露，下载接口注意 `Content-Disposition` 等头部可见性。

### 5) 依赖版本偏老（例：axios 0.18.0）

- **风险**：潜在 bug/安全问题、与现代浏览器/生态兼容性差。
- **建议**：升级 axios 并回归测试上传/下载/取消请求/拦截器。

---

## 低优先级优化点（体验/性能/工程化）

### 1) 分片合并过程可能阻塞（同步 IO）

- **现状**：合并逻辑中有同步读取/写入的实现方式，超大文件会阻塞 event loop。
- **建议**：使用 stream 按序 pipe 合并，降低内存与阻塞风险，并增加失败恢复/重试策略。

### 2) 大型页面可组件化/抽离逻辑

- **现状**：如 `userList.vue` 等页面包含大量 DOM 查询与业务逻辑，维护成本高。
- **建议**：把“打印表格/复杂交互”抽成 composable 或独立组件，降低单文件复杂度。

### 3) 类型一致性（数字/字符串混用）

- **现状**：例如 `user_type` 有的地方用 `=== 1`，有的地方用 `== '1'`。
- **建议**：后端返回统一类型（推荐 number），前端在接口层/映射层做一次规范化。

---

## 推荐改造顺序（投入产出最高）

1. **统一普通上传字段名与解析方式**（立刻减少上传失败与兼容问题）
2. **分片上传合并后入库**（形成“上传 → 列表可见 → 可管理”的闭环）
3. **SQL 全面参数化**（安全底线）
4. **密码哈希升级（MD5 → bcrypt/argon2）**（安全底线）
5. **修复路由守卫 `fullPath` 拼写** + 前端鉴权/错误处理一致性
6. **升级 axios 等关键依赖并做回归测试**

