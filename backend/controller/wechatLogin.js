const crypto = require('crypto');
const https = require('https');
const md5 = require('md5');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const config = require('../config/index.js');
const userModel = require('../lib/user.js');
const scanStore = require('../lib/wechatScanStore.js');

/** mp=公众号网页授权(个人可用)  open=开放平台网站应用 snsapi_login(需企业) */
function getLoginMode() {
  const m = (process.env.WECHAT_LOGIN_MODE || 'mp').trim().toLowerCase();
  return m === 'open' ? 'open' : 'mp';
}

function getWechatCredentials() {
  if (getLoginMode() === 'mp') {
    return {
      appid: process.env.MP_WECHAT_APP_ID || process.env.WECHAT_APP_ID,
      secret: process.env.MP_WECHAT_APP_SECRET || process.env.WECHAT_APP_SECRET,
    };
  }
  return {
    appid: process.env.WECHAT_APP_ID,
    secret: process.env.WECHAT_APP_SECRET,
  };
}

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw || '{}'));
          } catch (e) {
            reject(new Error(`Invalid JSON from WeChat: ${raw.slice(0, 200)}`));
          }
        });
      })
      .on('error', reject);
  });
}

/** 解析公众平台「网页授权域名」配置值（仅主机名，无协议/路径/端口） */
function parseMpWebAuthDomain() {
  const raw =
    process.env.MP_WEB_AUTH_DOMAIN || process.env.WECHAT_MP_AUTH_DOMAIN || '';
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split(':')[0]
    .toLowerCase();
}

function buildRedirectUri() {
  const mpHost = parseMpWebAuthDomain();
  if (getLoginMode() === 'mp' && mpHost && !process.env.WECHAT_REDIRECT_URI) {
    return `https://${mpHost}/wechat/callback`;
  }
  if (process.env.WECHAT_REDIRECT_URI) {
    return process.env.WECHAT_REDIRECT_URI.trim().replace(/\/$/, '');
  }
  const base = (process.env.API_DOMAIN || '').replace(/\/$/, '');
  if (base) return `${base}/wechat/callback`;
  const port = process.env.PORT || '3004';
  return `http://localhost:${port}/wechat/callback`;
}

/** 公众号网页授权 10003：redirect_uri 主机名须与「网页授权域名」完全一致 */
function getMpWebAuthDomainMismatch(redirectUri) {
  if (getLoginMode() !== 'mp') return null;
  const configured = parseMpWebAuthDomain();
  if (!configured) return null;
  try {
    const host = new URL(redirectUri).hostname.toLowerCase();
    if (host !== configured) {
      return (
        `redirect_uri 域名「${host}」与 MP_WEB_AUTH_DOMAIN「${configured}」不一致，微信会报 10003。` +
        '请在 mp.weixin.qq.com → 公众号设置 → 功能设置 → 网页授权域名 填写 ' +
        configured +
        '（勿填 fileuploadapi 或带 https://），并令 WECHAT_REDIRECT_URI=https://' +
        configured +
        '/wechat/callback'
      );
    }
    if (new URL(redirectUri).port) {
      return 'redirect_uri 不能包含端口号，否则公众号报 10003。';
    }
  } catch (_) {
    return 'redirect_uri 格式无效';
  }
  return null;
}

/** 生成扫码授权 URL（公众号 / 开放平台） */
function buildOAuthAuthorizeUrl(ticket, redirectUri) {
  const { appid } = getWechatCredentials();
  const encodedRedirect = encodeURIComponent(redirectUri);
  if (getLoginMode() === 'mp') {
    return (
      'https://open.weixin.qq.com/connect/oauth2/authorize?' +
      `appid=${appid}&redirect_uri=${encodedRedirect}` +
      '&response_type=code&scope=snsapi_userinfo' +
      `&state=${ticket}#wechat_redirect`
    );
  }
  return (
    'https://open.weixin.qq.com/connect/qrconnect?' +
    `appid=${appid}&redirect_uri=${encodedRedirect}` +
    '&response_type=code&scope=snsapi_login' +
    `&state=${ticket}#wechat_redirect`
  );
}

function getRedirectUriMismatchWarning(redirectUri) {
  if (process.env.WECHAT_REDIRECT_URI) return null;
  const apiBase = (process.env.API_DOMAIN || '').replace(/\/$/, '');
  if (!apiBase) return null;
  try {
    const redirectHost = new URL(redirectUri).hostname.toLowerCase();
    const apiHost = new URL(apiBase).hostname.toLowerCase();
    if (redirectHost !== apiHost) {
      return (
        `redirect_uri 域名（${redirectHost}）与 API_DOMAIN（${apiHost}）不一致。` +
        '请设置 WECHAT_REDIRECT_URI，或使两者一致。'
      );
    }
  } catch (_) {
    return null;
  }
  return null;
}

