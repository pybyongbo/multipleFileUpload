<template>
  <div class="page">
    <div class="page_top">
      <h2 class="page-title">分片上传</h2>
      <div class="statistics">{{ statistics }}</div>
      <div class="page_top_right" :style="{ 'justify-content': taskArr.length > 1 ? 'space-between' : 'flex-end' }">
        <el-button type="warning" plain @click="clear" v-if="taskArr.length > 1" class="action-btn">
          全部取消
        </el-button>
        <el-button type="danger" plain @click="clickClearDir" class="action-btn">
          清空文件
        </el-button>
      </div>
    </div>

    <div class="content" ref="contentRef">
      <div v-if="taskArr.length === 0" class="empty-state">
        <el-icon size="48" color="#409eff">
          <Upload />
        </el-icon>
        <el-upload multiple :auto-upload="false" :show-file-list="false" @change="handleFileChange" class="upload-demo">
          <el-button type="primary" size="large" round>
            <el-icon>
              <Plus />
            </el-icon>
            选择文件
          </el-button>
        </el-upload>
        <p>暂无上传任务</p>
      </div>
      <ListItem :task-arr="taskArr" @pauseUpdate="pauseUpdate" @goonUpdate="goonUpdate" @reset="reset" />
    </div>

    <div class="bottom_box">

    </div>
    <div class="messageList">
    </div>
  </div>
</template>

