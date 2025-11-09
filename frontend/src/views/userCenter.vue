<template>
  <div class="app-container">
    <el-row :gutter="20" class="main-content">
      <el-col :span="6" :xs="24" class="sidebar-col">
        <div class="sidebar-wrapper">
          <el-card class="box-card info-card">
            <template v-slot:header>
              <div class="clearfix">
                <span>个人信息</span>
              </div>
            </template>
            <div>
              <div class="text-center">
                <userAvatar />
              </div>
              <ul class="list-group list-group-striped">
                <li class="list-group-item">
                  <svg-icon icon-class="user" />用户名称
                  <div class="pull-right">{{ userStore.userInfo.username }}</div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="email" />用户邮箱
                  <div class="pull-right" v-if="userStore.userInfo.email">{{ userStore.userInfo.email }}</div>
                  <div class="pull-right no-email" v-else><span style="vertical-align: -1px;">未填写</span> <el-button link
                      type="primary" size="small" @click="upDateEmailInfo">更新</el-button></div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="date" />用户注册时间
                  <div class="pull-right">{{ dayjs(userStore.userInfo.created_at).format('YYYY-MM-DD HH:mm:ss') }}
                  </div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="time" />最后登录时间
                  <div class="pull-right">{{ dayjs(userStore.userInfo.last_login).format('YYYY-MM-DD HH:mm:ss') }}</div>
                </li>

                <li class="list-group-item">
                  <svg-icon icon-class="online" />最后登录IP地址
                  <div class="pull-right">{{ userStore.userInfo.login_ip }}</div>
                </li>

              </ul>
            </div>
          </el-card>

          <el-card class="box-card carousel">
            <template v-slot:header>
              <div class="clearfix">
                <span>最新上传图片文件Top5</span>
              </div>
            </template>
            <div v-if="carouselData.length > 0">
              <Carousel ref="carouselRef" @change="handleChange" :imgs="carouselData" :autoPlay="true"></Carousel>
              <div class="current">
                <el-button type="primary" @click="$event => change(currentIndex - 1)" :disabled="currentIndex === 0">
                  &lt;
                </el-button>
                <span class="num">第{{ currentIndex + 1 }}张</span>
                <el-button type="primary" @click="$event => change(currentIndex + 1)"
                  :disabled="currentIndex === carouselData.length - 1">
                  &gt;
                </el-button>
              </div>
            </div>
            <div class="no-data-other-file" v-else>
              <span>暂未上传图片类型文件</span>
              <br>
              <el-button type="primary" link @click="goToUploadPage">去上传</el-button>
            </div>
          </el-card>


        </div>
      </el-col>

      <el-col :span="18" :xs="24" class="content-col" style="padding-left:0;padding-right:20px;margin-top:20px;">
        <el-card>
          <template v-slot:header>
            <div class="clearfix">
              <span>基本资料</span>
            </div>
          </template>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="userinfo">

              <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="80px">
                <el-form-item label="用户名称" prop="username">
                  <el-input v-model="userForm.username" maxlength="30" disabled />
                </el-form-item>
                <el-form-item label="用户昵称" prop="nickname">
                  <el-input v-model="userForm.nickname" maxlength="30" />
                </el-form-item>
                <el-form-item label="手机号码" prop="phonenumber">
                  <el-input v-model="userForm.phonenumber" maxlength="11" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="userForm.email" maxlength="50" />
                </el-form-item>
                <el-form-item label="性别">
                  <el-radio-group v-model="userForm.gender">
                    <el-radio value="0">保密</el-radio>
                    <el-radio value="1">男</el-radio>
                    <el-radio value="2">女</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSubmitUserInfo">保存</el-button>
                  <el-button type="danger" @click="handleClose">关闭</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">



            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogFormVisible" title="更新邮箱信息" width="500" align-center :close-on-click-modal="false">
      <el-form :model="user" :rules="rules" ref="emailFormRef" @submit.native.prevent="submitEmailForm">
        <el-form-item label="邮箱地址" label-width="80" prop="email">
          <el-input v-model="user.email" placeholder="请输入邮箱地址" autocomplete="off" />
        </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEmailForm">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, watch, toRefs, onMounted, nextTick } from 'vue';
import useUserStore from '@/store/modules/user';
import useFileStore from '../store/modules/file';

import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { WarningFilled } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router';

import UserAvatar from '@/components/UserAvatar';

import Carousel from '@/components/Carousel';

import {

  getCarouselData,


} from "@/api/uploadfile";

