const { query } = require('./mysql.js');

// 将上传的文件信息写入数据库
exports.insertUploadInfo = (value) => {
  let {
    originalName: original_name,
    fileName: file_name,
    filePath: file_path,
    fileSize: file_size,
    mimeType: mime_type,
    fileExtension: file_extension,
    uploadTime: upload_time,
    uploaderId: uploader_id,
    uploaderIp: uploader_ip,
    isWatermarked: is_watermarked,
    status,
    description,
  } = value[0];
  let _sql = `insert into files 
  (original_name,file_name, file_path, file_size,mime_type,file_extension,upload_time,uploader_id,uploader_ip,is_watermarked,status,description) 
  values (?, ?, ?, ?, ? ,? ,? ,? ,? ,? ,? ,?)
  `;
  return query(_sql, [
    original_name,
    file_name,
    file_path,
    file_size,
    mime_type,
    file_extension,
    upload_time,
    uploader_id,
    uploader_ip,
    is_watermarked,
    status,
    description,
  ]);
};


exports.getUploadFileCount = (userId) => {
  
  let _sql = `SELECT COUNT(*) as count FROM files WHERE uploader_id = '${userId}' AND status != 'deleted'`;
  return query(_sql);
}

exports.getDeleteFileCount = (userId) => { 
  let _sql = `SELECT COUNT(*) as count FROM files WHERE uploader_id = '${userId}' AND status = 'deleted'`;
  return query(_sql);
};


// 删除文件接口 (更改文件状态为 'deleted')
exports.deleteFile = (userId,filepath) => {
  console.log('value6699',filepath);
  let _sql = `UPDATE files  SET status = 'deleted' , delete_time=NOW() WHERE file_path = '${filepath}' AND uploader_id = '${userId}'`;
  return query(_sql);
}


// 查询当前用户上传的文件
exports.getFileListByUserId = (userId, conditions = {}) => {

   // 基础查询语句
  let baseSql = `SELECT * FROM files WHERE uploader_id = ? AND status != 'deleted'`;
  let params = [userId];
  
  // let _sql = `SELECT * FROM files WHERE uploader_id = ${userId} AND status != 'deleted' order by upload_time DESC limit ${(page -
  //   1) *
  //   10},10;`;
  // return query(_sql);

  // 添加文件名搜索条件
  if (conditions.fileName) {
    baseSql += ` AND original_name LIKE ?`;
    params.push(`%${conditions.fileName}%`);
  }
  
  // 添加文件类型搜索条件
  if (conditions.fileType) {
    // 如果是分类搜索（如 image, video 等）
    if (['image', 'video', 'audio', 'document', 'archive'].includes(conditions.fileType)) {
      switch (conditions.fileType) {
        case 'image':
          baseSql += ` AND mime_type LIKE 'image/%'`;
          break;
        case 'video':
          baseSql += ` AND mime_type LIKE 'video/%'`;
          break;
        case 'audio':
          baseSql += ` AND mime_type LIKE 'audio/%'`;
          break;
        case 'document':
          baseSql += ` AND (mime_type LIKE 'application/%document%' 
                          OR mime_type LIKE 'application/%officedocument%' 
                          OR mime_type = 'application/pdf'
                          OR mime_type = 'application/msword'
                          OR mime_type = 'text/plain')`;
          break;
        case 'archive':
          baseSql += ` AND (mime_type LIKE '%zip%' 
                          OR mime_type LIKE '%rar%' 
                          OR mime_type LIKE '%7z%' 
                          OR mime_type LIKE '%tar%' 
                          OR mime_type LIKE '%gz%')`;
          break;
      }
    } else {
      // 如果是具体的 MIME 类型
      baseSql += ` AND mime_type = ?`;
      params.push(conditions.fileType);
    }
  }
  
  // 添加上传时间范围搜索条件
  if (conditions.startTime && conditions.endTime) {
    baseSql += ` AND upload_time BETWEEN ? AND ?`;
    params.push(conditions.startTime, conditions.endTime);
  } else if (conditions.startTime) {
    baseSql += ` AND upload_time >= ?`;
    params.push(conditions.startTime);
  } else if (conditions.endTime) {
    baseSql += ` AND upload_time <= ?`;
    params.push(conditions.endTime);
  }
  
  // 添加排序和分页
  baseSql += ` ORDER BY upload_time DESC LIMIT ?, ?`;
  params.push((conditions.page - 1) * 10, conditions.limit);
  
  return query(baseSql, params);
}

// 查询用户上传的文件状态为 'active'的总数 

