import {
  createRouter,
  createWebHistory,
} from 'vue-router';
import Layout from '@/views/layout.vue'
import UploadFile from '@/views/uploadFile.vue';
import UploadfileBase64 from '@/views/uploadfileBase64.vue';
import UploadfileBinary from '@/views/uploadfileBinary.vue';

import Login from '@/views/login.vue';
import Register from '@/views/register.vue';
import FileList from '../src/views/fileList.vue';

// 大文件分片上传
import UploadfileChunk from '@/views/uploadfileChunk.vue';

// 大文件分片上传
import DownloadFileList from '@/views/downloadlist.vue';

// 个人中心
import UserCenter from '@/views/userCenter.vue';

// 用户列表
import UserList from '@/views/userList.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { hiddenInMenu: true }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { hiddenInMenu: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/uploadfile',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/uploadfile',
        name: 'uploadfile',
        component: UploadFile,
        meta: { 
          title: '文件上传',
          requiresAuth: true 
        }
      },
      {
        path: '/uploadfileBase64',
        name: 'uploadfileBase64',
        component: UploadfileBase64,
        meta: { 
          title: '文件上传',
          requiresAuth: true 
        }
      },
       {
        path: '/uploadfileBinary',
        name: 'uploadfileBinary',
        component: UploadfileBinary,
        meta: { 
          title: '文件上传',
          requiresAuth: true 
        }
      },
       {
        path: '/uploadfileChunk',
        name: 'uploadfileChunk',
        component: UploadfileChunk,
        meta: { 
          title: '大文件分片上传',
          requiresAuth: true 
        }
      },

      {
        path: '/downloadList',
        name: 'downloadlist',
        component: DownloadFileList,
        meta: { 
          title: '接口下载文件',
          requiresAuth: true 
        }
      },
      {
        path: '/fileList',
        name: 'fileList',
        component: FileList,
        meta: { 
          title: '文件列表',
          requiresAuth: true 
        }
      },
      {
        path: '/userCenter',
        name: 'userCenter',
        component: UserCenter,
        meta: { 
          title: '个人中心',
          requiresAuth: true 
        }
      },
      {
        path: '/userList',
        name: 'userList',
        component: UserList,
        meta: { 
          title: '用户列表',
          requiresAuth: true 
        }
      }
    ]
  },

  
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});


// 添加路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('token');
  // 如果访问根路径 "/"
  if (to.path === '/') {
    if (isLoggedIn) {
      // 已登录，跳转到上传页面
      next('/uploadfile');
    } else {
      // 未登录，跳转到登录页面
      next('/login');
    }
    return;
  }

  // 检查要访问的路由是否需要认证
  if (to.meta.requiresAuth) {
    // 检查用户是否已登录（这里使用 localStorage 作为示例）

    console.log(555,!isLoggedIn);
    
    if (!isLoggedIn) {
      // 如果未登录，重定向到登录页面
      next({
        name: 'login',
        query: { redirect: to.full_path } // 保存用户想要访问的页面路径
      });
    } else {
      // 如果已登录，允许访问
      // next();
      // 如果用户已登录并且要访问登录页面，则重定向到列表页面
      //  console.log('to.path',to.path);
      //  console.log('12313',isLoggedIn && to.path === '/login');
      if (isLoggedIn && to.path === '/login') {
        next('/uploadfile');
      } else {
        next();
      }
    }
  } else {
    // 不需要认证的路由，直接访问
    // next();
     if (isLoggedIn && to.path === '/login') {
        next('/uploadfile');
      } else {
        next();
      }
  }
});

export default router;
