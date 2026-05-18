<template>
  <div class="login">
    <div class="login-card">
      <!-- 右上角折角切换：账号页显示「二维码」入口，扫码页显示「电脑/账号」入口 -->
      <button
        type="button"
        class="corner-switch"
        :title="
          loginMode === 'account' ? '切换为微信扫码登录' : '切换为账号密码登录'
        "
        :aria-label="
          loginMode === 'account' ? '切换为微信扫码登录' : '切换为账号密码登录'
        "
        @click="toggleLoginMode"
      >
        <span class="corner-switch__triangle" aria-hidden="true" />
        <span class="corner-switch__inner">
          <el-icon :size="22">
            <Grid v-if="loginMode === 'account'" />
            <Monitor v-else />
          </el-icon>
        </span>
      </button>

      <div class="login-card-header">
        <h3 class="title">
          {{ loginMode === 'account' ? title : wechatTitle }}
        </h3>
      </div>

      <!-- 账号登录 -->
      <el-form
        v-show="loginMode === 'account'"
        ref="loginRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            type="text"
            size="large"
            auto-complete="off"
            placeholder="账号"
          >
            <template #prefix>
              <svg-icon icon-class="user" class="el-input__icon input-icon" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            ref="passwordRef"
            v-model="loginForm.password"
            type="password"
            size="large"
            auto-complete="off"
            placeholder="密码"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <svg-icon
                icon-class="password"
                class="el-input__icon input-icon"
              />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item style="width: 100%">
          <el-button
            :loading="loading"
            size="large"
            type="primary"
            style="width: 100%"
            @click.prevent="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登 录 中...</span>
          </el-button>
        </el-form-item>
        <div class="login-tip">
          <router-link class="link-type" :to="'/register'"
            >还没有账号,去注册</router-link
          >
        </div>
      </el-form>

      <!-- 微信扫码登录 -->
      <div v-show="loginMode === 'wechat'" class="wechat-panel">
        <div class="qr-box">
          <div v-if="wechatLoading" class="qr-loading">
            <el-icon class="is-loading" :size="32"><Loading /></el-icon>
            <span>正在获取二维码…</span>
          </div>
          <template v-else>
            <img
              v-if="wechatQrUrl"
              :src="wechatQrUrl"
              alt="微信登录二维码"
              class="qr-img"
            />
            <div v-else class="qr-placeholder" @click="refreshWechatQr">
              <span class="qr-placeholder-text">点击刷新获取二维码</span>
            </div>
          </template>
        </div>
        <el-button
          class="qr-refresh-btn"
          type="primary"
          plain
          :loading="wechatLoading"
          @click="refreshWechatQr"
        >
          刷新二维码
        </el-button>
        <p class="wechat-tip">请使用微信扫描上方二维码，按提示完成授权登录。</p>
        <!-- <p class="wechat-note">
          说明：真实二维码需后端对接
          <a
            href="https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html"
            target="_blank"
            rel="noopener noreferrer"
            >微信开放平台 · 网站应用扫码登录</a
          >
          ；未配置接口时将显示演示占位图。
        </p> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading, Grid, Monitor } from '@element-plus/icons-vue';
import useUserStore from '@/store/modules/user';
import { getWechatLoginQr, getWechatLoginStatus } from '@/api/user';

const title = import.meta.env.VITE_APP_TITLE + ' · 账号密码登录';
const wechatTitle = import.meta.env.VITE_APP_TITLE + ' · 微信扫码登录';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { proxy } = getCurrentInstance();

const loginMode = ref('account');
const passwordRef = ref(null);

function toggleLoginMode() {
  loginMode.value = loginMode.value === 'account' ? 'wechat' : 'account';
}

const loginForm = ref({
  username: 'admin',
  password: '123456',
});

const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入您的账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入您的密码' }],
};

const loading = ref(false);
const redirect = ref(undefined);

/** 演示用占位二维码（后端未就绪时展示） */
function buildPlaceholderQrDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#fff"/>
    <rect x="16" y="16" width="168" height="168" fill="none" stroke="#07c160" stroke-width="2" rx="8"/>
    <text x="100" y="88" text-anchor="middle" font-size="13" fill="#07c160" font-family="system-ui,sans-serif">微信扫码登录</text>
    <text x="100" y="112" text-anchor="middle" font-size="11" fill="#999" font-family="system-ui,sans-serif">演示占位 · 对接后端后替换</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const wechatQrUrl = ref('');
const wechatLoading = ref(false);
const wechatTicket = ref('');
let pollTimer = null;

function clearWechatPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function refreshWechatQr() {
  clearWechatPoll();
  wechatLoading.value = true;
  wechatQrUrl.value = '';
  wechatTicket.value = '';

  try {
    const res = await getWechatLoginQr();
    const data = res?.data;
    if (res?.code === 200 && data?.qrUrl) {
      wechatQrUrl.value = data.qrUrl;
      wechatTicket.value = data.ticket || '';
      if (wechatTicket.value) {
        startWechatStatusPoll();
      }
      return;
    }
    if (res?.msg) {
      ElMessage.warning(res.msg);
      return;
    }
  } catch {
    // 后端未实现 /wechat/qr 时走演示图
  } finally {
    wechatLoading.value = false;
  }

  wechatQrUrl.value = buildPlaceholderQrDataUrl();
  ElMessage.info('当前为演示二维码；配置后端 /wechat/qr 后将显示真实授权码。');
}

function startWechatStatusPoll() {
  clearWechatPoll();
  pollTimer = setInterval(async () => {
    if (!wechatTicket.value) return;
    try {
      const res = await getWechatLoginStatus({ ticket: wechatTicket.value });
      if (res?.code === 200 && res?.data?.token) {
        clearWechatPoll();
        const { setToken } = await import('@/utils/auth');
        setToken(res.data.token);
        userStore.token = res.data.token;
        ElMessage.success('微信登录成功');
        const query = route.query;
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== 'redirect') acc[cur] = query[cur];
          return acc;
        }, {});
        router.push({
          path: redirect.value || '/uploadfile',
          query: otherQueryParams,
        });
      }
    } catch {
      // 轮询失败忽略，继续下一轮
    }
  }, 2000);
}

watch(
  route,
  (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect;
  },
  { immediate: true },
);

watch(loginMode, (mode) => {
  if (mode === 'wechat' && !wechatQrUrl.value && !wechatLoading.value) {
    refreshWechatQr();
  }
  if (mode !== 'wechat') {
    clearWechatPoll();
  }
});

onMounted(() => {
  if (route.query.username) {
    loginForm.value.username = route.query.username;
    loginForm.value.password = '';
    setTimeout(() => {
      passwordRef.value?.focus();
    }, 100);
  }
});

function handleLogin() {
  proxy.$refs.loginRef.validate((valid) => {
    if (!valid) return;
    loading.value = true;
    userStore
      .login(loginForm.value)
      .then(() => {
        const query = route.query;
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== 'redirect') acc[cur] = query[cur];
          return acc;
        }, {});
        router.push({
          path: redirect.value || '/uploadfile',
          query: otherQueryParams,
        });
      })
      .catch(() => {})
      .finally(() => {
        loading.value = false;
      });
  });
}
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: url('../assets/images/login-bg.jpg');
  background-size: cover;
}

.login-card {
  position: relative;
  border-radius: 10px;
  background: #ffffff;
  width: 400px;
  padding: 20px 24px 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1;
  overflow: hidden;
}

.corner-switch {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 6;
  width: 68px;
  height: 68px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;

  &:focus-visible .corner-switch__triangle {
    filter: brightness(1.12);
    box-shadow:
      0 0 0 2px #fff,
      0 0 0 4px var(--el-color-primary);
  }

  &__triangle {
    position: absolute;
    top: 0;
    right: 0;
    width: 68px;
    height: 68px;
    background: var(--el-color-primary);
    clip-path: polygon(100% 0, 100% 100%, 0 0);
    transition: filter 0.2s ease;
  }

  &:hover .corner-switch__triangle {
    filter: brightness(1.08);
  }

  &__inner {
    position: absolute;
    top: 10px;
    right: 10px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    line-height: 1;
  }
}

.login-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  padding-right: 40px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  width: 100%;
}

.login-form {
  padding-top: 8px;

  .el-input {
    height: 40px;
    input {
      height: 40px;
    }
  }
  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0;
  }
}

.wechat-panel {
  padding: 16px 0 8px;
  text-align: center;
}

.qr-box {
  width: 200px;
  height: 200px;
  margin: 0 auto 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.qr-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--el-color-primary);
  font-size: 13px;
  padding: 12px;
  text-align: center;
}

.qr-placeholder-text {
  line-height: 1.5;
}

.qr-refresh-btn {
  width: 100%;
  max-width: 200px;
}

.wechat-tip {
  margin: 14px 0 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.wechat-note {
  margin: 10px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
  text-align: left;

  a {
    color: var(--el-color-primary);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.login-tip {
  font-size: 12px;
  text-align: center;
  color: var(--el-color-primary);
  margin-top: 10px;
  padding-bottom: 4px;
  cursor: pointer;
  float: none;
}
</style>
