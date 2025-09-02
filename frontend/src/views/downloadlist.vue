<template>
  <div class="app-container">
    <el-row :gutter="20" class="main-content">
      <el-col :span="6" :xs="24" class="sidebar-col">
        <div class="sidebar-wrapper">
          <el-card class="box-card">
            <template v-slot:header>
              <div class="clearfix">
                <span>个人信息</span>
              </div>
            </template>
            <div>
              <ul class="list-group list-group-striped">
                <li class="list-group-item">
                  <svg-icon icon-class="user" />用户名称
                  <div class="pull-right">{{ userStore.name }}</div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="email" />用户邮箱
                  <div class="pull-right" v-if="userStore.email">{{ userStore.email }}</div>
                  <div class="pull-right no-email" v-else><span style="vertical-align: -1px;">未填写</span> <el-button link
                      type="primary" size="small" @click="upDateEmailInfo">更新</el-button></div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="date" />用户注册时间
                  <div class="pull-right">{{ dayjs(userStore.created_at).format('YYYY-MM-DD HH:mm:ss') }} </div>
                </li>
                <li class="list-group-item">
                  <svg-icon icon-class="time" />最后登录时间
                  <div class="pull-right">{{ dayjs(userStore.last_login).format('YYYY-MM-DD HH:mm:ss') }}</div>
                </li>

                <li class="list-group-item">
                  <svg-icon icon-class="online" />最后登录IP地址
                  <div class="pull-right">{{ userStore.login_ip }}</div>
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

          <el-card class="box-card other-card">
            <template v-slot:header>
              <div class="clearfix">
                <span>最新上传其他文件Top5</span>
              </div>
            </template>
            <div>
              <ol class="other-file-list" v-if="otherFileListData.length">
                <li v-for="(file, index) in otherFileListData" :key="index" class="list-item">
                  <span class="num">{{ index + 1 }}</span>
                  <el-tooltip :content="file.file_name" placement="top" :disabled="!shouldShowTooltip(file.file_name)">
                    {{ file.file_name }}
                  </el-tooltip>
                </li>
              </ol>

              <div class="no-data-other-file" v-else>
                <span>暂未上传其他类型文件</span>
                <br>
                <el-button type="primary" link @click="goToUploadPage">去上传</el-button>
              </div>

            </div>
          </el-card>
        </div>
      </el-col>

      <el-col :span="18" :xs="24" class="content-col" style="padding-left:0;padding-right:20px;">
        <el-card class="file-box-card">
          <template #header>
            <div class="clearfix hd-title">
              <span class="manage-center">文件下载中心 (后端接口提供下载)</span>

              <div class="batch-btn-group">
                  <!--
                  <el-button type="primary" size="small" @click="showMode='list'" ><el-icon>
                      <List />
                    </el-icon>列表模式</el-button>
                  <el-button type="danger" size="small" @click="showMode='card'"> <el-icon>
                      <Grid />
                  </el-icon>卡片模式</el-button>
                -->
                <el-radio-group v-model="showMode" style="margin-bottom: 6px">
                    <el-radio-button value="list">
                      <el-tooltip content="列表模式" placement="top">
                        <el-icon><List /></el-icon>
                      </el-tooltip>
                    </el-radio-button>
                 
                    <el-radio-button value="card">
                      <el-tooltip content="卡片模式" placement="top">
                        <el-icon><Grid /></el-icon>
                      </el-tooltip>
                    </el-radio-button>
                </el-radio-group>

              </div>
            </div>
          </template>

          <ul class="file-list" v-if="showMode=='list'">
            <li v-for="(file, index) in fileListData" :key="index">
              <div class="file-item">

                <div class="file-link-type">
                  <span v-if="getCategoryLabel(getMimeTypeCategory(file.mime_type)) == '图片'">
                    <svg-icon icon-class="image" class="el-input__icon input-icon" />
                  </span>
                  <span v-else-if="getFileExtension(file.file_name).substring(1) == 'pdf'">
                    <svg-icon icon-class="pdf" class="el-input__icon input-icon" />
                  </span>
                  <span v-else-if="getFileExtension(file.file_name).substring(1) == 'pptx'">
                    <svg-icon icon-class="ppt" class="el-input__icon input-icon" />
                  </span>
                  <span v-else-if="getCategoryLabel(getMimeTypeCategory(file.mime_type)) == '视频'">
                    <svg-icon icon-class="video" class="el-input__icon input-icon" />
                  </span>
                  <span v-else>
                    <svg-icon icon-class="file" class="el-input__icon input-icon" />
                  </span>
                </div>

                <el-popover placement="right" :width="400" trigger="click">
                  <template #reference>
                    <el-button type="primary" link>{{ file.file_name }}</el-button>
                  </template>
                  <img v-if="getCategoryLabel(getMimeTypeCategory(file.mime_type)) == '图片'" :src="file.full_path" alt="11"
                    style="width: 100%; height: 100%;" />
                  <video v-else-if="getCategoryLabel(getMimeTypeCategory(file.mime_type)) == '视频'" :src="file.full_path"
                    style="width: 100%; height: 100%;" controls />
                  <div v-else>非图片/视频文件,无法预览</div>
                </el-popover>

                <div class="file-category">

                  <span class="upload-time">{{ dayjs(file.upload_time).format('YYYY-MM-DD HH:mm:ss') }}</span>

                  <el-tag>{{ getCategoryLabel(getMimeTypeCategory(file.mime_type)) }}</el-tag>

                  <el-button type="primary" link style="margin-left:20px;" @click="openInNewWindow(file.full_path)">新窗口打开</el-button>

                  <el-button type="danger" link @click="downloadFileToLocal(file.id, file.file_name)">下载到本地</el-button>

                </div>
              </div>
            </li>
          </ul>

          <div class="card-list" v-if="showMode=='card'">
            <el-card v-for="(file, index) in fileListData" :key="index" shadow="hover">
              <template #header>
                <div class="card-header">
                   <el-tooltip :content="file.file_name" placement="top"
                        :disabled="!shouldShowTooltip(file.file_name)">
                  <span>{{ file.file_name }}</span>
                  </el-tooltip>
                </div>
              </template>
                 <img v-if="getCategoryLabel(getMimeTypeCategory(file.mime_type)) == '图片'" :src="file.full_path" />
                 <div v-else class="non-image-placeholder">{{getFileExtension(file.file_name).substring(1)}}类型文件<br/><br/>非图片文件,无缩略图</div>
                <template #footer>
                  <el-button type="primary" link @click="downloadFileToLocal(file.id, file.file_name)">下载文件</el-button>
                </template>
            </el-card>
          </div>

          <div class="listBoxBottom" v-if="totalActiveCount > 0">
            <div class="totalText">共 {{ totalActiveCount }} 条数据</div>
            <el-pagination size="small" background :current-page="pageActive" :page-size="pageSize"
              layout="prev, pager, next" @current-change="upDataCurPage" :total="totalActiveCount" class="mt-4">
            </el-pagination>
          </div>

        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, watch, toRefs, onMounted, nextTick } from 'vue';
