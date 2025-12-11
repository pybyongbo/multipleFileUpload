# Vue 3 + Vite

### 多文件上传系统

- 支持用户注册,登录
- 支持用户上传文件 (多个文件上传)
- 支持查询自己上传的文件
- 大文件切片上传 (并发请求控制)


### todoList

- [x] 更新用户邮箱信息.

- [x] 增加搜索条件 (日期搜索)
- [x] 增加轮播图模块
- [x] 增加批量下载/删除功能 (批量下载/删除)

- [x] 还原删除功能/彻底删除文件
- [x] 自定义指令复制访问地址
- [x] 单个文件删除 确认提示框
- [x] 最新上传非图片文件列表
- [x] 接口支持不同类型的数据上传 (base64,二进制流等)

- [] 文件列表接口合并,通过参数区分
- [] 管理员角色登录可以查看管理用户列表


### 数据库表新增字段sql语句

```sql

ALTER TABLE `users` ADD COLUMN `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户头像' AFTER `password`;
ALTER TABLE `users` ADD COLUMN `nickname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户昵称' AFTER `username`;
ALTER TABLE `users` ADD COLUMN `phonenumber` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户手机号' AFTER `nickname`;
ALTER TABLE `users` ADD COLUMN `gender` tinyint(1) DEFAULT 0 COMMENT '用户性别：0-保密，1-男性，2-女性' AFTER `phonenumber`;

```

新增用户类型字段 (普通用户,超级管理员)

```sql
-- 如果希望字段出现在其他位置，可以调整AFTER子句
ALTER TABLE `users`
ADD COLUMN `user_type` tinyint(1) NOT NULL DEFAULT '0' COMMENT '用户类型: 0-普通用户, 1-超级管理员' AFTER `last_login`;
```


