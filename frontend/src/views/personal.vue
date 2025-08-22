<template>
   <!-- color="#dedede" -->
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
            <div v-if="carouselData.length>0">
              <Carousel ref="carouselRef" @change="handleChange" :imgs="carouselData" :autoPlay="true"></Carousel>
              <div class="current">
                <el-button type="primary"  @click="$event=>change(currentIndex-1)" :disabled="currentIndex===0">
                  &lt;
                </el-button>
                <span class="num">第{{currentIndex+1}}张</span>
                <el-button type="primary" @click="$event=>change(currentIndex+1)" :disabled="currentIndex===carouselData.length-1">
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
                  <el-tooltip :content="file.file_name" placement="top" :disabled="!shouldShowTooltip(file.file_name)">
                    {{file.file_name}}
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

      <el-col :span="18" :xs="24" class="content-col">
        <el-card class="file-box-card">
          <template v-slot:header>
            <div class="clearfix hd-title">
              <span>文件管理中心</span>
              <el-button type="primary" link @click="goToUploadPage"><svg-icon icon-class="upload" /> 继续上传文件</el-button>
            </div>
          </template>
          <div class="batch-btn-group" v-if="selectedTab === 'active' && multipleSelection.length>0">
            <el-button type="danger" size="small" @click="batchDelete"> <el-icon><Grid /></el-icon>批量删除文件</el-button>
            <el-button type="primary" size="small" @click="batchDownload"><el-icon><Download /></el-icon>批量下载文件</el-button>
          </div>
          <el-tabs v-model="selectedTab">
            <el-tab-pane :label="`我上传的文件(${totalActiveCount})`" name="active">
              <el-table :data="fileListData" ref="multipleTableRef" row-key="id"  @selection-change="handleSelectionChange" border style="width: 100%">
               <!-- :selectable="selectable" -->
                <template #empty>
                  <div class="empty-tips">
                    <svg-icon icon-class="empty"  class="empty-icon" />
                    <span class="empty-text">暂无文件,请先去上传文件</span>
                  </div>
                </template>
                <el-table-column type="selection"  width="55" fixed="left"/>
                <el-table-column prop="id" label="Id" width="60" align="center" fixed="left"/>

                <el-table-column prop="full_path" label="缩略图" align="center" fixed="left">
                  <template #default="scope">
                    <div v-if="isImage(scope.row.file_name)" class="thumbnail-container">
                      <img :src="scope.row.full_path" :alt="scope.row.originalName" class="thumbnail-img" />
                    </div>
                    <div v-else class="non-image-placeholder">
                      非图片文件
                    </div>
                  </template>
                </el-table-column>

                <!-- <el-table-column label="文件名称" width="320" align="center">
                  <template #default="scope">
                    <div class="file-link">
                      <el-tooltip :content="scope.row.file_name" placement="top"
                        :disabled="!shouldShowTooltip(scope.row.file_name)">
                        <span class="file-path-text">{{ scope.row.file_name }}</span>
                      </el-tooltip>
                      <el-link underline="hover" icon="DocumentCopy" style="float:right"
                        type="danger">&nbsp;复制</el-link>
                    </div>
                  </template>
                </el-table-column> -->

                <el-table-column label="文件名称" align="center" width="300">
                  <template #default="scope">
                    <div class="file-link">
                      <el-tooltip :content="scope.row.file_name" placement="top"
                        :disabled="!shouldShowTooltip(scope.row.file_name)">
                        <span class="file-path-text">{{ scope.row.file_name }}</span>
                      </el-tooltip>
                      <!-- <el-link underline="hover" icon="DocumentCopy" style="float:right"
                        type="danger">&nbsp;复制</el-link> -->
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="file_size" label="文件大小(KB)" width="180" align="center">
                   <template #default="scope">
                    {{ bytesToKB(+scope?.row.file_size) }}
                  </template>
                </el-table-column>
                <el-table-column prop="mime_type" label="文件类型" width="180" align="center">
                  <template #default="scope">
                    <div class="file-link-type">
                  <el-tooltip :content="scope.row.mime_type" placement="top"
                        :disabled="!shouldShowTooltip(scope.row.mime_type)">
                        <span class="file-path-text">{{ scope.row.mime_type }}</span>
                      </el-tooltip>
                      </div>
                  </template>
                </el-table-column>
                <el-table-column prop="upload_time" label="上传时间" width="180" align="center">
                  <template #default="scope">
                    {{ dayjs(scope.row.upload_time).format('YYYY-MM-DD HH:mm:ss') }}
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="120" align="center">
                  <template #default="scope">
                    <div class="action-buttons">
                      <el-tooltip content="下载" placement="top">
                        <el-button link type="primary" icon="Download" @click="singleFileDownload(scope.row)"></el-button>
                      </el-tooltip><el-divider direction="vertical" />
                      <el-tooltip content="预览" placement="top">
                        <!-- :disabled="!isImage(scope.row.file_name)" -->
                        <el-button link type="primary" icon="View" @click="previewImage(scope.row.full_path)"
                          v-show="isImage(scope.row.file_name)"></el-button>
                      </el-tooltip><el-divider direction="vertical" v-show="isImage(scope.row.file_name)"/>
                      <el-tooltip content="删除" placement="top">
                        <el-button link type="primary" icon="Delete" @click="deleteSingleFile(scope.row, index)"></el-button>
                      </el-tooltip>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
              <div class="listBoxBottom" v-if="totalActiveCount > 0">
                <div class="totalText">共 {{ totalActiveCount }} 条数据</div>
                <el-pagination size="small" background :current-page="pageActive" :page-size="10"
                  layout="prev, pager, next" @current-change="upDataCurPage" :total="totalActiveCount" class="mt-4">
                </el-pagination>
              </div>
            </el-tab-pane>

            <el-tab-pane :label="`已删除的文件(${totalDeletedCount})`" name="deleted">
              <el-table :data="fileListDeletedData" border style="width: 100%">
                <template #empty>
                  <div class="empty-tips">
                    <svg-icon icon-class="empty"  class="empty-icon" />
                    <span class="empty-text">暂无数据</span>
                  </div>
                </template>
                <el-table-column prop="id" label="Id" width="60" align="center" fixed="left"/>
                <el-table-column prop="full_path" label="缩略图" align="center" fixed="left">
                  <template #default="scope">
                    <div v-if="isImage(scope.row.file_name)" class="thumbnail-container">
                      <img :src="scope.row.full_path" :alt="scope.row.originalName" class="thumbnail-img" />
                    </div>
                    <div v-else class="non-image-placeholder">
                      非图片文件
                    </div>
                  </template>
                </el-table-column>
                <el-table-column  label="文件全地址" align="center" width="320">
                   <template #default="scope">
                    <div class="file-link-full-path">
                      <el-tooltip :content="scope.row.full_path" placement="top"
                        :disabled="!shouldShowTooltip(scope.row.full_path)">
                        <span class="file-path-text">{{ scope.row.full_path }}</span>
                      </el-tooltip>
                      <el-link underline="hover" icon="DocumentCopy" v-copyText="scope.row.full_path" v-copyText:callback="()=>copyTextSuccess(scope.row.full_path)" style="float:right"
                        type="danger">&nbsp;复制</el-link>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="file_size" label="文件大小(KB)" width="180" align="center">
                    <template #default="scope">
                      {{ bytesToKB(+scope?.row.file_size) }}
                    </template>
                </el-table-column>
                <el-table-column prop="mime_type" label="文件类型" width="180" align="center" />
                <el-table-column prop="delete_time" label="删除时间" width="180" align="center">
                  <template #default="scope">
                    {{ scope.row.delete_time?dayjs(scope.row.delete_time).format('YYYY-MM-DD HH:mm:ss'):'--' }}
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="180" align="center">
                  <template #default="scope">
                    <div class="btn-group">
                      <el-button  type="primary" link @click="restoreFile(scope.row)">还原文件</el-button>
                      <el-divider direction="vertical" />
                      <el-button  type="danger" link @click="completeDelete(scope.row)">彻底删除</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
              <div class="listBoxBottom" v-if="totalDeletedCount > 0">
                <div class="totalText">共 {{ totalDeletedCount }} 条数据</div>
                <el-pagination size="small" background :current-page="pageDeleted" :page-size="10"
                  layout="prev, pager, next" @current-change="upDataDeletedCurPage" :total="totalDeletedCount"
                  class="mt-4">
                </el-pagination>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
    <Teleport to="body">
        <el-image-viewer 
        v-if="showPreview" 
        :url-list="curUrlList"
        :initial-index="initialIndex" 
        show-progress @close="showPreview = false" />
    </Teleport>

    <!-- 更新邮箱信息弹框 -->
     <el-dialog 
        v-model="dialogFormVisible" 
        title="更新邮箱信息" 
        width="500" 
        align-center 
        :close-on-click-modal="false"
        >
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
import { ref,reactive, watch, toRefs,onMounted } from 'vue';
import useUserStore from '@/store/modules/user'
import { dayjs,ElMessage, ElMessageBox } from 'element-plus';
import {WarningFilled} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router';