import useUserStore from '@/store/modules/user';
import useFileStore from '../store/modules/file';

import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { WarningFilled } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router';



import Carousel from '@/components/Carousel';
import { isImage, bytesToKB, getMimeTypeCategory, formatDateRange, getFileExtension } from '@/utils/tools';
import { scrollTo } from '@/utils/scroll-to.js';
import { mimeTypeMap } from '@/utils/constant.js';
import {
  getFileListByUserId,
  getCarouselData,
  getOtherFileListTop5,
  downloadFileById
} from "@/api/uploadfile";

// import { updateUserEmail, getUserInfo } from "@/api/user";

import { getToken, setToken, removeToken } from '@/utils/auth'

const router = useRouter();
const userStore = useUserStore();

const fileStore = useFileStore();

// 展示模式
const showMode = ref('list');

const pageSize = 15;

// 搜索表单数据

const searchForm = reactive({
  fileName: "",
  fileType: "",
  fileUploadTime: "",
});

// 文件类型选项
const fileTypeOptions = ref([
  { label: '全部', value: '' }
]);



const fileListData = ref([]); // 存储文件列表数据
const totalActiveCount = ref(0); // 存储总的活动文件数
const pageActive = ref(1); // 当前页码

// 轮播图数据
const carouselRef = ref(null);
const carouselData = ref([]);
const currentIndex = ref(0);

// 其他文件
const otherFileListData = ref([]);

const dialogFormVisible = ref(false);


// 邮箱格式验证函数
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

// 添加表单引用
const emailFormRef = ref(null)
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

const upDateEmailInfo = () => {
  dialogFormVisible.value = true;
}


// 判断是否需要显示 tooltip（当文本被截断时才显示）
const shouldShowTooltip = (text) => {
  // 可以根据文本长度或其他条件判断
  return text && text.length > 30; // 例如超过50个字符时显示tooltip
};
// 获取 MIME 类型的友好显示名称
const getFriendlyMimeType = (mimeType) => {
  if (!mimeType) return '未知类型'
  return mimeTypeMap[mimeType] || mimeType
}



// 获取分类标签
const getCategoryLabel = (category) => {
  const labels = {
    'image': '图片',
    'video': '视频',
    'audio': '音频',
    'document': '文档',
    'archive': '压缩包',
    'other': '其他'
  }
  return labels[category] || '其他'
}


// 处理文件类型数据
const processFileTypeData = (data) => {
  // 初始化选项数组
  const options = [{ label: '全部', value: '' }]

  // 分类存储不同类型的 MIME
  const categories = {
    image: [],
    video: [],
    audio: [],
    document: [],
    archive: [],
    other: []
  }

  // 将 MIME 类型按分类存储
  data.forEach(item => {
    const category = getMimeTypeCategory(item.mime_type)
    if (!categories[category].some(m => m.mime_type === item.mime_type)) {
      categories[category].push(item)
    }
  })

  // 为每个分类添加选项
  Object.keys(categories).forEach(category => {
    if (categories[category].length > 0) {
      options.push({
        label: getCategoryLabel(category),
        value: category,
        children: categories[category].map(item => ({
          label: getFriendlyMimeType(item.mime_type),
          value: item.mime_type
        }))
      })
    }
  })

  fileTypeOptions.value = options
}


