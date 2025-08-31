import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { AxiosCanceler } from './axiosConfig.js';
import { formatParams } from './tools';
import useUserStore from '@/store/modules/user';

const isPro = import.meta.env.NODE_ENV === 'production';


// const devBaseUrl = 'http://localhost:3004'; // 确保端口是 3004
// const proBaseUrl = import.meta.env.API_DOMAIN;
// const baseURL = isPro ? proBaseUrl : devBaseUrl;
// 使用 Vite 环境变量
const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3004' : '');

console.log('API Base URL:', baseURL);
console.log('Environment:', import.meta.env.MODE);

console.log('baseURL',baseURL);

const config = {
  timeout: 60000, // 超时时间
  withCredentials: true,
  baseURL: baseURL // 设置基础URL
};


// 创建 axios 实例
const service = axios.create(config)


const axiosCanceler = new AxiosCanceler();

class RequestHttp {
  service;

  constructor(config) {
    this.service = axios.create(config);

    // 请求拦截器
    this.service.interceptors.request.use(
      (config) => {
        axiosCanceler.addPending(config);
        
        // 动态获取token，确保每次请求都是最新的
        const token = localStorage.getItem('token');
        
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: token ? `Bearer ${token}` : '',
          },
        };
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.service.interceptors.response.use(
      (response) => {
        const { data, config } = response;
        axiosCanceler.removePending(config);
        
        // 统一处理401错误
        if (data.code === 401) {
          this.handleUnauthorized();
          return Promise.reject(data);
        }

        if (config.responseType === 'arraybuffer') {
          return response
        }

      // 文件下载处理
      // if (config?.responseType === 'blob') {
      //   const filename = response.headers['content-disposition']?.split(';')[1].split('=')[1] || '';
      //   console.log('data',data);
      //   return {
      //     data: data,
      //     filename,
      //     type: response.headers['content-type'],
      //   };
      // }
        
        return data;
      },
      (error) => {
        const { response } = error;
        
        if (response) {
          switch (response.status) {
            case 400:
            case 403:
            case 409:
              return Promise.resolve(response.data);
            case 401:
              this.handleUnauthorized();
              return Promise.reject(error);
            case 404:
              ElMessage.error('请求的资源不存在');
              break;
            case 500:
              ElMessage.error('服务器内部错误');
              break;
            default:
              ElMessage.error(`请求错误: ${response.status}`);
          }
        } else if (error.message.includes('timeout')) {
          ElMessage.error('请求超时，请稍后再试');
        } else if (!window.navigator.onLine) {
          ElMessage.error('网络连接已断开');
        } else {
          ElMessage.error('网络错误，请检查网络连接');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // 统一处理未授权错误
  handleUnauthorized() {
    // 使用Element Plus的消息提示组件，避免重复弹窗
    ElMessageBox.confirm(
      '登录状态已过期，您可以继续留在该页面，或者重新登录',
      '系统提示',
      {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      const userStore = useUserStore();
      userStore.logOut().then(() => {
        window.location.href = '/login';
      });
    }).catch(() => {
      // 用户取消操作
    });
  }

  // GET请求
  get(url, params, _obj = {}) {
    let config = { ..._obj };
    // 检查是否需要使用 application/json 方式传参
    // if (config.headers && config.headers['Content-Type'] === 'application/json' && params) {
    //   // 使用 application/json 方式传参
    //   return this.service.get(url, {
    //     ...config,
    //     data: params, // 将参数放在请求体中
    //     headers: {
    //       ...config.headers,
    //       'Content-Type': 'application/json'
    //     }
    //   });
    // } else {
    //   // 传统的 URL 查询参数方式
    //   if (params) {
    //     // 处理URL参数
    //     const queryString = formatParams(params);
    //     const separator = url.includes('?') ? '&' : '?';
    //     url = queryString ? `${url}${separator}${queryString}` : url;
    //   }
      
    //   return this.service.get(url, config);
    // }
    if (params) {
      // 处理URL参数
      const queryString = formatParams(params);
      const separator = url.includes('?') ? '&' : '?';
      url = queryString ? `${url}${separator}${queryString}` : url;
    }
    
    return this.service.get(url, config);
  }

  // POST请求
  post(url, params, _obj = {}) {
    // 检查是否为文件上传请求
     // 检查是否为 ArrayBuffer 或 Blob 类型的二进制数据
    if (params instanceof ArrayBuffer || params instanceof Blob  ) {

      // 二进制数据上传
      return this.service.post(url, params, {
        headers: {
          'Content-Type': 'application/octet-stream',
          ..._obj.headers,
        },
        ..._obj,
      });
    } else if (params instanceof FormData) {
      return this.service.post(url, params, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ..._obj.headers,
        },
        ..._obj,
      });
    } else {
      // 普通 POST 请求
      const data = _obj.isArray ? params : { ...params, ..._obj };
      return this.service.post(url, data);
    }
  }

  // PUT请求
  put(url, params, _obj = {}) {
    const data = _obj.isArray ? params : { ...params, ..._obj };
    return this.service.put(url, data);
  }

  // DELETE请求
  delete(url, params, _obj = {}) {
    return this.service.delete(url, { 
      params, 
      ..._obj 
    });
  }
}

export { service };

export default new RequestHttp(config);

