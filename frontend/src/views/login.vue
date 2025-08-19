<template>
  <div class="login">
    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <h3 class="title">{{ title }}</h3>
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          type="text"
          size="large"
          auto-complete="off"
          placeholder="账号"
        >
          <template #prefix><svg-icon icon-class="user"  class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          auto-complete="off"
          placeholder="密码"
          show-password
          @keyup.enter="handleLogin"
          ref="passwordRef"
        >
          <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      
      <el-form-item style="width:100%;">
        <el-button
          :loading="loading"
          size="large"
          type="primary"
          style="width:100%;"
          @click.prevent="handleLogin"
        >
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        
      </el-form-item>
      <div class="login-tip" >
          <router-link class="link-type" :to="'/register'">还没有账号,去注册</router-link>
        </div>
    </el-form>

  </div>
</template>

<script setup>
import {ref,watch,onMounted, getCurrentInstance } from 'vue'
import { useRoute,useRouter } from 'vue-router';
// import { userLogin } from "@/api/user"
import useUserStore from '@/store/modules/user'
const title = import.meta.env.VITE_APP_TITLE+' 登录'
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { proxy } = getCurrentInstance()

const passwordRef = ref(null)

const loginForm = ref({
  username: "admin",
  password: "123456",

})

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
}

const loading = ref(false)

const redirect = ref(undefined)

watch(route, (newRoute) => {
    redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

onMounted(() => {
  // 检查是否有从注册页面传递过来的用户名
  if (route.query.username) {
    console.log(123, route.query.username);
    // 自动填写用户名
    loginForm.value.username = route.query.username;
    loginForm.value.password = '';
    // 可以自动聚焦到密码输入框
    setTimeout(() => {
      passwordRef.value?.focus()
    }, 100)
  }
})

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      loading.value = true;

      userStore.login(loginForm.value).then(res => {

        // console.log('res111',res);
        // const {code, data, message} = res;
        // loading.value = false;

        // if(code === 200){
        //   // localStorage.setItem('token', data.token)
        //   localStorage.setItem('isLoggedIn', "true");
        //   // 保存 token 到 localStorage
        //   localStorage.setItem('token', data.token);
         
        //   // localStorage.setItem('user', JSON.stringify(data.user))
        //   router.push({ path:  "/list",  });
        //   return result;
        // }else{
        //   proxy.$message.error(message) 
        // }

        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {});
        console.log('otherQueryParams',otherQueryParams);
        router.push({ path: redirect.value || "/uploadfile", query: otherQueryParams })
        console.log('redirect.value',redirect.value);

      }).catch(() => {
        loading.value = false

      })
      
    }
  })
}


</script>

<style lang='scss' scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: url("../assets/images/login-bg.jpg");
  background-size: cover;
}
.title {
  margin: 0px auto 30px auto;
  text-align: center;
  color: #707070;
}

.login-form {
  border-radius: 6px;
  background: #ffffff;
  width: 400px;
  padding: 25px 25px 5px 25px;
  z-index: 1;
  .el-input {
    height: 40px;
    input {
      height: 40px;
    }
  }
  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0px;
  }
}
.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}
.login-code {
  width: 33%;
  height: 40px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
  }
}
.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
}
.login-tip{
  float:right;
  font-size:12px;
  color:var(--el-color-primary);
  margin-top: 10px;
  padding-bottom:10px;
  cursor: pointer;
}
</style>