const getFileTypeData = async () => {
  try {
    await fileStore.getFileTypeList()
    if (fileStore.mimetype && fileStore.mimetype.length > 0) {
      processFileTypeData(fileStore.mimetype); // 处理文件类型数据
    }
  } catch (error) {
    console.error('获取文件类型数据失败:', error)
  }
}


const getTotalCount = async () => {
  await fileStore.getTotalCount()
}

const upDataCurPage = (page) => {
  pageActive.value = page;
  nextTick(() => {
    const container = document.querySelector('.app-container');
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // 备用方案：滚动整个窗口
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  });
}



const getFileList = async () => {

  let searchParams = {
    page: pageActive.value,
    fileName: searchForm.fileName,
    fileType: searchForm.fileType,
    limit: pageSize
  };

  // 处理日期范围参数
  if (searchForm.fileUploadTime && Array.isArray(searchForm.fileUploadTime)) {
    const dateParams = formatDateRange(searchForm.fileUploadTime);
    searchParams = { ...searchParams, ...dateParams };
  } else {
    searchParams = { ...searchParams, startTime: '', endTime: '' };
  }

  try {
    const res = await getFileListByUserId(searchParams);
    fileListData.value = res.data;
    totalActiveCount.value = res.total;
  } catch (error) {
    console.error('获取文件列表失败:', error);
    fileListData.value = [];
    totalActiveCount.value = 0;
  }
};


// 监听分页变化
watch(pageActive, (newPage) => {
  pageActive.value = newPage;
  getFileList();
});


const goToUploadPage = () => {
  router.push("/uploadfile")
};

// 初始化加载
onMounted(() => {
  getFileTypeData();
  getTotalCount();
  getFileList();
  getCarouselTop5();
  getOtherFileList();
});

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

const getOtherFileList = async () => {
  try {
    const res = await getOtherFileListTop5();
    console.log('res111', res);
    otherFileListData.value = res.data;

  } catch (error) {
    console.error('获取其他文件列表失败:', error);
  }
};

const openInNewWindow = (path) =>{
  window.open(path, '_blank');
}

const downloadFileToLocal = async (fileId, fileName) => {

  try {

    const res = await downloadFileById(fileId, fileName, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      // 添加响应类型
      responseType: 'blob'
    });
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'download'); // 设置下载文件名

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success('下载成功');

  } catch (error) {
    console.error('下载文件失败:', error);
  }

};



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
  flex: 1;
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



.file-box-card {
  margin-top: 20px;
  position: relative;
}

.batch-btn-group {
  display: flex;
  gap: 10px;
  padding-right: 16px;
}

.hd-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0; // 防止内容溢出
  height: 40px;
}

.file-list {

  .file-link-type {
    float: left;

    span {
      display: block;
      margin-top: 3px;
    }
  }

  li {
    list-style: none; // 去掉列表项的默认样式
    height: 60px;
    line-height: 60px;
    padding: 10px 0;
    border-bottom: 1px solid #e7eaec;
    min-width: 0; // 防止内容溢出

    .file-item {
      overflow: hidden;
    }

    .file-name {
      font-size: 15px;
    }

    .file-category {
      float: right;
      overflow: hidden;

      .upload-time {
        margin-right: 20px;
        font-size: 12px;
      }

      button {
        font-size: 12px;
      }
    }
  }
}



.card-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 10px;

  .el-card {
    height: 300px;
    width: 266px;
  }

  :deep(.el-card__header) {
    padding: 0 5px;
    height: 50px;
    line-height: 50px;
    width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size:14px;
    font-weight: bold;
    .card-header {
      span {
        display: block;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  :deep(.el-card__footer) {
    padding: 0 5px;
    height: 30px;
    line-height: 30px;
    width: 100%;
    text-align: center;
  }

  :deep(.el-card__body) {
    height: 210px;
    img {
      height: 100%;
      width: 100%;
      object-fit: contain;
    }
  }
}

.non-image-placeholder{
     display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #f0f2f5;
    border-radius: 4px;
    margin: 0 auto;
    font-size: 12px;
    color: #909399;
    text-align: center;
    line-height: 1.2; 
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
    margin-top: -8px;
  }
}

@media screen and (max-width: 1500px) {
  .hd-title {
    span.manage-center {
      display: none;

    }
  }
}
</style>

<style lang="scss">
.custom-delete-confirm {
  .el-message-box__container {
    display: block;
    position: relative;

    .el-icon.el-message-box__status.el-message-box-icon--warning {
      position: absolute;
      top: 0px;
      left: 0px;
    }
  }
}
</style>