exports.getFileActiveCountByUserId = (userId,conditions = {}) => {
  // let _sql = `SELECT count(*) as count FROM files WHERE uploader_id = ${userId} AND status != 'deleted'`;
  // return query(_sql);

  let baseSql = `SELECT count(*) as count FROM files WHERE uploader_id = ? AND status != 'deleted'`;
  let params = [userId];
  
  // 添加文件名搜索条件
  if (conditions.fileName) {
    baseSql += ` AND original_name LIKE ?`;
    params.push(`%${conditions.fileName}%`);
  }
  
  // 添加文件类型搜索条件
  if (conditions.fileType) {
    // 如果是分类搜索（如 image, video 等）
    if (['image', 'video', 'audio', 'document', 'archive'].includes(conditions.fileType)) {
      switch (conditions.fileType) {
        case 'image':
          baseSql += ` AND mime_type LIKE 'image/%'`;
          break;
        case 'video':
          baseSql += ` AND mime_type LIKE 'video/%'`;
          break;
        case 'audio':
          baseSql += ` AND mime_type LIKE 'audio/%'`;
          break;
        case 'document':
          baseSql += ` AND (mime_type LIKE 'application/%document%' 
                          OR mime_type LIKE 'application/%officedocument%' 
                          OR mime_type = 'application/pdf'
                          OR mime_type = 'application/msword'
                          OR mime_type = 'text/plain')`;
          break;
        case 'archive':
          baseSql += ` AND (mime_type LIKE '%zip%' 
                          OR mime_type LIKE '%rar%' 
                          OR mime_type LIKE '%7z%' 
                          OR mime_type LIKE '%tar%' 
                          OR mime_type LIKE '%gz%')`;
          break;
      }
    } else {
      // 如果是具体的 MIME 类型
      baseSql += ` AND mime_type = ?`;
      params.push(conditions.fileType);
    }
  }
  
  // 添加删除时间范围搜索条件
  if (conditions.startTime && conditions.endTime) {
    baseSql += ` AND upload_time BETWEEN ? AND ?`;
    params.push(conditions.startTime, conditions.endTime);
  } else if (conditions.startTime) {
    baseSql += ` AND upload_time >= ?`;
    params.push(conditions.startTime);
  } else if (conditions.endTime) {
    baseSql += ` AND upload_time <= ?`;
    params.push(conditions.endTime);
  }
  console.log('baseSql',baseSql);
  return query(baseSql, params);
}


// 查询用户上传的文件状态为 'deleted'的文件列表
exports.getFileListDeletedByUserId = (userId, conditions = {}) => {
  // let _sql = `SELECT * FROM files WHERE uploader_id = ${userId} AND status = 'deleted' order by delete_time DESC limit ${(page -
  //   1) *
  //   10},10;`;
  // return query(_sql);


  let baseSql = `SELECT * FROM files WHERE uploader_id = ? AND status = 'deleted'`;
  let params = [userId];
  
  // 添加文件名搜索条件
  if (conditions.fileName) {
    baseSql += ` AND original_name LIKE ?`;
    params.push(`%${conditions.fileName}%`);
  }
  
  // 添加文件类型搜索条件
  if (conditions.fileType) {
    // 如果是分类搜索（如 image, video 等）
    if (['image', 'video', 'audio', 'document', 'archive'].includes(conditions.fileType)) {
      switch (conditions.fileType) {
        case 'image':
          baseSql += ` AND mime_type LIKE 'image/%'`;
          break;
        case 'video':
          baseSql += ` AND mime_type LIKE 'video/%'`;
          break;
        case 'audio':
          baseSql += ` AND mime_type LIKE 'audio/%'`;
          break;
        case 'document':
          baseSql += ` AND (mime_type LIKE 'application/%document%' 
                          OR mime_type LIKE 'application/%officedocument%' 
                          OR mime_type = 'application/pdf'
                          OR mime_type = 'application/msword'
                          OR mime_type = 'text/plain')`;
          break;
        case 'archive':
          baseSql += ` AND (mime_type LIKE '%zip%' 
                          OR mime_type LIKE '%rar%' 
                          OR mime_type LIKE '%7z%' 
                          OR mime_type LIKE '%tar%' 
                          OR mime_type LIKE '%gz%')`;
          break;
      }
    } else {
      // 如果是具体的 MIME 类型
      baseSql += ` AND mime_type = ?`;
      params.push(conditions.fileType);
    }
  }
  
  // 添加删除时间范围搜索条件
  if (conditions.startTime && conditions.endTime) {
    baseSql += ` AND delete_time BETWEEN ? AND ?`;
    params.push(conditions.startTime, conditions.endTime);
  } else if (conditions.startTime) {
    baseSql += ` AND delete_time >= ?`;
    params.push(conditions.startTime);
  } else if (conditions.endTime) {
    baseSql += ` AND delete_time <= ?`;
    params.push(conditions.endTime);
  }

   // 添加排序和分页
  baseSql += ` ORDER BY delete_time DESC LIMIT ?, ?`;
  params.push((conditions.page - 1) * 10, 10);

  return query(baseSql, params);

}

