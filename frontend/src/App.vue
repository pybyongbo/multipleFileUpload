<template>

    <router-view></router-view>

</template>

<script setup>
import {  ref } from 'vue';
</script>

<style scoped lang="scss">
// 特别针对更新邮箱信息弹框中的按钮
:deep(.el-dialog) {
  .el-button {
    &:focus,
    &:focus-visible {
      outline: none;
      border-color: transparent;
    }
  }
}
</style>


<style lang="scss" >


// 移除 el-button 聚焦时的边框 - 全局
:deep(.el-button:focus) {
  outline: none;
  border-color: transparent;
}

:deep(.el-button:focus-visible) {
  outline: none;
  border-color: transparent;
}

// 特别针对弹框内的按钮聚焦样式
:deep(.el-dialog) {
  .el-button {
    &:focus,
    &:focus-visible {
      outline: none;
      border-color: transparent;
    }
  }
}

// 特别针对 ElMessage 提示框中的按钮聚焦样式
:deep(.el-message) {
  .el-button {
    &:focus,
    &:focus-visible {
      outline: none!important;
      border-color: transparent;
    }
  }
}

// 特别针对 ElMessageBox 弹框中的按钮聚焦样式
:deep(.el-message-box) {
  .el-button {
    &:focus,
    &:focus-visible {
      outline: none!important;
      border-color: transparent;
    }
  }
}
</style>
