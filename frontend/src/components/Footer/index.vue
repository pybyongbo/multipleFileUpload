<template>
  <div class="global-footer">
    <div class="footer-content">
      <div class="footer-top">
        <div class="footer-info">
          <p class="support">
             文件上传/接口下载/分片上传/压缩下载应用一站式扫盲
           <span>@ {{currentYear}}-{{currentMonth}}</span>
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="divider"></div>
        <p class="footer-note">
           用心打造每一个功能，为用户提供最佳体验 
             <el-divider direction="vertical" />
             技术支持:<a href="https://901web.com" target="_blank" class="link">
              <i class="el-icon-link"></i>
              901web前端博客
            </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// 响应式数据
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

// 格式化月份显示
const formatMonth = (month) => {
  return month < 10 ? `0${month}` : month
}

// 组件挂载时更新时间
onMounted(() => {
  currentYear.value = new Date().getFullYear()
  currentMonth.value = formatMonth(new Date().getMonth() + 1)
})
</script>

<style lang="scss" scoped>

.global-footer {
  background: linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%);
  color: #ecf0f1;
  text-align: center;
  font-size: 14px;
  line-height: 1.6;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  
  // 添加过渡效果
  transition: all 0.3s ease;
}

.footer-content {
  width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
}

.footer-info {
  display: flex;
  flex: 1;

  justify-content: center;
  position: relative;
  
  .copyright {
    margin: 0 0 8px 0;
    font-weight: 500;
    color: #3498db;
    
    i {
      margin-right: 8px;
      color: #3498db;
    }
  }
  
  .support {
    margin: 0;
    color: #bdc3c7;
    overflow: hidden;
  }
}

.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: right;
  
  .tech-item {
    background: rgba(52, 152, 219, 0.15);
    padding: 6px 12px;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(52, 152, 219, 0.2);
    
    i {
      color: #3498db;
      font-size: 14px;
    }
  }
}

.footer-bottom {
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    margin: 15px 0;
  }
  
  .footer-note {
    margin: 0;
    color: #95a5a6;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    
   .link {
      color: var(--el-color-primary-light-3);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      float:right;
      &:hover {
        color:var(--el-color-primary); 
        text-decoration: underline;
      }
      
      i {
        font-size: 12px;
      }
    }
  }
}





</style>