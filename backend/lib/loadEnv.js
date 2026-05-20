const { resolve } = require('path');

/**
 * 必须在 require('../app') 之前调用。
 * 若未设置 NODE_ENV，会加载 .env.development（CORS 仅 localhost），线上会跨域失败。
 */
function loadEnv() {
  if (loadEnv.loaded) return;
  const root = resolve(__dirname, '..');
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envPath = resolve(root, `.env.${nodeEnv}`);
  const result = require('dotenv').config({ path: envPath });
  loadEnv.loaded = true;
  if (result.error) {
    console.warn('[env] load failed:', envPath, result.error.message);
  } else {
    console.log(
      '[env] loaded %s | CORS_ORIGIN=%s',
      envPath,
      process.env.CORS_ORIGIN || '(unset)',
    );
  }
}

module.exports = loadEnv;