import JSZip from "jszip";
import { saveAs } from "file-saver";

import Carousel from '@/components/Carousel';
import Watermark from '@/components/WaterMark/index.vue';
import { isImage,bytesToKB } from '@/utils/tools';
import { scrollTo } from '@/utils/scroll-to.js';
import { 

  getFileListByUserId, 
  getFileListDeletedByUserId,
  getCarouselData,
  deleteUploadFile,
  batchDeleteFile,
  getFile ,
  restoreFileById,
  getOtherFileListTop5,
  completeDeleteFile
} from "@/api/uploadfile";

import {  updateUserEmail, getUserInfo } from "@/api/user";



const router = useRouter();
const userStore = useUserStore();

const multipleTableRef = ref(null);
const multipleSelection = ref([]);

const selectedTab = ref("active");

const curUrlList = ref([]); // 用于存储预览的图片列表
const showPreview = ref(false); // 控制预览弹窗的显示

const initialIndex = ref(0); // 添加这行

const fileListData = ref([]); // 存储文件列表数据
const totalActiveCount = ref(0); // 存储总的活动文件数
const pageActive = ref(1); // 当前页码


const fileListDeletedData = ref([]); // 存储已删除文件列表数据
const totalDeletedCount = ref(0); // 存储总的已删除文件数
const pageDeleted = ref(1); // 当前页码

