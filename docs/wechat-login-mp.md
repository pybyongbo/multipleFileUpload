# 个人开发者：微信公众号网页授权登录

## 与开放平台的区别

| 项目     | 公众号（mp）                                            | 开放平台网站应用（open）                                |
| -------- | ------------------------------------------------------- | ------------------------------------------------------- |
| 注册     | [mp.weixin.qq.com](https://mp.weixin.qq.com) 个人订阅号 | [open.weixin.qq.com](https://open.weixin.qq.com) 需企业 |
| scope    | `snsapi_userinfo`                                       | `snsapi_login`                                          |
| 授权接口 | `oauth2/authorize`                                      | `qrconnect`                                             |
| 域名配置 | 网页授权域名                                            | 授权回调域                                              |
| 能力     | 个人可用                                                | 需企业认证 + 微信登录能力                               |

## 配置步骤

1. 注册 **个人订阅号**（免费）。
2. **开发 → 基本配置**：复制 AppID、AppSecret → 填入服务器：
   ```env
   WECHAT_LOGIN_MODE=mp
   MP_WECHAT_APP_ID=你的公众号AppID
   MP_WECHAT_APP_SECRET=你的公众号AppSecret
   WECHAT_REDIRECT_URI=https://fileupload.901web.com/wechat/callback
   ```
3. **公众号设置 → 功能设置 → 网页授权域名**：填 `fileupload.901web.com`（**不要**填 `fileuploadapi.901web.com`，不要带 `https://`；下载校验文件放到该域名网站根目录）。

### 错误码 10003（redirect_uri 域名与后台配置不一致）

| 检查项                   | 正确示例                                                     |
| ------------------------ | ------------------------------------------------------------ |
| 公众平台「网页授权域名」 | `fileupload.901web.com`                                      |
| `WECHAT_REDIRECT_URI`    | `https://fileupload.901web.com/wechat/callback`              |
| `MP_WEB_AUTH_DOMAIN`     | `fileupload.901web.com`                                      |
| 常见错误                 | 公众平台填了 `fileuploadapi`、带了 `www`、URI 带端口 `:3004` |

AppID 必须与配置域名的**同一个公众号**（开发 → 基本配置里的 AppID）。4. **Nginx**（前端站点）：`deploy/nginx-fileupload-wechat-proxy.conf` 反代 `/wechat/` → `3004`。5. `pm2 restart koa2-fileupload`，登录页刷新二维码，**用微信 App 扫码**（不要用系统相机/浏览器扫）。

## 限制

- 无法获取手机号。
- 须在 **微信内** 完成授权（扫码后由微信打开授权页）。
- 公众号 openid 与开放平台 openid **不通用**；切换模式后用户需重新扫码注册。

## 诊断

```bash
curl -s https://fileuploadapi.901web.com/wechat/diagnose
```

## 文档

- [公众号网页授权](https://developers.weixin.qq.com/doc/offiaccount/OAuth_Web/Wechat_webpage_authorization.html)

#### 个人微信公众号 -> 无法配置「网页授权域名」,导致扫码授权一直出现 10003 错误

个人、未认证的订阅号，公众平台通常不会开放「网页授权域名」，也就无法通过 snsapi_userinfo 做扫码 OAuth，会一直出现 10003 或 Scope/权限类错误。
这和代码、redirect_uri 写对与否关系不大。

现在的 WECHAT_LOGIN_MODE=mp 代码是对的，但必须有一个带「网页授权域名」能力的公众号（认证服务号或测试号），否则配 JS 安全域名解决不了 10003