function getRedirectUriBlockReason(redirectUri) {
  try {
    const { hostname } = new URL(redirectUri);
    const h = hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
      if (getLoginMode() === 'mp') {
        return (
          '公众号网页授权不支持 localhost。请在 mp.weixin.qq.com 配置「网页授权域名」为已备案域名，' +
          '并将 WECHAT_REDIRECT_URI 设为 https://你的域名/wechat/callback；本地调试可用内网穿透。'
        );
      }
      return (
        '微信开放平台网站应用不支持 localhost / 127.0.0.1 作为授权回调。' +
        '请使用已备案域名并配置 WECHAT_REDIRECT_URI。'
      );
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
      return '授权回调不支持 IP 地址，请改用已备案的域名。';
    }
  } catch (_) {
    return 'redirect_uri 格式无效';
  }
  return null;
}

exports.diagnose = async (ctx) => {
  const mode = getLoginMode();
  const redirectUri = buildRedirectUri();
  let callbackHost = '';
  try {
    callbackHost = new URL(redirectUri).hostname;
  } catch (_) {
    callbackHost = '(invalid)';
  }
  const { appid } = getWechatCredentials();
  const mpAuthDomain = parseMpWebAuthDomain() || callbackHost;
  const mpChecklist = [
    '注册个人订阅号：mp.weixin.qq.com',
    '公众号设置 → 功能设置 → 网页授权域名 = ' +
      mpAuthDomain +
      '（仅域名，无 https、无路径）',
    'WECHAT_REDIRECT_URI=https://' + mpAuthDomain + '/wechat/callback',
    'MP_WEB_AUTH_DOMAIN=' +
      mpAuthDomain +
      '（与公众平台填写一致，用于校验 10003）',
    '开发 → 基本配置 中获取 AppID、AppSecret，填入 MP_WECHAT_APP_ID / MP_WECHAT_APP_SECRET',
    'WECHAT_LOGIN_MODE=mp，WECHAT_REDIRECT_URI 与授权域名一致',
    'fileupload.901web.com 的 Nginx 反代 /wechat/ 到 Node 3004',
    '用户须用微信 App 扫二维码（非浏览器扫码）',
  ];
  const openChecklist = [
    '开放平台企业账号 + 开发者资质认证',
    '网站应用 → 能力专区 → 微信登录 = 已获得',
    '授权回调域 = redirect_uri 的域名',
  ];
  ctx.body = {
    code: 200,
    msg: 'ok',
    data: {
      loginMode: mode,
      appId: appid || null,
      redirectUri,
      callbackHost,
      mpWebAuthDomain: mode === 'mp' ? mpAuthDomain : null,
      scope: mode === 'mp' ? 'snsapi_userinfo' : 'snsapi_login',
      checklist: mode === 'mp' ? mpChecklist : openChecklist,
      docUrl:
        mode === 'mp'
          ? 'https://developers.weixin.qq.com/doc/offiaccount/OAuth_Web/Wechat_webpage_authorization.html'
          : 'https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html',
    },
  };
};

exports.getQr = async (ctx) => {
  const { appid, secret } = getWechatCredentials();
  const mode = getLoginMode();
  if (!appid || !secret) {
    ctx.body = {
      code: 503,
      msg:
        mode === 'mp'
          ? '未配置公众号登录：请设置 MP_WECHAT_APP_ID、MP_WECHAT_APP_SECRET（mp.weixin.qq.com → 开发 → 基本配置）'
          : '未配置微信登录：请设置 WECHAT_APP_ID、WECHAT_APP_SECRET',
      data: null,
    };
    return;
  }

  const redirectUri = buildRedirectUri();
  const blockReason = getRedirectUriBlockReason(redirectUri);
  if (blockReason) {
    ctx.body = {
      code: 400,
      msg: blockReason,
      data: { redirectUri, loginMode: mode },
    };
    return;
  }
  const mismatch = getRedirectUriMismatchWarning(redirectUri);
  if (mismatch) {
    ctx.body = {
      code: 400,
      msg: mismatch,
      data: { redirectUri, loginMode: mode },
    };
    return;
  }
  const mpDomainMismatch = getMpWebAuthDomainMismatch(redirectUri);
  if (mpDomainMismatch) {
    ctx.body = {
      code: 400,
      msg: mpDomainMismatch,
      data: {
        redirectUri,
        loginMode: mode,
        mpWebAuthDomain: parseMpWebAuthDomain(),
      },
    };
    return;
  }

  const ticket = crypto.randomBytes(16).toString('hex');
  scanStore.setPending(ticket);
  const authorizeUrl = buildOAuthAuthorizeUrl(ticket, redirectUri);

  try {
    const qrUrl = await QRCode.toDataURL(authorizeUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#000000ff', light: '#ffffffff' },
    });
    ctx.body = {
      code: 200,
      msg: 'ok',
      data: {
        qrUrl,
        ticket,
        redirectUri,
        loginMode: mode,
        scope: mode === 'mp' ? 'snsapi_userinfo' : 'snsapi_login',
        callbackDomainHint: new URL(redirectUri).hostname,
      },
    };
  } catch (e) {
    console.error('wechat getQr QRCode error', e);
    ctx.status = 500;
    ctx.body = { code: 500, msg: '生成二维码失败', data: null };
  }
};