<script setup>
  import { onMounted, ref, getCurrentInstance, toRaw, watch, computed, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  // 导入 Element Plus 图标
  import { Upload, Plus } from '@element-plus/icons-vue'
  import { update, checkFile, mergeSlice, clearDir } from "@/api/uploadfile"
  import { getToken } from '@/utils/auth'
  import ListItem from './listItem.vue'

  // 显示到视图层的初始数据:
  const contentRef = ref()
  const localForage = (getCurrentInstance().proxy).$localForage
  const unit = 1024 * 1024 * 3  //每个切片的大小定位3m
  const taskArr = ref([])
  let uploadingArr = []
  let maxNumb = 6  // 最大请求并发数

  const statistics = computed(() => {
    const otherArr = taskArr.value.filter(item => item.state !== 4)
    return `${otherArr.length}/${taskArr.value.length}`
  })

  const handleFileChange = (file, fileList) => {
    // 处理多个文件的情况
    const files = Array.isArray(file) ? file.map(f => f.raw) : [file.raw];
    const event = {
      target: {
        files: files,
        value: ''
      }
    }
    inputChange(event)
  }

  // 监听任务改变
  watch(() => taskArr.value, (newVal, oldVal) => {
    setTaskArr()
  }, { deep: true })

  // 页面一打开就调用:
  onMounted(() => {
    getTaskArr();
  })

  // 注册事件:
  // 暂停
  const pauseUpdate = (item, elsePause = true) => {
    // 先看是不是失败的,如果不是elsePause为true,就是暂停.为false就是中断
    if (![4, 6].includes(item.state)) {
      elsePause ? item.state = 3 : item.state = 5
    }
    item.errNumber = 0
    // 记录暂停时间
    if (item.state === 3) {
      item.pausedAt = Date.now()
    }
    // 将正在请求的分片重新放回allData数组，以便后续继续上传
    if (item.whileRequests.length > 0) {
      item.allData.unshift(...item.whileRequests)
      item.whileRequests = []
    }
    for (const itemB of item.allData) {
      itemB.cancel ? itemB.cancel() : ''
    }
  }

  // 继续
  const goonUpdate = (item) => {
    item.state = 2
    // 记录继续时间并计算中断时间
    if (item.pausedAt) {
      const pausedDuration = Date.now() - item.pausedAt
      item.totalPausedTime += pausedDuration
      item.pausedAt = null
    }

    const progressTotal = 100 - item.percentage
    item.allData.push(...item.whileRequests)
    item.whileRequests = []

    slicesUpdate(item, progressTotal)
  }

  // 取消,取消了就是不想继续上传了,所以两个数组都将这个进度删掉
  const reset = async (item) => {
    pauseUpdate(item)
    taskArr.value = toRaw(taskArr.value).filter(itemB => itemB.id !== item.id)
    uploadingArr = uploadingArr.filter(itemB => itemB.id !== item.id)
  }

  // 全部取消
  const clear = () => {
    for (const item of taskArr.value) { pauseUpdate(item) }
    const allId = toRaw(taskArr.value).map(item => item.id)
    uploadingArr = uploadingArr.filter(item => !allId.includes(item.id))
    taskArr.value = []
  }

  // 清空
  const clickClearDir = async () => {
    for (const item of taskArr.value) { pauseUpdate(item) }
    const res = await clearDir()
    if (res.result === 1) {
      taskArr.value = []
      uploadingArr = []
      localForage.clear()
      // message('清空成功');
      ElMessage.success('清空成功')
    }
  }

  // 设置已完成
  const isFinishTask = (item, urlPath) => {
    item.percentage = 100
    item.state = 4
    // 记录完成时间并计算总用时
    item.finishedAt = Date.now()
    item.totalTime = item.finishedAt - item.startedAt - item.totalPausedTime

    // 显示完成消息，包含完成时间
    const finishTime = new Date(item.finishedAt).toLocaleString('zh-CN')
    message(`${item.name} 上传完成，完成时间：${finishTime}，用时：${formatTime(item.totalTime)}`);

    console.log('item', urlPath);

    ElMessage.success({ message: '上传完成,3秒后将自动打开新窗口查看~', offset: 150 });

    setTimeout(() => {
      window.open(urlPath)
    }, 3000)

  }

  // 输入框change事件
  const inputChange = async (e) => {
    const target = e.target;
    const files = target.files;
    for (let h = 0; h < files.length; h++) {
      const file = files[h]
      console.log(file, 'file')
      h === files.length - 1 ? nextTick(() => { target.value = '' }) : ''
      let inTaskArrItem = {
        id: new Date().getTime(),
        md5: '',
        name: file.name,
        state: 0,
        fileSize: file.size,
        allData: [],  // 所有请求的数据
        whileRequests: [],  // 正在请求中的请求个数,目前是要永远都保存请求个数为6
        finishNumber: 0,  //请求完成的个数
        errNumber: 0,  // 报错的个数,默认是0个,超多3个就是直接上传中断
        percentage: 0,
        // 添加时间相关字段
        startedAt: Date.now(),     // 开始时间
        pausedAt: null,           // 暂停时间
        finishedAt: null,         // 完成时间
        totalPausedTime: 0,       // 总暂停时间
        totalTime: 0              // 总用时
      }
      taskArr.value.push(inTaskArrItem)
      nextTick(() => { contentRef.value.scrollTop = (110 + 20) * (taskArr.value.length + 1) })  // 设置滚动条滚到最底部
      inTaskArrItem = taskArr.value.slice(-1)[0]
      inTaskArrItem.state = 1
      if (file.size === 0) {
        // 文件大小为0直接上传失败
        inTaskArrItem.state = 6
        pauseUpdate(inTaskArrItem, false)
        continue
      }
      const fileMd5 = await useWorker(file)
      console.log(fileMd5, '哈希计算完成')
      inTaskArrItem.state = 2;
      inTaskArrItem.md5 = fileMd5;
      const sliceNumber = Math.ceil(file.size / unit)  // 向上取证切割次数,例如20.54,那里就要为了那剩余的0.54再多遍历一次
      console.log('sliceNumber', sliceNumber);
      // 先看是不是有同一个文件在上传中或者在那暂停着
      // 再查本地再查远程服务器,本地已经上传了一半了就重新切割好对上指定的片,继续上传就可以了,state为2是上传中,3是暂停中
      const isNeedUploadingArr = uploadingArr.filter(item => fileMd5 === item.md5 && item.state === 2)
      const theSameMd5Arr = toRaw(taskArr.value).filter(item => item.md5 === fileMd5)  // 和当前文件的哈希值一致的文件进度
      const needDelete = theSameMd5Arr.pop()

      if (theSameMd5Arr.length > 0 && theSameMd5Arr[0].state !== 4) {
        const firstItem = theSameMd5Arr[0]

        const needIndex = taskArr.value.findIndex((item) => item.id === needDelete.id)
        const needIndexB = taskArr.value.findIndex((item) => item.id === firstItem.id)
        if (firstItem.state === 2) {
          message(`${firstItem.name} 已经正在上传中了`)
          taskArr.value.splice(needIndex, 1)
        } else if (firstItem.state === 3 || firstItem.state === 5) {
          message(`${needDelete.name} 之前已经上传了部分,现在可以继续上传`)
          taskArr.value.splice(needIndex, 1)
          const updateObj = taskArr.value[needIndexB]
          console.log(9999, updateObj);
          updateObj.state = 2
          updateObj.allData.push(...updateObj.whileRequests)
          updateObj.whileRequests = []
          inTaskArrItem = updateObj
          slicesUpdate(inTaskArrItem)
        }
      } else if (isNeedUploadingArr.length > 0) {
        const updateTaskObj = isNeedUploadingArr[0]
        message(`${updateTaskObj.name} 之前已经上传了部分,现在可以继续上传`)
        for (let i = 0; i < sliceNumber; i++) {
          const inFileMd5 = `${updateTaskObj.md5}-${i}`
          const inAllDataItem = updateTaskObj.allData.find((item) => item.fileMd5 === inFileMd5)
          inAllDataItem ? inAllDataItem.file = file.slice(i * unit, i * unit + unit) : ''
        }
        const needIndex = taskArr.value.findIndex((item) => item.md5 === fileMd5)
        taskArr.value.splice(needIndex, 1, updateTaskObj)
        inTaskArrItem = taskArr.value[needIndex]
        slicesUpdate(inTaskArrItem)
      } else {
        try {

          const resB = await checkFile({ md5: fileMd5, size: inTaskArrItem.fileSize })
          const { result, urlPath } = resB
          // 返回1说明服务器没有
          if (result === 1) {
            for (let i = 0; i < sliceNumber; i++) {
              const sliceFile = file.slice(i * unit, i * unit + unit)
              const needObj = {
                file: sliceFile,
                fileMd5: `${fileMd5}-${i}`,
                sliceFileSize: sliceFile.size,
                index: i,
                fileSize: file.size,
                fileName: file.name,
                sliceNumber,
                finish: false
              }
              inTaskArrItem.allData.push(needObj)
            }
            // console.log(inTaskArrItem,'inTaskArrItem')
            slicesUpdate(inTaskArrItem)
          } else {
            // -1就是直接秒传完成,-2就是直接上传中断提示服务器剩余容量不足
            if (result === -1) {
              isFinishTask(inTaskArrItem, urlPath)
            } else if (result === -2) {
              pauseUpdate(inTaskArrItem, false)
              message('服务器剩余容量不足! 请清空本地和服务器存储的文件')
            }
          }
        } catch (err) {
          pauseUpdate(inTaskArrItem, false)
          continue
        }
      }
    }
  }

  // Promise封装web Worker计算结果返回
  const useWorker = (file) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./js/hash.js')  //复杂的计算,使用web Worker提高性能
      worker.postMessage({ file })
      worker.onmessage = (e) => {
        const { name, data } = e.data
        name === 'succeed' ? resolve(data) : reject(data)
      }
    })
  }

  // 切片上传
  const slicesUpdate = (taskArrItem, progressTotal = 100) => {
    // 一片都没有了,或者有正在请求中的接口,都直接不执行下边的逻辑,毕竟都有正在请求中的还上传,容易造成并发数高于浏览器限制
    // console.log(6666,taskArrItem.allData.length === 0 || taskArrItem.whileRequests.length > 0);
    if (taskArrItem.allData.length === 0 || taskArrItem.whileRequests.length > 0) { return }

    const isTaskArrIng = toRaw(taskArr.value).filter(itemB => itemB.state === 1 || itemB.state === 2)
    maxNumb = Math.ceil(6 / isTaskArrIng.length)  // 实时动态获取并发请求数,每次掉请求前都获取一次最大并发数
    const whileRequest = taskArrItem.allData.slice(-maxNumb)
    taskArrItem.allData.length > maxNumb ? taskArrItem.allData.length = taskArrItem.allData.length - maxNumb : taskArrItem.allData.length = 0
    taskArrItem.whileRequests.push(...whileRequest)
    for (const item of whileRequest) {
      console.log('准备上传分片', item);
      isUpdate(item)
    }
    // 单个分片请求
    async function isUpdate(needObj) {
      const fd = new FormData()
      const { file, fileMd5, sliceFileSize, index, fileSize, fileName, sliceNumber } = needObj
      fd.append('file', file)
      fd.append('fileMd5', fileMd5)
      fd.append('sliceFileSize', String(sliceFileSize))
      fd.append('index', String(index))
      fd.append('fileSize', String(fileSize))
      fd.append('fileName', fileName)
      fd.append('sliceNumber', String(sliceNumber))
      const res = await update(fd,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`, // 如果有 token，则添加到请求头中
          }
        }
      ).catch(() => { })
      if (taskArrItem.state === 5 || taskArrItem.state === 3) { return }  // 你的状态都已经变成暂停或者中断了,就什么都不要再做了,及时停止
      // 请求异常,或者请求成功服务端返回报错都按单片上传失败逻辑处理,.then.catch的.catch是只能捕捉请求异常的
      if (!res || res.result === -1) {
        taskArrItem.errNumber++
        // 超过3次之后直接上传中断
        if (taskArrItem.errNumber > 3) {
          console.log('超过三次了')
          pauseUpdate(taskArrItem, false)  // 上传中断
        } else {
          console.log('还没超过3次')
          isUpdate(needObj)  // 失败了一片,单个分片请求
        }
      } else {
        const { result, data } = res.data;
        console.log('data', data);
        if (result === 1) {
          sliceProgress(needObj, taskArrItem, progressTotal)  // 更新进度条
          taskArrItem.errNumber > 0 ? taskArrItem.errNumber-- : ''
          taskArrItem.finishNumber++
          needObj.finish = true
          taskArrItem.whileRequests = taskArrItem.whileRequests.filter(item => item.index !== needObj.index)  // 上传成功了就删掉请求中数组中的那一片
          console.log(taskArrItem.whileRequests.length, '请求成功了')
          if (taskArrItem.finishNumber === sliceNumber) {
            const resB = await mergeSlice(data, {
              headers: {
                Authorization: `Bearer ${getToken()}`
              }
            }).catch(() => { })

            resB && resB.data.result === 1 ? isFinishTask(taskArrItem, resB.data.urlPath) : pauseUpdate(taskArrItem, false)
            taskArrItem.finishNumber = 0
          } else {
            slicesUpdate(taskArrItem)
          }
        } else if (result === -2) {
          pauseUpdate(taskArrItem, false)
          message('服务器剩余容量不足! 请清空本地和服务器存储的文件')
        }
      }
    }
  }

  // 更新进度条
  const sliceProgress = (needObj, taskArrItem, progressTotal) => {
    // 即使是超时请求也是会频繁的返回上传进度的,所以只能写成完成一片就添加它所占百分之多少,否则会造成误会
    const placeholder = progressTotal / needObj.sliceNumber  // 每一片占100的多少
    taskArrItem.percentage = taskArrItem.percentage + placeholder
  }

  // 获取本地有没要继续上传的任务,状态为2都是可以继续上传的,1,4和5都没必要继续上传了
  // 暂停的,继续上传的,上传中断的自动继续上传
  const getTaskArr = async () => {
    const arr = await localForage.getItem('taskArr').catch(() => { })

    if (!arr || arr.length === 0) { return }
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]
      if (item.state === 3 || item.state === 5 || item.state === 2) {
        item.state = 2
        item.allData.push(...item.whileRequests)
        item.whileRequests.length = 0
      }
      if (item.state !== 2) {
        arr.splice(i, 1)
        i--
      }
    }
    uploadingArr = arr
    console.log(uploadingArr, 'uploadingArr')
  }

  // 存储任务到缓存
  const setTaskArr = async () => {
    // localForage这个库的api不兼容Proxy对象和函数,要处理一下
    const needTaskArr = JSON.parse(JSON.stringify(taskArr.value))
    await localForage.setItem('taskArr', needTaskArr)
    // console.log('存储成功')
  }

  // 消息提示
  const message = (msg, duration = 3000) => {
    const messageList = document.querySelector('.messageList')
    messageList.innerHTML = ''
    const div = document.createElement('div')
    div.className = 'messageBac'
    div.innerHTML = `<div class="message">
                          <p>${msg}</p>
                      </div>`
    messageList.appendChild(div)
    setTimeout(() => {
      div.classList.toggle('messageShow')
      setTimeout(() => {
        div.classList.toggle('messageShow')
      }, duration)
    }, 0)
  }

  // 格式化时间显示
  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0秒'

    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}小时${minutes}分钟${seconds}秒`
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`
    } else {
      return `${seconds}秒`
    }
  }

  // 格式化完成时间显示
  const formatFinishTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
</script>

<style scoped>
  .page {
    margin: 0 auto;
    width: 100%;

    position: relative;
    padding: 20px;
    box-sizing: border-box;
  }

  .page_top {
    height: 80px;
    padding: 0 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .page-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  .statistics {
    background: rgba(64, 158, 255, 0.2);
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
  }

  .page_top_right {
    width: auto;
    display: flex;
    gap: 12px;
  }

  .action-btn {
    border-radius: 20px;
  }

  .content {
    max-width: 1000px;
    margin: 0 auto;
    overflow-y: auto;
    min-height: calc(100vh - 320px);
    max-height: calc(100vh - 320px);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 20px;
    box-sizing: border-box;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;

  }

  .empty-state p {
    margin-top: 16px;
    font-size: 18px;
  }

  .bottom_box {
    text-align: center;
    position: absolute;
    bottom: 20px;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .upload-demo :deep(.el-upload) {
    width: auto;
  }

  :deep(.messageBac) {
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    transition: all .3s;
    transform: translateY(-34px);
    opacity: 0;
    z-index: 2000;
  }

  :deep(.messageShow) {
    transform: translateY(20px);
    opacity: 1;
  }

  :deep(.message) {
    background-color: #ffffff;
    color: #606266;
    border-radius: 8px;
    padding: 12px 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-weight: 500;
  }

  /* 滚动条美化 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
</style>