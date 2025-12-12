
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
exports.updateUserInfo = (id, nickname, phonenumber,email, gender) => {

  // userId, username, nickname, phonenumber, gender
  let _sql = `UPDATE users SET nickname = ?, phonenumber = ?, email=?, gender = ? WHERE id = ?`;
  console.log('_sql',_sql);
  return query(_sql, [nickname, phonenumber,email, gender, id]);
}

// 更新用户密码
exports.updateUserPassword = (id, password) => {
  let _sql = `UPDATE users SET password = ? WHERE id = ?`;
  return query(_sql, [password, id]);
}


// 查询用户总数用于分页信息
exports.getUserCount = () => {
  let _sql = `select count(*) as totalCount from users`;
  return query(_sql);
}


// 查询用户列表  (链接查询获取用户上传文件数量)
exports.getUserList = ({page=1, pageSize=10}) => {
  // let _sql = `select * from users limit ${page},${pageSize}`;
  // 这个是链接查询获取上传文件总数
  // let _sql = `SELECT u.*,COUNT(f.id) AS file_count
  //   FROM users as u
  //   LEFT JOIN files as f ON u.id = f.uploader_id
  //   GROUP BY u.id, u.username, u.email
  //   ORDER BY file_count DESC, u.id ASC limit ${page-1},${pageSize}`;

  console.log('page,pageSize',page,pageSize);
// 计算偏移量
  const offset = (page - 1) * pageSize;
  let _sql = `SELECT 
        u.*,
        (SELECT COUNT(*) FROM files f WHERE f.uploader_id = u.id AND f.mime_type LIKE 'image/%') AS image_count,
        (SELECT COUNT(*) FROM files f WHERE f.uploader_id = u.id AND f.mime_type IN (
          'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json'
        )) AS document_count,
        (SELECT COUNT(*) FROM files f WHERE f.uploader_id = u.id AND 
          f.mime_type NOT LIKE 'image/%' AND 
          f.mime_type NOT IN (
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json'
          )
        ) AS other_count,
        (SELECT COUNT(*) FROM files f WHERE f.uploader_id = u.id) AS total_file_count
      FROM users u
      ORDER BY total_file_count DESC, u.id ASC LIMIT ${offset}, ${pageSize}`;

  return query(_sql);
}