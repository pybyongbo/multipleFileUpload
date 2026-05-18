-- 微信开放平台「网站应用」扫码登录：绑定微信 openid
-- 执行前请备份数据库；在 nodejstest（或你的库名）上执行。

ALTER TABLE `users`
  ADD COLUMN `wechat_openid` varchar(64) NULL DEFAULT NULL COMMENT '微信开放平台 openid' AFTER `password`;

ALTER TABLE `users`
  ADD UNIQUE KEY `uk_wechat_openid` (`wechat_openid`);
