<template>
  <el-upload
    class="upload-demo"
    drag
    ref="uploadRef"
    action="http://localhost:3000/upload"
    :multiple="true"
    :limit="3"
    :file-list="fileList"
    :on-change="handleChange"
    :on-exceed="handleExceed"
    :on-remove="handleRemove"
    :on-success="handleSuccess"
    :on-error="handleError"
    name="files"
    :http-request="customUploadRequest"
    list-type="text"
  >
    <el-icon><UploadFilled /></el-icon>
    <div class="el-upload__text">拖拽上传或 <em>点击上传</em></div>
    <template #tip>
      <div class="el-upload__tip">最多上传 3 个文件，支持多种类型</div>
    </template>
  </el-upload>

  <div class="preview" v-if="previews.length">
    <h3>文件预览：</h3>
    <ul>
      <li v-for="(file, index) in previews" :key="index" class="list-item">
        <template v-if="file.mimetype.startsWith('image/')">
          <!-- 点击时只预览当前图片 -->
          <img :src="file.path" :alt="file.originalName" @click="previewImage(index)" style="max-width: 200px; margin-bottom: 10px; cursor: pointer;" />
        </template>
        <template v-else>
          <a :href="file.path" target="_blank">{{ file.originalName }}</a>
        </template>
        <el-button
          size="small"
          type="danger"
          @click="deleteFile(file, index)"
        >
          删除
        </el-button>
      </li>
    </ul>
  </div>
  
  <!-- 修改图片预览组件，支持初始索引 -->
  <el-image-viewer
    v-if="showPreview"
    :url-list="previews.map(item => item.path)"
    :initial-index="previewIndex"
    show-progress
    @close="showPreview = false"
  />
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const uploadRef = ref(null);
const totalFiles = ref(0) // 总文件数
const uploadedCount = ref(0) // 已上传文件数
const fileList = ref([]) // 已上传的文件列表
const previews = ref([])

const showPreview = ref(false) // 控制预览弹窗的显示
const previewIndex = ref(0) // 要预览的图片索引

// 上传拦截：自定义上传逻辑
const customUploadRequest = async ({ file, onProgress, onSuccess, onError }) => {
  const formData = new FormData()
  formData.append('files', file)

  try {
    const res = await axios.post('http://localhost:3000/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress({ percent })
      },
    })

    const uploaded = res.data.files[0]
    previews.value.push(uploaded)
    fileList.value.push({
      name: uploaded.originalName,
      url: uploaded.path
    })
    onSuccess(res.data)
    uploadedCount.value++;
  } catch (err) {
    ElMessage.error('上传失败')
    onError(err)
  }
}

// 图片预览方法，传入要预览的图片索引
const previewImage = (index) => {
  previewIndex.value = index
  showPreview.value = true
}

// 重置上传状态
const resetUploadState = () => {
  uploadedCount.value = 0;
  totalFiles.value = 0;
};

// 成功上传
const handleSuccess = () => {
  // 检查是否所有文件都已上传完成
  if (uploadedCount.value === totalFiles.value && totalFiles.value > 0) {
    ElMessage.success('所有文件上传成功！');
    resetUploadState();
  }
}

// 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用
const handleChange = (file, fileListArr) => {
  // 更新总文件数
  totalFiles.value = fileListArr.length;
};

const handleError = () => {
  ElMessage.error('上传失败')
}

const handleExceed = () => {
  ElMessage.warning('最多只能上传 3 个文件')
}

const handleRemove = (file) => {
  // 可选：删除预览中的项
  previews.value = previews.value.filter(f => f.originalName !== file.name)
}

// 删除文件（调用后端接口）
const deleteFile = async (file, index) => {
  try {
    const res = await axios.post('http://localhost:3000/delete', { filename: file.url })
    if (res.data.success) {
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
.upload-demo{
  margin: 20px auto;
  width:480px;
}

.preview{
   ul{
    display: flex;
    list-style-type: none;
    gap:20px;
    li.list-item{
      display: flex;
      flex-direction: column;
      align-items: center;
    }
   }
}
</style>