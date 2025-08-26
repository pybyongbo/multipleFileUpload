<template>
  <div class="watermark-container" ref="parentRef">

    <slot></slot>

    <!-- 添加一个div,填充整个区域,设置水印背景,重复 -->

  </div>
</template>

<script setup>

import { ref, onMounted, onUnmounted, watchEffect, nextTick } from 'vue';
import useWatermarkBg from '../../hooks/useWatermarkBg';

const props = defineProps({
  text: {
    type: String,
    default: '水印文本'
  },
  fontSize: {
    type: Number,
    default: 40
  },
  color:{
    type: String,
    default: '#000'
  },
 gap:{
  type: Number,
  default:20
 },
  // 新增属性：控制水印透明度
  opacity: {
    type: Number,
    default: 0.15
  },
  // 新增属性：控制是否阻止交互
  preventInteraction: {
    type: Boolean,
    default: false
  },
  rotate: {
    type: Number,
    default: -45
  }
});

const bg = useWatermarkBg(props);

const parentRef = ref(null);
// 定义一个依赖
const flag = ref(0);
let div;

// 挂载以后添加水印,
// 监听元素属性变化,防止篡改
// 动态生成水印元素div

watchEffect(() => { 

  flag.value++;
  if(!parentRef.value) {
    return;
  }

  if(div) {
    div.remove();
  }

  const {base64,styleSize} = bg.value;
  div = document.createElement('div');
  div.style.backgroundImage = `url(${base64})`;
  div.style.backgroundSize = `${styleSize}px ${styleSize}px`;
  // 重复平铺
  div.style.backgroundRepeat = 'repeat';

  div.style.color = `${props.color}`;
  // 覆盖到同级的上一个元素
  div.style.zIndex = 1111111;

  // 绝对定位
  div.style.position = 'absolute';
  // 设置边距
  div.style.inset = 0;

   // 设置透明度
  div.style.opacity = props.opacity;
 // 控制是否阻止交互
  div.style.pointerEvents = props.preventInteraction ? 'auto' : 'none';
  
  // 确保不会影响页面布局
  div.style.width = '100%';
  div.style.height = '100%';
  parentRef.value.appendChild(div);
});

onMounted(()=>{
  // 监控元素属性,子元素,内容,元素本身的变化

  let ob = new MutationObserver((records)=>{

    for (let record of records) { 
      // 判断删除的节点
      for(const dom of record.removedNodes) {

        // 判断节点是不是水印
        if(dom === div) {
          // 删除水印元素触发 watchEffect 
          console.log('删除了水印元素');

          flag.value++;
          return;
        }
      }

      // 修改水印元素触发 watchEffect
      if(record.target === div) {
        console.log('修改了水印元素属性');
        flag.value++;
        return;

      }


    }

  });

  // 监听 parentRef.value的变化
  // 监听内容: childList,attributes, subtree

  ob.observe(parentRef.value, {
    childList: true,
    attributes: true,
    subtree: true,
    attributeFilter: ['style'],
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true,
    // 监听回调
    // callback: (mutationsList, observer) => {
    //   console.log('监听回调执行啦~');
    // }
  });

  onUnmounted(() => {
   ob && ob.disconnect();
   div = null;
  });

})

</script>

<style lang="scss" scoped>

.watermark-container{
  position:relative;
   // 确保容器不会创建新的层叠上下文影响布局
  transform: translateZ(0);
}

</style>