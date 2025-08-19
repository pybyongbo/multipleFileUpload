<template >
  <!--  -->
  <el-upload 
    class="upload-demo" 
    v-loading.fullscreen.lock="fullscreenLoading"
    drag 
    ref="uploadRef" 
    :multiple="true"
    :limit="uploadMaxCount" 
    :on-change="handleChange" 
    :on-exceed="handleExceed" 
    :on-remove="handleRemove"
    :on-success="handleSuccess" 
    :on-error="handleError" 
    name="files" 
    :http-request="customUploadRequest"
    list-type="text"
    >
    <el-icon>
      <UploadFilled />
    </el-icon>
    <div class="el-upload__text">拖拽上传或 <em>点击上传</em></div>
    <template #tip>
      <div class="upload_tips">
        <div class="el-upload__tip">最多上传 {{ uploadMaxCount }} 个文件，支持多种类型</div>
        <div class="el-upload__type">二进制格式上传</div>
      </div>
    </template>
  </el-upload>


  <div class="preview" v-if="previews.length">
    <template v-if="cpreviewsList.pictureList.length">
        <h4>图片文件:</h4>
        <ul>
          <li v-for="(file, index) in cpreviewsList.pictureList" :key="index" class="list-item">
            <img :src="file.full_path" :alt="file" @click="previewImage(index, file.full_path)"
              style="max-width: 200px; margin-bottom: 10px;" />
            <div class="btn-group">
              <el-button size="small" type="primary" @click="previewImage(index, file.full_path)">
                预览
              </el-button>
              <el-button size="small" type="danger" @click="deleteFile(file, index)">
                删除
              </el-button>
            </div>
          </li>
        </ul>
    </template>
    

    <template v-if="cpreviewsList.otherList.length">
      <h4>其他文件:</h4>
      <div v-for="(file, index) in cpreviewsList.otherList" :key="index" class="other-list-item">
        <a href="javascript:void(0);" target="_blank" @click="previewImage(index, file.full_path)">{{ file.full_path }}</a>
      </div>
    </template>

  </div>
  <el-image-viewer v-if="showPreview" :url-list="cpreviewsList?.pictureList.map(item => item.full_path)"
    :initial-index="previewIndex" show-progress @close="showPreview = false" />
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import {debounce} from 'lodash';
import { uploadFile, deleteUploadFile,uploadFileBinary } from "@/api/uploadfile";

import { getToken, setToken, removeToken } from '@/utils/auth'

const fullscreenLoading = ref(false)

const uploadMaxCount = 5; // 最大上传文件数

const uploadRef = ref(null);
const totalFiles = ref(0) // 总文件数
const uploadedCount = ref(0) // 已上传文件数
const fileList = ref([]) // 已上传的文件列表
const previews = ref([]);

const uploadingFiles = ref([]) // 正在上传的文件列表


const showPreview = ref(false) // 控制预览弹窗的显示
const previewIndex = ref(0) // 要预览的图片索引


const cpreviewsList = computed(() => {
  console.log('previews.value',previews.value);
  return {
    pictureList: previews.value?.filter(item => item?.mimeType.startsWith('image/')).map(item => item),
    otherList: previews.value?.filter(item => !item?.mimeType.startsWith('image/')).map(item => item)
  }
})


