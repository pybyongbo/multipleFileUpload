import http from '@/utils/request'

// 用户注册
export const addUser = params => {
  return http.post("/register", params);
};


// 用户登录
export const userLogin = params => {
  return http.post("/login", params);
};

export const logout = params => {
  return http.post("/logout", params);
};


export const getUserInfo = () => {
  return http.get('/getUserInfo');
}

// 更新用户邮箱信息
export const updateUserEmail = params => {
  return http.post('/updateEmail', params);
}

// 更新用户上传头像

export const uploadAvatar = params => {
  console.log('params',params);
  return http.post('/uploadAvatar', params,{
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 更新用户基本信息
export const updateUserInfo = params => {
  return http.post('/updateUserInfo', params);
}

// 更新用户密码 updateUserPassword
export const updateUserPassword = params => {
  return http.post('/updatePassword', params);
}

// 获取所有用户列表

export const getUserList = params => {
  return http.get('/getUserList', params);
}