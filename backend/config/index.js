const config = {
  // 数据库配置
  database: {
    DATABASE: "studentlist",
    // DATABASE: 'nodejstest',
    USERNAME: 'root',
    PASSWORD: "123456",
    // PASSWORD: 'root',
    PORT: '3306',
    HOST: 'localhost',
  },

  jwt: {
    secret: 'vue3-koa2-multiple-fileupload', // 实际项目中应该使用更复杂的密钥
    expiresIn: '30m', // token 过期时间
  },
};

module.exports = config;