// 上传拦截：自定义上传逻辑
// 上传拦截：自定义上传逻辑
const customUploadRequest = async ({ file, onProgress, onSuccess, onError }) => {
  console.log('file', file);
  
  // 将文件添加到正在上传列表
  uploadingFiles.value.push(file.uid);
  
  try {
    // 读取文件为 ArrayBuffer (二进制数据)
    const arrayBuffer = await file.arrayBuffer();

    console.log('arrayBuffer', arrayBuffer);
    
    // 直接发送二进制数据
    const res = await uploadFileBinary(arrayBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-File-Ext': file.name.split('.')[1], // 文件扩展名
        'X-File-Name': encodeURIComponent(file.name),
        'X-File-Type': file.type || 'application/octet-stream',
        'X-File-Size': file.size.toString(),
        Authorization: `Bearer ${getToken()}`, // 如果有 token，则添加到请求头中
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress({ percent });
      }
    });
    
    console.log('res', res);
    
    if (res.success) {
      // 处理返回的文件列表
      const uploadedFiles = Array.isArray(res.files) ? res.files : [res.files];
      
      uploadedFiles.forEach(uploadedFile => {
        previews.value.push(uploadedFile);
        fileList.value.push({
          name: uploadedFile.originalName,
          url: uploadedFile.full_path
        });
      });
      
      // 从正在上传列表中移除
      uploadingFiles.value = uploadingFiles.value.filter(uid => uid !== file.uid);
      uploadedCount.value++;
      
      // 检查是否所有文件都已上传完成
      checkAllFilesUploaded();
      
      // 调用成功回调
      onSuccess(res);
    } else {
      throw new Error(res.msg || '上传失败');
    }
  } catch (err) {
    console.error('上传失败:', err);
    // 从正在上传列表中移除
    uploadingFiles.value = uploadingFiles.value.filter(uid => uid !== file.uid);
    ElMessage.error(`文件 ${file.name} 上传失败: ${err.message || err}`)
    onError(err)
  }
}
// 检查所有文件是否上传完成
const checkAllFilesUploaded = debounce(() => {
  // 确保总文件数大于0，并且已上传文件数等于总文件数，且没有正在上传的文件
  if (totalFiles.value > 0 && 
      uploadedCount.value === totalFiles.value && 
      uploadingFiles.value.length === 0) {
    
    ElMessage.success(`成功上传 ${uploadedCount.value} 个文件！`);
    fullscreenLoading.value = false;
    
  }
},500);

const getFileExtension = (filename) => {
  const idx = filename && filename.lastIndexOf('.');
  return idx !== -1 ? filename?.slice(idx + 1) : '';
};

// 图片预览方法，传入要预览的图片索引
const previewImage = (index, file) => {
  console.log('file', file);
  if (['jpg', 'png', 'jpeg', 'bmp', 'gif', 'svg', 'webp'].includes(
    getFileExtension(file)
  )) {
    previewIndex.value = index
    //previews.value = cpreviewsList.value.pictureList // 更新预览列表
    showPreview.value = true
  } else {
    window.open(file, '_blank')
  }

}

// 重置上传状态
const resetUploadState = () => {
  uploadedCount.value = 0;
  totalFiles.value = 0;
  // if (uploadRef.value) {
  //   uploadRef.value.clearFiles();
  // }
};

// 成功上传
const handleSuccess = () => {
  // 检查是否所有文件都已上传完成
  checkAllFilesUploaded();
}

// 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用
const handleChange = (file, fileListArr) => {
  fullscreenLoading.value = true;
  // 更新总文件数
  totalFiles.value = fileListArr.length;
};
const handleError = () => {
   ElMessage.error(`文件 ${file.name} 上传失败`)
  // 从正在上传列表中移除
  uploadingFiles.value = uploadingFiles.value.filter(uid => uid !== file.uid);
}

const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${uploadMaxCount} 个文件`)
}

const handleRemove = (file) => {
  // 可选：删除预览中的项
  previews.value = previews.value.filter(f => f.originalName !== file.name)
}

// 删除文件（调用后端接口）
const deleteFile = async (file, index) => {

  try {
    console.log('file',file);
    const res = await deleteUploadFile({ filename: file.filePath });
    if (res.success) {
      previews.value = previews.value.filter(f => f.originalName !== file.originalName)
      fileList.value = fileList.value.filter(f => f.name !== file.originalName)
      ElMessage.success('删除成功')
    } else {
      throw new Error()
    }


  } catch {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped lang="scss">
.upload-demo {
  margin: 50px auto;
  width: 480px;
}

.preview {
  h4 {
    text-align: center;
  }
  ul {
    display: flex;
    justify-content: center;
    align-items: center;
    list-style-type: none;
    gap: 20px;

    li.list-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      img {
        width: 200px;
        height: 150px;
        object-fit: cover;
        cursor: pointer;
      }

    }
  }

  .other-list-item {
    width: 58%;
    margin: 0 auto;

    a {
      display: block;
      width: 100%;
      text-align: left;
      margin-bottom: 10px;
      color: var(--el-color-primary);
    }
  }
}

.upload-demo :deep(.el-upload-list) {
  display: none;
}

.upload_tips{
  display: flex;
  justify-content: space-between;

   .el-upload__type{
    color: var(--el-text-color-regular);
    font-size: 12px;
    margin-top: 7px;
   }
}

</style>
