import {defineStore} from 'pinia';
import { ElMessageBox,ElMessage } from 'element-plus'
import { 
 getFileTypeList,
 getFileTotalCount
} from '@/api/uploadfile.js'

const useFileStore = defineStore(
  'file',
  {
    state: () => ({
      mimetype: '',
      uploadCount: 0, // 上传文件数量
      deleteCount: 0, // 删除文件数量
    }),
    actions: {
      // 获取文件类型下拉列表
      getFileTypeList() {
        return new Promise((resolve, reject) => {
          getFileTypeList().then(res => {
            const {code, data={},message} = res;
            if (code !== 200) {
              ElMessage({
                message: message || '查询失败',
                type: 'warning',
                duration: 1500,
              })
              return reject(new Error(message || 'Error'))
            }
            this.mimetype = res.data
            resolve()
          }).catch(error => {
            reject(error)
          })
        })
      },

      getTotalCount() {
        return new Promise((resolve, reject) => {
          getFileTotalCount().then(res => { 
            const { code, message, data } = res;
            this.uploadCount = data.uploadFileCount;
            this.deleteCount = data.deletedFileCount;
          }).catch(error => {
            reject(error)
          })
        })
      }
     
    }
  })

export default useFileStore