exports.getStatus = async (ctx) => {
  const ticket = ctx.query.ticket;
  if (!ticket) {
    ctx.body = { code: 400, msg: '缺少 ticket', data: null };
    return;
  }
  const row = scanStore.get(ticket);
  if (!row) {
    ctx.body = { code: 400, msg: 'ticket 无效或已过期', data: null };
    return;
  }
  if (row.status === 'done' && row.token) {
    ctx.body = {
      code: 200,
      msg: 'ok',
      data: { token: row.token, user: row.user },
    };
    scanStore.delete(ticket);
    return;
  }
  ctx.body = {
    code: 200,
    msg: 'pending',
    data: { status: 'pending' },
  };
};

exports.callback = async (ctx) => {
  const { code, state: ticket } = ctx.query;
  const html = (title, body) =>
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;text-align:center;padding:48px">${body}</body></html>`;

  if (!code || !ticket) {
    ctx.type = 'html';
    ctx.body = html('授权失败', '<p>缺少 code 或 state 参数</p>');
    return;
  }

  const pending = scanStore.get(ticket);
  if (!pending || pending.status !== 'pending') {
    ctx.type = 'html';
    ctx.body = html(
      '授权失败',
      '<p>登录会话无效或已过期，请返回登录页重新获取二维码</p>',
    );
    return;
  }

  const { appid, secret } = getWechatCredentials();
  const tokenUrl =
    'https://api.weixin.qq.com/sns/oauth2/access_token?' +
    `appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}` +
    `&code=${encodeURIComponent(code)}&grant_type=authorization_code`;

  let tokenRes;
  try {
    tokenRes = await httpsGetJson(tokenUrl);
  } catch (e) {
    console.error('wechat access_token request error', e);
    ctx.type = 'html';
    ctx.body = html('授权失败', '<p>请求微信接口失败</p>');
    return;
  }

  if (tokenRes.errcode) {
    ctx.type = 'html';
    ctx.body = html(
      '授权失败',
      `<p>微信返回错误（${tokenRes.errcode}）：${tokenRes.errmsg || '请检查公众号 AppID/Secret 与网页授权域名'}</p>`,
    );
    return;
  }

  const { access_token, openid } = tokenRes;
  if (!openid) {
    ctx.type = 'html';
    ctx.body = html('授权失败', '<p>未获取到 openid</p>');
    return;
  }

  let nickname = null;
  let headimgurl = null;
  try {
    const infoUrl =
      'https://api.weixin.qq.com/sns/userinfo?' +
      `access_token=${encodeURIComponent(access_token)}&openid=${encodeURIComponent(openid)}&lang=zh_CN`;
    const uinfo = await httpsGetJson(infoUrl);
    if (!uinfo.errcode) {
      nickname = uinfo.nickname || null;
      headimgurl = uinfo.headimgurl || null;
    }
  } catch (e) {
    console.warn('wechat userinfo optional fail', e.message);
  }

  let userRow;
  try {
    const rows = await userModel.findUserByWechatOpenid(openid);
    if (rows && rows.length) {
      userRow = rows[0];
    } else {
      const uname = `wx_${openid}`.slice(0, 48);
      const randomPass = md5(crypto.randomBytes(32).toString('hex'));
      const now = new Date();
      const ins = await userModel.createUserFromWechat({
        username: uname,
        passwordMd5: randomPass,
        openid,
        nickname,
        avatar: headimgurl,
        created_at: now,
        updated_at: now,
      });
      const insertId = ins && ins.insertId;
      if (!insertId) {
        throw new Error('insertId missing after createUserFromWechat');
      }
      const fresh = await userModel.findUserById(insertId);
      userRow = fresh[0];
    }

    await userModel.updateUserLastLogin(userRow.id, new Date());
    await userModel.updateUserLastLoginIp(userRow.id, ctx.request.ip);

    const userInfo = {
      id: userRow.id,
      username: userRow.username,
      email: userRow.email,
    };
    const token = jwt.sign(userInfo, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
    scanStore.markDone(ticket, { token, user: userInfo });
  } catch (e) {
    console.error('wechat callback db error', e);
    ctx.type = 'html';
    ctx.body = html(
      '登录失败',
      `<p>保存用户失败（请确认已执行 users_add_wechat_openid.sql）</p><p style="color:#999;font-size:12px">${String(
        e.message || e,
      )}</p>`,
    );
    return;
  }

  ctx.type = 'html';
  ctx.body = html(
    '登录成功',
    '<p>授权成功，请返回电脑登录页，系统将自动完成登录。</p><p style="color:#999;font-size:13px">可关闭本窗口。</p>',
  );
};
