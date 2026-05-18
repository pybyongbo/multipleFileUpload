const crypto = require('crypto');
const https = require('https');
const md5 = require('md5');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const config = require('../config/index.js');
const userModel = require('../lib/user.js');
const scanStore = require('../lib/wechatScanStore.js');

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

function buildRedirectUri() {
  if (process.env.WECHAT_REDIRECT_URI) {
    return process.env.WECHAT_REDIRECT_URI.trim();
  }
  const base = (process.env.API_DOMAIN || '').replace(/\/$/, '');
  if (base) return `${base}/wechat/callback`;
  const port = process.env.PORT || '3004';
  return `http://localhost:${port}/wechat/callback`;
}

/**
 * 微信网站应用「授权回调域」仅支持已备案的合法域名，不支持 localhost / 127.0.0.1 / 局域网 IP。
 * 使用本地地址时扫码常会报「Scope 参数错误或没有 Scope 权限」（实为回调域不合法）。
 * @see https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */
function getRedirectUriBlockReason(redirectUri) {
  try {
    const { hostname } = new URL(redirectUri);
    const h = hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
      return (
        '微信开放平台网站应用不支持将 localhost / 127.0.0.1 作为授权回调地址，手机扫码会报「Scope 无权限」。' +
        '请在开放平台「授权回调域」填写已备案域名（如 fileupload.901web.com），并设置 WECHAT_REDIRECT_URI=https://你的域名/wechat/callback，在公网环境测试；本地开发可用内网穿透（ngrok 等）映射到 3004 端口。'
      );
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
      return '微信网站应用通常不支持使用 IP 地址作为授权回调域，请改用已备案的 HTTPS 域名。';
    }
  } catch (_) {
    return 'redirect_uri 格式无效';
  }
  return null;
}

/**
 * GET /wechat/qr
 * 返回 base64 图片地址（供 <img src>）与 ticket（即微信 OAuth state）
 */
exports.getQr = async (ctx) => {
  const appid = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    ctx.body = {
      code: 503,
      msg: '未配置微信登录：请在环境变量中设置 WECHAT_APP_ID、WECHAT_APP_SECRET（及可选 WECHAT_REDIRECT_URI）',
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
      data: { redirectUri },
    };
    return;
  }

  const ticket = crypto.randomBytes(16).toString('hex');
  scanStore.setPending(ticket);

  const encodedRedirect = encodeURIComponent(redirectUri);
  const qrconnect = `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}&redirect_uri=${encodedRedirect}&response_type=code&scope=snsapi_login&state=${ticket}#wechat_redirect`;

  try {
    const qrUrl = await QRCode.toDataURL(qrconnect, {
      width: 220,
      margin: 1,
      color: { dark: '#000000ff', light: '#ffffffff' },
    });
    ctx.body = {
      code: 200,
      msg: 'ok',
      data: { qrUrl, ticket },
    };
  } catch (e) {
    console.error('wechat getQr QRCode error', e);
    ctx.status = 500;
    ctx.body = { code: 500, msg: '生成二维码失败', data: null };
  }
};

/**
 * GET /wechat/status?ticket=xxx
 * 扫码并回调完成后，返回 JWT；未完成返回 pending
 */
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

/**
 * GET /wechat/callback?code=xxx&state=ticket
 * 微信授权后回调（需在开放平台配置授权回调域与 redirect_uri 一致）
 */
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

  const appid = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
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
      `<p>微信返回错误：${tokenRes.errmsg || tokenRes.errcode}</p>`,
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
      `<p>保存用户失败（请确认已执行 users_add_wechat_openid.sql 添加 wechat_openid 字段）</p><p style="color:#999;font-size:12px">${String(
        e.message || e,
      )}</p>`,
    );
    return;
  }

  ctx.type = 'html';
  ctx.body = html(
    '登录成功',
    '<p>扫码成功，请返回登录页，系统将自动完成登录。</p><p style="color:#999;font-size:13px">可关闭本窗口。</p>',
  );
};
