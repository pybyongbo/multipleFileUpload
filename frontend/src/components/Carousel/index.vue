<template>
  <div 
  v-show="imgs.length"
  class="carousel"
  @mouseenter="stop()"
  @mouseleave="start()"

  >

  <div class="imgs" :style="{ transform: `translateX(${-index*100}%)` }">
    <img v-for="(item, i) in imgs" :key="item.id" :src="item.full_path" alt=""></img>
  </div>

  <div class="indicators">
    <span v-for="(item, i) in imgs" :key="item.id" @click="switchTo(i)" class="indicator" :class="{ active: index === i }">
    </span>
  </div>

  </div>
</template>

<script setup>
import {ref,watch,onBeforeUnmount,toRefs} from 'vue';

const props = defineProps({
  imgs: {
    type: Array,
    default: () => []
  },

  // 自动播放
  autoPlay: {
    type: Boolean,
    default: false
  },
  // 持续时间
  duration: {
    type: Number,
    default: 3000
  },

});

const {imgs,autoPlay,duration} = toRefs(props);

const emit = defineEmits(['change']);

const index = ref(0);

let timer = null;

const switchTo = (i) => { 

  if(i<0) {
    i=0;
  } else if(i>imgs.value.length-1) {
    i=imgs.value.length-1;
  }

  // 如果当前索引和传入的索引相同，则不执行切换
  if(i === index.value) {
    return;
  }
  index.value = i;
  emit('change',i);
}


const autoPlayFn = () => { 
  // 这里要每次进行清空定时器,不然会开启多个定时器
  clearInterval(timer);

  timer = setInterval(() => {
    index.value++;
    if(index.value > imgs.value.length-1) {
      index.value = 0;
    }
    emit('change',index.value);
  },duration.value);

}


watch(() => imgs.value,(newVal)=>{
  // 有数据,&& 开启自动播放,才调用自动播放函数
  if(newVal.length && autoPlay.value) {
    autoPlayFn();
  }
},{
  immediate: true
});


const stop = () =>{
  if(timer) {
    clearInterval(timer);
  }
}
const start = () =>{ 
  if(imgs.value.length && autoPlay.value) {
    autoPlayFn();
  }
}

defineExpose({
  switchTo,
  // stop,
  // start
});


// 组件销毁时,清理定时器
onBeforeUnmount(() => {
  if(timer) {
    clearInterval(timer);
  }
});


</script>

<style lang="scss" scoped>

.carousel {
  width: 100%;
  height:220px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 9/16;
}

.imgs{
  display:flex;
  flex-direction: row;
  transition:all 0.5s ease;

  img{
    width:100%;
    height:100%;
    object-fit: cover;
  }
}

.indicators{ 
  position: absolute;
  bottom:10px;
  left: 50%;
  transform: translateX(-50%);

  width:100px;
  height:30px;

  .indicator{
    display: inline-block;
    width:10px;
    height:10px;
    background:#fff;
    border-radius: 50%;
    margin: 0 5px;
    cursor: pointer;
    &.active{
      background:var(--el-color-primary)
    }
  }


}


</style>