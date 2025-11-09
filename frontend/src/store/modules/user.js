import {defineStore} from 'pinia';
import { ElMessageBox,ElMessage } from 'element-plus'
import { userLogin, 
  logout, 
  getUserInfo 
} from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'

const useUserStore = defineStore(
  'user',
  {
    state: () => ({
      userInfo:{
        token: getToken(),
        id: '',
        name: '',
        email: '',
        created_at: '',
        last_login: '',
        login_ip: '',
      }
    }),
    actions: {
      // 登录
      login(userInfo) {
        console.log('userInfo', userInfo);
        const username = userInfo.username.trim()
        const password = userInfo.password

        return new Promise((resolve, reject) => {
          userLogin({username, password}).then(res => {
            const {code, data={},message} = res;
            if (code !== 200) {
              ElMessage({
                message: message || '登录失败',
                type: 'warning',
                duration: 1500,
              })
              return reject(new Error(message || 'Error'))
            }
            setToken(res.data.token)
            this.token = res.data.token
            resolve()
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 获取用户信息
      getInfo() {
        return new Promise((resolve, reject) => {
          getUserInfo().then(res => {
            const user = res.data
            // this.id = user.id
            // this.name = user.username
            // this.email = user.email
            // this.avatar = user.avatar
            // this.created_at = user.created_at
            // this.last_login = user.last_login
            // this.login_ip = user.login_ip
            this.userInfo = { ...this.userInfo, ...user }
          
            resolve(res.data)
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 退出系统
      logOut() {
        return new Promise((resolve, reject) => {
          logout(this.token).then(() => {
            this.token = ''

            removeToken()
            resolve()
          }).catch(error => {
            reject(error)
          })
        })
      },
      setUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
    },
    }
  })

export default useUserStore