// 查询用户上传的文件状态为 'deleted'的总数 
exports.getFileDeletedCountByUserId = (userId,conditions = {}) => {
  // let _sql = `SELECT count(*) as count FROM files WHERE uploader_id = ${userId} AND status = 'deleted'`;
  // return query(_sql);
  
  // 基础查询语句
  let baseSql = `SELECT count(*) as count FROM files WHERE uploader_id = ? AND status = 'deleted'`;
  let params = [userId];

  // 添加文件名搜索条件
  if (conditions.fileName) {
    baseSql += ` AND original_name LIKE ?`;
    params.push(`%${conditions.fileName}%`);
  }
  
  // 添加文件类型搜索条件
  if (conditions.fileType) {
    // 如果是分类搜索（如 image, video 等）
    if (['image', 'video', 'audio', 'document', 'archive'].includes(conditions.fileType)) {
      switch (conditions.fileType) {
        case 'image':
          baseSql += ` AND mime_type LIKE 'image/%'`;
          break;
        case 'video':
          baseSql += ` AND mime_type LIKE 'video/%'`;
          break;
        case 'audio':
          baseSql += ` AND mime_type LIKE 'audio/%'`;
          break;
        case 'document':
          baseSql += ` AND (mime_type LIKE 'application/%document%' 
                          OR mime_type LIKE 'application/%officedocument%' 
                          OR mime_type = 'application/pdf'
                          OR mime_type = 'application/msword'
                          OR mime_type = 'text/plain')`;
          break;
        case 'archive':
          baseSql += ` AND (mime_type LIKE '%zip%' 
                          OR mime_type LIKE '%rar%' 
                          OR mime_type LIKE '%7z%' 
                          OR mime_type LIKE '%tar%' 
                          OR mime_type LIKE '%gz%')`;
          break;
      }
    } else {
      // 如果是具体的 MIME 类型
      baseSql += ` AND mime_type = ?`;
      params.push(conditions.fileType);
    }
  }
  
  // 添加删除时间范围搜索条件
  if (conditions.startTime && conditions.endTime) {
    baseSql += ` AND delete_time BETWEEN ? AND ?`;
    params.push(conditions.startTime, conditions.endTime);
  } else if (conditions.startTime) {
    baseSql += ` AND delete_time >= ?`;
    params.push(conditions.startTime);
  } else if (conditions.endTime) {
    baseSql += ` AND delete_time <= ?`;
    params.push(conditions.endTime);
  }
  console.log('baseSqltotal',baseSql);
  return query(baseSql, params);
}


// 批量删除操作 (支持单个文件和多个文件)

exports.batchDeleteFiles = ({ids}) => {

// 真实删除
// let _sql = `DELETE FROM files WHERE id IN (${ids})`;   

 if (!ids || ids.length === 0) {
    return Promise.resolve({ affectedRows: 0 });
  }
  
  // 创建与 ids 数量相等的占位符
  const placeholders = ids.map(() => '?').join(',');
  let _sql = `UPDATE files SET status = 'deleted', delete_time = NOW() WHERE id IN (${placeholders})`;
  return query(_sql, ids);
}

// 还原文件

exports.restoreFile  = async (fileId) => { 

   if (!fileId ) {
    return Promise.resolve({ affectedRows: 0 });
  }

  let _sql = `UPDATE files SET status = 'pending' WHERE id = ${fileId}`;
  return query(_sql);
}


exports.getFileListPicTop5 = async (userId) => { 

  let _sql = `SELECT * FROM files WHERE uploader_id = ${userId} AND status != 'deleted' AND mime_type IN (
                'image/jpeg', 
                'image/jpg', 
                'image/png', 
                'image/gif', 
                'image/webp', 
                'image/svg+xml', 
                'image/bmp', 
                'image/tiff', 
                'image/x-icon', 
                'image/heic', 
                'image/heif'
              ) order by upload_time DESC limit 5`;
  return query(_sql);

}


exports.getOtherFileListPicTop5 = async (userId) => { 

  let _sql = `SELECT * FROM files 
              WHERE uploader_id = ${userId} 
              AND status != 'deleted' 
              AND mime_type NOT IN (
                'image/jpeg', 
                'image/jpg', 
                'image/png', 
                'image/gif', 
                'image/webp', 
                'image/svg+xml', 
                'image/bmp', 
                'image/tiff', 
                'image/x-icon', 
                'image/heic', 
                'image/heif'
              )
              ORDER BY upload_time DESC 
              LIMIT 5`;
    return query(_sql);
}


// 彻底删除文件
exports.completeDeleteFile = async (userId,filepath) => {
  return query(`DELETE FROM files WHERE uploader_id = ${userId} AND file_path = '${filepath}'`);
}


exports.queryFileType = async () => {
  let _sql = `SELECT DISTINCT(mime_type) FROM files`;
  return query(_sql);
}


// 根据文件ID获取文件信息
exports.getFileById = (fileId) => {
  let _sql = `SELECT * FROM files WHERE id = ? AND status != 'deleted'`;
  return query(_sql, [fileId]);
};

// 更新文件描述内容

exports.updateFileDescription = (fileId, description) => {
  let _sql = `UPDATE files SET description = ? WHERE id = ?`;
  return query(_sql, [description, fileId]);
};