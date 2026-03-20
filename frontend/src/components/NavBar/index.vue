<script setup>
import { computed, onMounted } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import useUserStore from '@/store/modules/user';
const userStore = useUserStore();
const router = useRouter();

const canShowUserList = computed(
  () => Number(userStore.userInfo?.user_type) === 1,
);

const ensureUserInfoLoaded = async () => {
  if (!localStorage.getItem('token')) return;
  if (userStore.userInfo?.id) return;

  try {
    await userStore.getInfo();
  } catch (e) {
    // token 过期等情况由 request 拦截器统一处理
  }
};

onMounted(ensureUserInfoLoaded);

const logout = async () => {
  try {
    await ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await userStore.logOut();
    ElMessage.success('已退出登录');
    router.push('/login');
  } catch (e) {
    // 取消操作直接忽略
  }
};

const handleCommand = (command) => {
  if (command === 'logout') logout();
};
</script>

<template>
  <div class="nav-wrapper">
    <div class="nav-left">
      <div class="logo">
        <h1>📁 多文件上传系统</h1>
      </div>
      <div class="nav-menu">
        <router-link to="/uploadfile" class="nav-link"> 首页 </router-link>
        <router-link to="/uploadfileBase64" class="nav-link">
          Base64上传
        </router-link>
        <router-link to="/uploadfileBinary" class="nav-link">
          二进制上传
        </router-link>
        <router-link to="/uploadfileChunk" class="nav-link">
          大文件分片上传
        </router-link>

        <router-link to="/downloadList" class="nav-link">
          接口下载文件
        </router-link>

        <router-link to="/fileList" class="nav-link"> 文件列表 </router-link>

        <router-link to="/userList" class="nav-link" v-if="canShowUserList">
          用户列表
        </router-link>
      </div>
    </div>

    <el-dropdown
      @command="handleCommand"
      class="avatar-container"
      trigger="hover"
    >
      <div class="avatar-wrapper">
        <span class="user-nickname">
          <!-- <el-avatar size="small" icon="el-icon-user" class="user-avatar" /> -->
          <el-avatar class="user-avatar">
            <svg-icon icon-class="user" class="el-input__icon input-icon" />
          </el-avatar>
          {{ userStore.userInfo.username }}
          <i class="el-icon-arrow-down"></i>
        </span>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <router-link to="/userCenter">
            <el-dropdown-item>
              <i class="el-icon-user"></i>
              个人中心
            </el-dropdown-item>
          </router-link>
          <el-dropdown-item divided command="logout">
            <i class="el-icon-switch-button"></i>
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.nav-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  box-sizing: border-box;
  position: fixed;
  /* 固定定位 */
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  /* 确保在最上层 */

  .nav-left {
    display: flex;
    align-items: center;

    .logo {
      margin-right: 30px;

      h1 {
        font-size: 22px;
        font-weight: 600;
        color: white;
        margin: 0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 5px;

      .nav-link {
        padding: 8px 16px;
        margin: 0 8px;
        border-radius: 20px;
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateY(-1px);
        }

        &.router-link-active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        i {
          font-size: 16px;
        }
      }
    }
  }
}

.avatar-container {
  .avatar-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;

    .user-avatar {
      width: 24px;
      height: 24px;
      vertical-align: -4px;
      margin-right: 3px;
    }

    .user-nickname {
      color: white;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;

      i {
        font-size: 12px;
        transition: transform 0.3s ease;
      }
    }

    &:hover {
      .user-nickname i {
        transform: rotate(180deg);
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-wrapper {
    flex-direction: column;
    height: auto;
    padding: 10px;

    .nav-left {
      flex-direction: column;
      width: 100%;

      .logo {
        margin: 10px 0;
      }

      .nav-menu {
        flex-wrap: wrap;
        justify-content: center;

        .nav-link {
          margin: 5px;
          padding: 6px 12px;
          font-size: 13px;
        }
      }
    }
  }
}
</style>
