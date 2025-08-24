<script setup>
import { ref } from 'vue'
import {ElMessageBox, ElMessage} from 'element-plus'
import useUserStore from '@/store/modules/user'
const userStore = useUserStore()

console.log('userStore', userStore);
userStore.getInfo().then(res => {
  console.log('6655', res);

}).catch(() => {
})


function logout() {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      window.location.href = '/login';
    })
  }).catch(() => { })
}

function handleCommand(command) {
  switch (command) {
    // case "setLayout":
    //   setLayout()
    //   break
    case "logout":
      logout()
      break
    default:
      break
  }
}



</script>

<template>
  <div class="nav-wrapper">

<div class="nav-left">
    <div class="logo">
        <h1>多文件上传系统</h1>
    </div>
    <div class="nav-menu">

      <router-link to="/uploadfile">首页</router-link> 
      <router-link to="/uploadfileBase64">base64上传</router-link> 
      <router-link to="/uploadfileBinary">二进制上传</router-link>

      <router-link to="/uploadfileChunk">大文件分片上传</router-link>

      <router-link to="/personal">个人中心</router-link>


    </div>
</div>
   

     <el-dropdown @command="handleCommand" class="avatar-container right-menu-item hover-effect "  trigger="hover">
    <div class="avatar-wrapper">
      <span class="user-nickname">
      <el-avatar style="width:24px;height:24px;vertical-align: -4px;margin-right:3px;">
        <svg-icon icon-class="user"  class="el-input__icon input-icon" />
      </el-avatar>
        {{ userStore.name }} 
      </span>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <router-link to="/personal">
          <el-dropdown-item>个人中心</el-dropdown-item>
        </router-link>
        <el-dropdown-item divided command="logout">
          <span>退出登录</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>

  </div>
 
</template>

<style lang="scss" scoped>

.nav-wrapper{
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  background: #dedede;
  line-height: 50px;

  .nav-left{
    display: flex;
    align-items: center;
    .logo{
      margin-right: 24px;
      h1{
        font-size:20px;
        font-weight: normal;
        margin-left:34px;
      }
    }
    .nav-menu{
      display: flex;
      align-items: center;
      a{
        margin-right: 20px;
        font-size:14px;
        color:var(--el-color-primary);
        position: relative;
        &::after{
          content: '';
          display: inline-block;
          border-left:1px solid #fff;
          height: 12px;
          position: absolute;
          top: 20px;
          margin-left: 10px;
        }
        &:last-child::after{
          display: none;
        }
        &.router-link-active{
          font-weight: bold;
          color: var(--el-color-danger);
          text-decoration: underline;
        }
      }
    }
  }
}
.avatar-container {
  margin-right: 0px;
  padding-right: 30px;

  background: #dedede;
  line-height: 50px;
  display: flex;
  justify-content: flex-end;

  .avatar-wrapper {
    margin-top: 10px;
    right: 5px;
    position: relative;

    .user-avatar {
      cursor: pointer;
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }

    .user-nickname {
      cursor: pointer;
      position: relative;
      left: 5px;
      bottom: 10px;
      font-size: 14px;
      font-weight: bold;
    }

    i {
      cursor: pointer;
      position: absolute;
      right: -20px;
      top: 25px;
      font-size: 12px;
    }
  }
}
</style>