import { updateUserEmail, getUserInfo, updateUserInfo } from "@/api/user";
import { getToken, setToken, removeToken } from '@/utils/auth'
import { id } from 'element-plus/es/locale/index.mjs';

const router = useRouter();
const userStore = useUserStore();

// 添加表单引用
const emailFormRef = ref(null);

const userFormRef = ref(null)

const validateEmail = (rule, value, callback) => {
  // 如果邮箱为空，直接通过验证
  if (!value) {
    callback(new Error("邮箱地址不能为空"));
  }

  // 邮箱格式正则表达式
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(value)) {
    callback(new Error("请输入正确的邮箱格式"));
  } else {
    callback();
  }
};

const formData = reactive({
  user: {
    email: '', // 邮箱
  },
  rules: {
    email: [
      { required: true, validator: validateEmail, trigger: "blur" },
    ],
  },
});

const { user, rules } = toRefs(formData);
// 邮箱格式验证函数


const userForm = reactive({
  username: '',
  phonenumber: '',
  email: '',
  nickname: '',
  gender: ''
});
const userRules = ref({
  nickname: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
  email: [{ required: true, message: "邮箱地址不能为空", trigger: "blur" }, { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }],
  phonenumber: [{ required: true, message: "手机号码不能为空", trigger: "blur" }, { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur" }],
});



// 搜索表单数据

const activeTab = ref("userinfo");



// 轮播图数据
const carouselRef = ref(null);
const carouselData = ref([]);
const currentIndex = ref(0);



const dialogFormVisible = ref(false);


const upDateEmailInfo = () => {
  dialogFormVisible.value = true;
}

const submitEmailForm = () => {
  emailFormRef.value.validate((valid) => {
    if (valid) {
      // 校验通过，执行更新邮箱逻辑
      updateUserEmail({ email: user.value.email }).then(res => {
        if (res.code === 200) {
          ElMessage({
            message: '更新邮箱成功！',
            type: 'success',
          });
          userStore.getInfo().then(res => {

          }).catch(() => {
          })
        } else {
          ElMessage({
            message: '更新邮箱失败！',
            type: 'error',
          });
        }

        dialogFormVisible.value = false
      })


    } else {
      console.log('邮箱校验失败')
      return false
    }
  })
}
const goToUploadPage = () => {
  router.push("/uploadfile")
};

// 初始化加载
onMounted(async () => {
  getCarouselTop5();
  // 方法2: 从后端获取最新用户信息
  await loadUserInfo()
});




// 从后端加载用户信息并初始化表单
async function loadUserInfo() {
  try {
    // 从后端获取最新用户信息
    const response = await getUserInfo()
    const userData = response.data;

    console.log('userData666', userData);

    // 填充表单数据
    userForm.username = userData.username || ''
    userForm.nickname = userData.nickname || ''
    userForm.email = userData.email || ''
    userForm.phonenumber = userData.phonenumber || ''
    userForm.gender = String(userData.gender) || ''
    // userForm.created_at = userData.created_at || ''

    console.log('userForm', userData.gender);

    // 同步更新 userStore
    userStore.setUserInfo(userData)

    console.log('用户信息加载完成:', userData)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}


// 轮播图数据
const getCarouselTop5 = async () => {
  try {
    const res = await getCarouselData();
    carouselData.value = res.data;

  } catch (error) {
    console.error('获取轮播图数据失败:', error);

  }
};
// 轮播图切换
const handleChange = (index) => {
  currentIndex.value = index;
};


const change = (i) => {
  if (carouselRef.value) {
    carouselRef.value.switchTo(i);
  }
};

// 更新用户信息提交

const handleSubmitUserInfo = () => {

  userFormRef.value.validate((valid) => {
    if (valid) {
      // // 校验通过，执行更新邮箱逻辑
      updateUserInfo({
        id: userStore.userInfo.id,
        ...userForm
      }).then(res => {
        if (res.code === 200) {
          ElMessage({
            message: '更新用户基本信息成功！',
            type: 'success',
          });
          userStore.getInfo().then(res => {

          }).catch(() => {
          })
        } else {
          ElMessage({
            message: '更新邮箱失败！',
            type: 'error',
          });
        }

        //  dialogFormVisible.value = false
      })


    } else {
      console.log('邮箱校验失败')
      return false
    }
  })

}


// 关闭按钮
const handleClose = () => {
  router.push("/fileList");
}

</script>

<style lang="scss" scoped>
.app-container {
  height: calc(100vh - 80px);
  padding-top: 0px;
  box-sizing: border-box;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-bottom: 120px;
}



.main-content {
  display: flex;
  align-items: stretch;
  min-height: calc(100vh - 60px); // 根据你的实际需要调整
}

.sidebar-col {
  display: flex;
  flex-direction: column;
}

.sidebar-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content-col {
  display: flex;
  flex-direction: column;
}

.box-card {
  margin-top: 20px;
  margin-left: 10px;
  //flex: 1;
}




.other-card {
  margin-top: 18px;
  flex: 1;

  :deep(.el-card__body) {
    height: 260px;
  }
}

.file-box-card {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.el-card__header) {
    padding-right: 0;
    padding-bottom: 0 !important;
  }

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.other-file-list {
  padding: 0;
  margin: 0;

  li {
    list-style: none;
    width: 96%;
    height: 39px;
    line-height: 39px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 0;
    border-bottom: 1px solid #eee;
    font-size: 12px;
    margin-bottom: 5px;
    position: relative;

    span.num {
      color: rbga(0, 0, 0, 0.5);
      font-weight: bold;
      height: 20px;
      line-height: 20px;
      width: 20px;
      text-align: center;
      display: inline-block;
      margin-right: 10px;
      background: url(data:image/png;base64,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) no-repeat;
      background-size: cover;
    }
  }
}

.no-data-other-file {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 216px;

}

.carousel {
  :deep(.el-card__body) {
    background: #ffffff;
    padding-top: 10px;
    padding-left: 10px;
    padding-right: 10px;

    button {
      height: 20px;
      box-sizing: border-box;
      font-size: 12px;
    }
  }
}

.list-group-striped>.list-group-item {
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0
}

.list-group {
  padding-left: 0;
  list-style: none;
}

.list-group-item {
  border-bottom: 1px solid #e7eaec;
  margin-bottom: -1px;
  padding: 11px 0;
  font-size: 13px;
  display: flex;

  .svg-icon {
    top: 3px;
    margin-right: 10px;
  }

  .pull-right {
    margin-left: auto;
    text-align: right;
    font-size: 12px;
  }
}

.searchForm {
  flex: 1; // 占据剩余空间
  margin: 0 15px; // 添加一些间距

  :deep(.el-form) {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    justify-content: center;

  }

  :deep(.el-form-item) {
    margin-bottom: 10px;
    margin-right: 5px;
    flex-shrink: 0
  }


}

.file-box-card {
  margin-top: 20px;
  position: relative;
}

.batch-btn-group {
  position: absolute;
  top: 90px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 3;
}

.hd-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0; // 防止内容溢出

  .el-button {
    margin-right: 20px;
    margin-left: 20px;
    flex-shrink: 0;

    &.is-link {
      margin-top: -10px;
    }
  }

}

/* 文件链接容器样式 */
.file-link11,
.file-link-full-path11 {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
  position: relative;
}

/* 文件路径文本样式 */
.file-path-text {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 编辑输入框样式 */
.edit-input {
  width: 100%;
}

/* 取消按钮样式 */
.cancel-btn {
  margin-left: 5px;
  margin-top: 5px;
}

/* 修复复制链接的样式问题 */
.file-link-full-path11 {
  display: flex;
  align-items: center;

  .file-path-text {
    flex: 1;
    min-width: 0;
    /* 允许文本收缩 */
  }

  .el-link {
    flex-shrink: 0;
    margin-left: 10px;
  }
}


// 缩略图容器样式
.thumbnail-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f5f7fa;
  margin: 0 auto;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.non-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background-color: #f0f2f5;
  border-radius: 4px;
  margin: 0 auto;
  font-size: 12px;
  color: #909399;
  text-align: center;
  line-height: 1.2;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.listBoxBottom {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;

  .totalText {
    margin-right: 20px;
    font-size: 14px;
    color: #606266;
    line-height: 32px;
  }
}



.file-link-type {

  padding-right: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.file-link-full-path {
  width: 320px;
  padding-right: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.btn-group {
  button {
    margin: 0;

    span {
      font-size: 12px;
    }
  }
}

.current {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;

  span.num {
    margin: 0 10px;
    font-size: 12px;
  }
}

.empty-tips {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 450px;

  .empty-icon {
    font-size: 50px;
  }
}

.hd-title {
  span.manage-center {
    margin-top: -11px;
  }
}

@media screen and (max-width: 1500px) {
  .hd-title {
    span.manage-center {
      display: none;
    }
  }

  .file-name-label :deep(.el-form-item__label) {
    width: 70px !important;
  }
}

.text-center {
  text-align: center;
}
</style>
