/**
 * 微信扫码登录：ticket(state) 与登录结果的内存存储（单机开发可用；生产建议 Redis）
 */
const store = new Map();

const DEFAULT_PENDING_TTL = 10 * 60 * 1000; // 10 分钟
const DONE_EXTRA_TTL = 5 * 60 * 1000; // 扫码成功后多保留一段时间供前端轮询

function now() {
  return Date.now();
}

exports.setPending = (ticket, ttlMs = DEFAULT_PENDING_TTL) => {
  store.set(ticket, {
    status: 'pending',
    expiresAt: now() + ttlMs,
  });
};

exports.markDone = (ticket, { token, user }) => {
  const cur = store.get(ticket);
  if (!cur) return false;
  store.set(ticket, {
    status: 'done',
    expiresAt: now() + DONE_EXTRA_TTL,
    token,
    user,
  });
  return true;
};

exports.get = (ticket) => {
  const row = store.get(ticket);
  if (!row) return null;
  if (now() > row.expiresAt) {
    store.delete(ticket);
    return null;
  }
  return row;
};

exports.delete = (ticket) => {
  store.delete(ticket);
};