// 轮播图数据
const carouselRef = ref(null);
const carouselData = ref([]);
const currentIndex = ref(0);

// 其他文件
const otherFileListData = ref([]);

const dialogFormVisible = ref(false);

const selectable = (row) => isImage(row.file_name);

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

const submitEmailForm = () => {
  emailFormRef.value.validate((valid) => {
    if (valid) {
      // 校验通过，执行更新邮箱逻辑
      updateUserEmail({ email: user.value.email }).then(res => {
        if(res.code === 200) {
          ElMessage({
            message: '更新邮箱成功！',
            type: 'success',
          });
          userStore.getInfo().then(res => {
            console.log('6655', res);

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
const handleSelectionChange = (val) => {
  const fileListInfo = val.map(item => {
    return {
      id: item.id,
      file_path: item.file_path,
      full_path: item.full_path,
      file_name: item.file_name,
    }
  });
  multipleSelection.value = fileListInfo;
}

const previewImage = (url) => {

   const imageFiles = fileListData.value.filter(item => isImage(item.file_name));
  // 设置预览的图片列表
  curUrlList.value = imageFiles.map(item => item.full_path);
  // 找到当前点击图片的索引
  const index = imageFiles.findIndex(item => item.full_path === url);
  initialIndex.value = index !== -1 ? index : 0;
  showPreview.value = true; // 显示预览弹窗
};

// 判断是否需要显示 tooltip（当文本被截断时才显示）
const shouldShowTooltip = (text) => {
  // 可以根据文本长度或其他条件判断
  return text && text.length > 30; // 例如超过50个字符时显示tooltip
};

/** 复制代码成功 */
function copyTextSuccess(filePath) {
  ElMessage.success("复制成功,3S后新开窗口预览文件");
  setTimeout(()=>{
    window.open(filePath);
  },3000)
}

const getFileList = async (page) => {
  try {
    const res = await getFileListByUserId(page);
    fileListData.value = res.data;
    totalActiveCount.value = res.total;
  } catch (error) {
    console.error('获取文件列表失败:', error);
    fileListData.value = [];
    totalActiveCount.value = 0;
  }
};

const getFileListDeleted = async (page) => {
  try {
    const res = await getFileListDeletedByUserId(page);
    fileListDeletedData.value = res.data;
    totalDeletedCount.value = res.total;
  } catch (error) {
    console.error('获取已删除文件列表失败:', error);
    fileListDeletedData.value = [];
    totalDeletedCount.value = 0;
  }
};

const upDataCurPage = (page) => {
  pageActive.value = page;
  scrollTo(0, 800)
}

const upDataDeletedCurPage = (page) => {
  pageDeleted.value = page;
}

// 移除原来的 watch，使用更简单的方式
const handleTabChange = () => {
  if (selectedTab.value === 'active') {
    getFileList(pageActive.value);
  } else if (selectedTab.value === 'deleted') {
    getFileListDeleted(pageDeleted.value);
  }
};

const goToUploadPage = () => {
  router.push("/uploadfile")
};

// 初始化加载
onMounted(() => {
  getFileList(1);
  getFileListDeleted(1);
  getCarouselTop5();
  getOtherFileList();
});

// 监听分页变化
watch(pageActive, (newPage) => {
  getFileList(newPage);
});

watch(pageDeleted, (newPage) => {
  getFileListDeleted(newPage);
});

// 监听标签页变化
watch(selectedTab, handleTabChange);


// 批量删除文件 
const batchDelete = () => { 

  ElMessageBox.confirm('确定要删除选中的文件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    batchDeleteFile({fileList:multipleSelection.value}).then((res)=>{
      const {code,message} = res;
      if(code === 200) {
        ElMessage.success('删除成功');
        getFileList(pageActive.value);
      } else {
        ElMessage.error(message);
      }
    });
  }).catch(() => {
    console.log('取消删除');
  });
};


// 操作项 删除单个文件
const deleteSingleFile =async (item,index) =>{
  console.log('item',item);
  try {
    ElMessageBox.confirm('确定要删除选中的文件吗？(将文件放入回收站,可还原)', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteUploadFile({ filename: item.file_path }).then((res)=>{
    if (res.success) {
          ElMessage.success('删除成功');
          getFileList(pageActive.value);
          getCarouselTop5();
          getFileListDeleted(1);
        } else {
          throw new Error(res.message)
        }
      });
  })
  } catch {
    ElMessage.error('删除失败')
  }
}



// 批量下载文件
const batchDownload = async () => { 
  let fileList = multipleSelection.value.map((item)=>{
    return {
      name: item.file_name,
      url: item.full_path  // 使用完整路径
    }
  });

  try {
    // 创建JSZip实例
    const zip = new JSZip();
    const promises = [];
    
    fileList.forEach(el => {
      const promise = getFile(el.url).then(res => {
        zip.file(el.name, res);
      });
      promises.push(promise);
    });
    
    await Promise.all(promises);
    
    // 生成二进制流
    const content = await zip.generateAsync({
      type: "blob"
    });
    
    saveAs(content, "压缩文件.zip");
    ElMessage.success('打包下载成功');
  } catch (error) {
    console.error('批量下载失败:', error);
    ElMessage.error('批量下载失败');
  }
}
// 单个文件,点击icon下载
const singleFileDownload = async (item) => { 
  try {
    const res = await getFile(item.full_path);  // 使用完整路径
    saveAs(res, item.file_name);
    ElMessage.success('下载成功');
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('下载失败');
  }
}

// 还原文件 
const restoreFile = async (item) => {
  try {
    const res = await restoreFileById(item.id);
    
    if (res.success) {
      ElMessage.success(res.msg || '文件还原成功');
      // 重新请求已删除的文件列表以更新当前视图
      await getFileListDeleted(pageDeleted.value);
      
      // 同时更新活动文件列表的总数
      try {
        const activeRes = await getFileListByUserId(1);
        totalActiveCount.value = activeRes.total;
      } catch (error) {
        console.error('更新活动文件总数失败:', error);
      }
    } else {
      ElMessage.error(res.msg || '文件还原失败');
    }
  } catch (error) {
    console.error('还原文件失败:', error);
    ElMessage.error('文件还原失败');
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
  if(carouselRef.value) {
    carouselRef.value.switchTo(i);
  }
};

const getOtherFileList = async () => { 
   try {
    const res = await getOtherFileListTop5();
    otherFileListData.value = res.data;

  } catch (error) {
    console.error('获取其他文件列表失败:', error);
  }
};


// 彻底删除操作 
const completeDelete = async (item) => {
// '确定要彻底删除该文件吗？删除后将无法恢复！(将会删除数据库记录和服务器上面的文件,请谨慎操作)'
   try {
    ElMessageBox.confirm(`<div style="text-align: center;" class="delete-confirm-tips">
        
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333;text-align:left;padding-left:30px;">
          确定要彻底删除该文件吗？
        </div>
        <div style="color: #f56c6c; font-size: 14px; margin-bottom: 20px; font-weight: bold;text-align: left;">
          删除后将无法恢复！(将会删除数据库记录和服务器上面的文件,请谨慎操作)
        </div>
        <div style="background: #fef0f0; border-radius: 4px; padding: 12px; text-align: left; font-size: 13px;">
          <div style="margin-bottom: 8px;"><strong>文件名:</strong></div>
          <div style="word-break: break-all; color: #666;">${item.file_name}</div>
        </div>
      </div>`,
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: 'custom-delete-confirm'
  }).then(() => {
    completeDeleteFile({ filename: item.file_path }).then((res)=>{
    if (res.success) {
          ElMessage.success('彻底删除成功');
          getFileListDeleted(pageDeleted.value);

        } else {
          throw new Error(res.message)
        }
      });
  })
  } catch {
    ElMessage.error('删除失败')
  }

  // try {
  //   const res = await deleteFileById(fileId);
  //   if (res.code === 200) {
  //     ElMessage.success('彻底删除成功');
  //     getFileList();
  //   }
  // } catch (error) {
  //   console.error('彻底删除失败:', error);
  // }
};


</script>

<style lang="scss" scoped>
.app-container {
  padding-right: 20px;
}

.main-content {
  display: flex;
  align-items: stretch;
  min-height: calc(100vh - 100px); // 根据你的实际需要调整
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
  margin-left: 30px;
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
  margin-top: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  //height: calc(100% - 20px);
  
  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.other-file-list{
  padding:0;
  margin:0;
  li{
    list-style: none;
    width: 96%;
    height:39px;
    line-height:39px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 0;
    border-bottom:1px solid #eee;
    font-size:12px;
    margin-bottom:5px;
  }
}

.no-data-other-file{
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height:216px;

}

.carousel{
  :deep(.el-card__body) {
  background:#ffffff;
  padding-top:10px;
  padding-left:10px;
  padding-right: 10px;

  button{
    height:20px;
    box-sizing: border-box;
    font-size:12px;
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
    font-size:12px;
  }
}

.file-box-card {
  margin-top: 20px;

  position: relative;
}

.batch-btn-group{
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

  .el-button {
    margin-right: 10px;
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

.file-link {
  width: 300px;
  padding-right:20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.file-link-type{

  padding-right:20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.file-link-full-path{
   width: 320px;
  padding-right:20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.btn-group{
  button{
    margin:0;
    span{ 
      font-size:12px;
    }
  }
}

.current{
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top:10px;

  span.num{
    margin:0 10px;
    font-size:12px;
  }
}
.empty-tips{
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 450px;
    .empty-icon{
      font-size:50px;
    }
}

</style>

<style lang="scss">

.custom-delete-confirm{
  .el-message-box__container{
    display: block;
    position: relative;

    .el-icon.el-message-box__status.el-message-box-icon--warning{
      position: absolute;
      top: 0px;
      left: 0px;
    }
  }
}

</style>