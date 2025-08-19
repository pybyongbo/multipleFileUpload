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


// 删除文件接口 (更改文件状态为 'deleted')
exports.deleteFile = (userId,filepath) => {
  console.log('value6699',filepath);
  let _sql = `UPDATE files  SET status = 'deleted' , delete_time=NOW() WHERE file_path = '${filepath}' AND uploader_id = '${userId}'`;
  return query(_sql);
}


// 查询当前用户上传的文件
exports.getFileListByUserId = (userId, page) => {
  let _sql = `SELECT * FROM files WHERE uploader_id = ${userId} AND status != 'deleted' order by upload_time DESC limit ${(page -
    1) *
    10},10;`;
  return query(_sql);
}

// 查询用户上传的文件状态为 'active'的总数 

exports.getFileActiveCountByUserId = (userId) => {
  let _sql = `SELECT count(*) as count FROM files WHERE uploader_id = ${userId} AND status != 'deleted'`;
  return query(_sql);
}


// 查询用户上传的文件状态为 'deleted'的文件列表
exports.getFileListDeletedByUserId = (userId, page) => {
  let _sql = `SELECT * FROM files WHERE uploader_id = ${userId} AND status = 'deleted' order by delete_time DESC limit ${(page -
    1) *
    10},10;`;
  return query(_sql);
}

// 查询用户上传的文件状态为 'deleted'的总数 
exports.getFileDeletedCountByUserId = (userId) => {
  let _sql = `SELECT count(*) as count FROM files WHERE uploader_id = ${userId} AND status = 'deleted'`;
  return query(_sql);
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
    console.log('_sql888',_sql);
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
    console.log('_sql999',_sql);
  return query(_sql);

}