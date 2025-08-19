<template>
  <div class="app-wrapper">
    <Watermark :text="`当前用户:${userStore.name}`" :opacity="0.3" :font-size="30" color="#dedede" :gap="30">
      <div class="main-container">
        <NavBar />
        <router-view></router-view>
      </div>
    </Watermark>
  </div>
</template>

<script setup>

import NavBar from '../components/NavBar/index.vue';
import Watermark from '@/components/WaterMark/index.vue';
import useUserStore from '@/store/modules/user';

const userStore = useUserStore();
</script>

<style lang="scss" scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>