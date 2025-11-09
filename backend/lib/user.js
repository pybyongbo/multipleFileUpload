
const { query } = require('./mysql.js');

// 注册用户
exports.registerUser = (value) => {
  console.log('value',value);
  let [username,email, password, created_at,updated_at,last_login,is_active ] = value;
  let _sql = `insert into users 
  (username, email, password, created_at,updated_at,last_login,is_active) 
  values (?, ?, ?, ?, ?,?,?)
  `;
  return query(_sql, [username,email, password, created_at,updated_at,last_login,is_active]);

  //  let _sql =
  //   "insert into users set username=?,email=?,password=?,created_at=?,updated_at=?,last_login=?,is_active=?;";
  // console.log(_sql);
  // return query(_sql, value);
}


// 查询用户(登录)
exports.findDataByName = (name) => {
  console.log('value666',name);
  let _sql = `select * from users where username = "${name}"`;
  console.log('_sql',_sql);
  return query(_sql, name);
}



// 根据用户ID查找用户
exports.findUserById = (id) => {
  let _sql = `SELECT * FROM users WHERE id = ?`;
  return query(_sql, [id]);
};

// 更新用户最后登录时间
exports.updateUserLastLogin = (id, lastLoginTime) => {
  let _sql = `UPDATE users SET last_login = ? WHERE id = ?`;
  return query(_sql, [lastLoginTime, id]);
};

// 更新最新登录IP
exports.updateUserLastLoginIp = (id, lastIp) => {
  let _sql = `UPDATE users SET login_ip = ? WHERE id = ?`;
  return query(_sql, [lastIp, id]);
}

// 更新用户邮箱信息
exports.updateUserEmail = (id, email) => {
  let _sql = `UPDATE users SET email = ? WHERE id = ?`;
  return query(_sql, [email, id]);
}

// 用户上传头像
exports.updateUserAvatar = (id, avatar) => {
  let _sql = `UPDATE users SET avatar = ? WHERE id = ?`;
  return query(_sql, [avatar, id]);
}

// 更新用户信息
exports.updateUserInfo = (id, nickname, phonenumber, gender) => {

  // userId, username, nickname, phonenumber, gender
  let _sql = `UPDATE users SET nickname = ?, phonenumber = ?, gender = ? WHERE id = ?`;
  console.log('_sql',_sql);
  return query(_sql, [nickname, phonenumber, gender, id]);
}