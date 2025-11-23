<template>
  <div class="user-info-head" @click="editCropper()">
    <img :src="options.img" title="点击上传头像" class="img-circle img-lg" />
    <el-dialog :title="title" v-model="open" width="800px" append-to-body @opened="modalOpened" @close="closeDialog">
      <el-row>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <vue-cropper
            ref="cropper"
            :img="options.img"
            :info="true"
            :autoCrop="options.autoCrop"
            :autoCropWidth="options.autoCropWidth"
            :autoCropHeight="options.autoCropHeight"
            :fixedBox="options.fixedBox"
            :outputType="options.outputType"
            @realTime="realTime"
            v-if="visible"
          />
        </el-col>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <div class="avatar-upload-preview">
            <img :src="options.previews.url" :style="options.previews.img" />
          </div>
        </el-col>
      </el-row>
      <br />
      <el-row>
        <el-col :lg="2" :md="2">
          <el-upload
            action="#"
            :http-request="requestUpload"
            :show-file-list="false"
            :before-upload="beforeUpload"
          >
            <el-button>
              选择
              <el-icon class="el-icon--right"><Upload /></el-icon>
            </el-button>
          </el-upload>
        </el-col>
        <el-col :lg="{ span: 1, offset: 2 }" :md="2">
          <el-button icon="Plus" @click="changeScale(1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="Minus" @click="changeScale(-1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshLeft" @click="rotateLeft()"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshRight" @click="rotateRight()"></el-button>
        </el-col>
        <el-col :lg="{ span: 2, offset: 6 }" :md="2">
          <el-button type="primary" @click="uploadImg()">提 交</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import "vue-cropper/dist/index.css";
import { VueCropper } from "vue-cropper";
import { uploadAvatar, getUserInfo } from "@/api/user";
import useUserStore from "@/store/modules/user";

const userStore = useUserStore();

const open = ref(false);
const visible = ref(false);
const title = ref("修改头像");

const cropper = ref(null);

// 统一基础URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 图片裁剪数据初始化
const options = reactive({
  img: '',  // 先初始化为空
  autoCrop: true,
  autoCropWidth: 200,
  autoCropHeight: 200,
  fixedBox: true,
  outputType: "png",
  filename: 'avatar',
  previews: {}
});

// 在组件挂载时获取用户信息
onMounted(async () => {
  await loadUserInfo();
});



// 加载用户信息的独立函数
async function loadUserInfo() {
  try {
    const response = await getUserInfo();
    
    if (response.data.avatar) {
      // 添加时间戳避免缓存
      // const timestamp = new Date().getTime(); + '?t=' + timestamp
      const fullAvatarUrl =  response.data.avatar ;
      options.img = BASE_URL + fullAvatarUrl;
      userStore.userInfo.avatar = fullAvatarUrl;
      console.log('设置头像URL:', fullAvatarUrl);
    } else {
      options.img = ''; // 默认头像
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    options.img = ''; // 使用默认头像
  }
}

/** 编辑头像 */
function editCropper() {
  open.value = true;
}

/** 打开弹出层结束时的回调 */
function modalOpened() {
  visible.value = true;
}

/** 覆盖默认上传行为 */
function requestUpload() {}

/** 向左旋转 */
function rotateLeft() {
  cropper.value.rotateLeft();
}

/** 向右旋转 */
function rotateRight() {
  cropper.value.rotateRight();
}

/** 图片缩放 */
function changeScale(num) {
  num = num || 1;
  cropper.value.changeScale(num);
}

/** 上传预处理 */
function beforeUpload(file) {
  console.log('file',file);
  if (file.type.indexOf("image/") == -1) {
    // proxy.$modal.msgError("文件格式错误，请上传图片类型,如：JPG，PNG后缀的文件。");
    ElMessage.error("文件格式错误，请上传图片类型,如：JPG，PNG后缀的文件。");
  } else {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      options.img = reader.result; // 临时显示本地预览
      options.filename = file.name;
    };
  }
}

/** 上传图片 */
function uploadImg() {
  cropper.value.getCropBlob(data => {
    let formData = new FormData();
    formData.append("avatarfile", data, options.filename);

    uploadAvatar(formData).then(async response => {
      console.log('上传成功响应:', response);
      
      // 关闭对话框
      open.value = false;
      visible.value = false;
      ElMessage.success("上传头像成功");
      
      // 直接使用返回的新头像URL更新显示
      if (response.data.imgUrl) {
        // 添加时间戳避免浏览器缓存
        // const timestamp = new Date().getTime();
        const fullAvatarUrl =  response.data.imgUrl ;
        options.img =BASE_URL + fullAvatarUrl;
        userStore.userInfo.avatar = fullAvatarUrl;

        
       
        // 强制触发Vue的响应式更新
        setTimeout(() => {
          options.img =BASE_URL + fullAvatarUrl;
        }, 100);
      }
    }).catch(error => {
      console.error('上传失败:', error);
      // 显示错误提示
    });
  });
}

/** 实时预览 */
function realTime(data) {
  options.previews = data;
}

/** 关闭窗口 */
function closeDialog() {
  // 恢复到上传前的状态（如果需要）
  options.img = userStore.avatar || '';
  visible.value = false;
}
</script>

<style lang='scss' scoped>
.user-info-head {
  position: relative;
  display: inline-block;
  height: 120px;
}

.user-info-head:hover:after {
  content: "+";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: #eee;
  background: rgba(0, 0, 0, 0.5);
  font-size: 24px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  cursor: pointer;
  line-height: 110px;
  border-radius: 50%;
}

/* image */
.img-circle {
  border-radius: 50%;
}

.img-lg {
  width: 120px;
  height: 120px;
  font-size:15px;

  line-height: 110px;
  border: 1px solid #e6e6e6;
}

/* upload button */
.avatar-upload-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  box-shadow: 0 0 4px #ccc;
  overflow: hidden;
}

.avatar-upload-preview {
  position: absolute;
  top: 50%;
  transform: translate(50%, -50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  box-shadow: 0 0 4px #ccc;
  overflow: hidden;
}
</style>