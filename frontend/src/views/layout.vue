<template>
  <div class="app-wrapper app-layout">
    <Watermark :text="`当前用户:${userStore.userInfo.username}`" :opacity="0.3" :font-size="30" color="#dedede" :gap="30">
      <div class="main-layout">
        <NavBar />
        <div class="layout-content">
          <router-view></router-view>
        </div>
        <Footer />
      </div>
    </Watermark>
  </div>
</template>

<script setup>

import NavBar from '../components/NavBar/index.vue';
import Footer from '../components/Footer/index.vue';
import Watermark from '@/components/WaterMark/index.vue';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();
console.log('userStore', userStore);
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-content {
  flex: 1;
  margin-top: 60px; /* 为固定导航栏留出空间 */
  min-height: calc(100vh - 60px);
}


</style>