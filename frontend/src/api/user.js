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