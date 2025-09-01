// const multer = require('koa-multer');
const path = require('path');
const fs = require('fs');
const fileModel = require('../lib/uploadFile.js');

const uploadDir = path.join(__dirname, '../public/uploads');
/**
 * 返回值
 * @param code 返回码
 * @param msg	返回信息
 * @param data 返回数据
 * @return
 */
var resObj = (code,data,msg,) => {
  return {
    code: code,
    data: data,
    msg: msg,
  };
};

// 确保目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const name = path.basename(file.originalname, ext);
//     const uniqueName = `${name}-${Date.now()}${ext}`;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });



exports.uploadFile = async (ctx) => {
  try {
    // --- 3. 从 ctx.request.files 中获取上传的文件 ---
    // 假设前端 FormData 中使用的 key 是 'file'
    // 例如: formData.append('file', fileObject);
    const file = ctx.request.files.file;

    const processedFiles = [];

    // 如果没有获取到文件，返回错误信息
    if (!file) {
      ctx.status = 400; // Bad Request
      ctx.body = resObj(400, {}, '请上传文件！');

      return;
    }

    const dateFolderPath = uploadDir;

    // 检查日期文件夹是否存在，不存在则创建
    if (!fs.existsSync(dateFolderPath)) {
      fs.mkdirSync(dateFolderPath, { recursive: true });
    }
    // b. 生成时间戳
    const timestamp = Date.now();

    // c. 生成新的文件名
    const newFilename = `${timestamp}-${file.originalFilename}`;

    // 定义新的文件路径
    const newFilePath = path.join(dateFolderPath, newFilename);

    // 使用 fs.renameSync (同步) 或 fs.promises.rename (异步) 移动文件
    // 这里使用异步方式，避免阻塞事件循环
    await fs.promises.rename(file.filepath, newFilePath);

    processedFiles.push({
      originalName: file.originalFilename,
      fileName: newFilename,
      filePath: `/uploads/${newFilename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileExtension: path.extname(newFilename),
      uploadTime: new Date(),
      uploaderId: ctx.state.user.id, // 假设 ctx.state.user.id 是当前用户的 ID
      uploaderIp: ctx.request.ip,
      isWatermarked: 1,
      status: 'active',
      description: '',
      path: `${ctx.request.protocol}://${ctx.request.host}/uploads/${newFilename}`,
      url: `/uploads/${newFilename}`,
      full_path: `${ctx.request.protocol}://${ctx.request.host}/uploads/${newFilename}`,
    });

    // 文件信息入库
    await fileModel.insertUploadInfo(processedFiles); // 假设 ctx.state.user.id 是当前用户的 ID

    // --- 5. 向客户端返回成功响应 ---

   ctx.body= resObj(200, processedFiles[0], '文件上传成功！');

    // ctx.body = {
    //   success: true,
    //   code: 200,
    //   message: '文件上传成功！',
    //   files: processedFiles,
    // };
  } catch (error) {
    // --- 6. 错误处理 ---
    console.error('文件上传失败:', error);
    ctx.status = 500; // Internal Server Error
    ctx.body = resObj(500, {}, '服务器内部错误，文件上传失败。');
    // ctx.body = {
    //   code: -1,
    //   message: '服务器内部错误，文件上传失败。',
    //   error: error.message, // 在开发环境中可以返回具体错误
    // };
  }
};

exports.deleteFile = async (ctx) => {
  const { filename } = ctx.request.body;
  const userId = ctx.state.user.id; // 获取当前用户ID
  if (!filename) {
    ctx.body = resObj(500, {}, '文件ID不能为空');
    // ctx.body = { success: false, msg: '文件ID不能为空' };
    return;
  }

  try {
    // const filePath = path.join(__dirname, `../public/${filename}`);
    await fileModel.deleteFile(userId, filename);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);  // 删除文件
    // }
    ctx.body = { success: true };
  } catch (err) {
    console.log('error', err);
    ctx.body = resObj(500, {}, '删除失败');
    // ctx.body = { success: false, msg: '删除失败' };
  }
};


// 查询当前用户上传文件/删除文件总数
exports.getUploadFileCount = async (ctx) => {

  try {
    const userId = ctx.state.user.id; // 获取当前用户ID

    const uploadFileCount = await fileModel.getUploadFileCount(userId); // 查询上传文件总数
    const deletedFileCount = await fileModel.getDeleteFileCount(userId); // 查询删除文件总数

    ctx.body = {
      success: true,
      code: 200,
      data: {
        uploadFileCount: uploadFileCount[0].count,
        deletedFileCount: deletedFileCount[0].count,
      },
    }
  } catch (error) {
    console.error('查询文件失败:', error);
    ctx.body = { success: false,code:500, msg: '查询文件失败' };
  }
  
}





// 查询当前用户上传的文件(分页加载)

exports.getFileListByUserId = async (ctx) => {
  const userId = ctx.state.user.id; // 获取当前用户ID
  // const page = parseInt(ctx.query.page) || 1; // 当前页码，默认为1
  // const limit = parseInt(ctx.query.limit) || 10; // 每页条数，默认为10

  let { page, fileName, fileType,startTime,endTime,limit=10 } = ctx.request.body;

  try {
    const files = await fileModel.getFileListByUserId(userId, {
      page,
      fileName,
      fileType,
      startTime,
      endTime,
      limit,
    });
    const total = await fileModel.getFileActiveCountByUserId(userId,{
      page,
      fileName,
      fileType,
      startTime,
      endTime,
      limit,
    }); // 总记录数

    const fileListData = files.map((item) => {
      return {
        ...item,
        full_path: `${ctx.request.protocol}://${
          ctx.request.host
        }/uploads/${path.basename(item.file_path)}`,
      };
    });

     // 平铺返回数据，而不是嵌套在 data 对象中
    ctx.body = {
      ...resObj(200, fileListData, '查询成功'),
      total: total[0].count,
      page: parseInt(page),
      limit: parseInt(limit)
    };

  } catch (error) {
    console.error('查询文件失败:', error);

    ctx.body = resObj(500, null, '查询文件失败');
  }
};

// 查询用户上传的文件状态为 'deleted'的文件列表
exports.getFileListDeletedByUserId = async (ctx) => {
  const userId = ctx.state.user.id; // 获取当前用户ID
  // const page = parseInt(ctx.query.page) || 1; // 当前页码，默认为1
  // const limit = parseInt(ctx.query.limit) || 10; // 每页条数，默认为10

  let { page, fileName, fileType,startTime,endTime,limit=10 } = ctx.request.body;

  try {
    const files = await fileModel.getFileListDeletedByUserId(userId, {
      page,
      fileName,
      fileType,
      startTime,
      endTime,
      limit,
    });
    const total = await fileModel.getFileDeletedCountByUserId(userId,{
      page,
      fileName,
      fileType,
      startTime,
      endTime,
      limit,
    }); // 总记录数

    const fileListData = files.map((item) => {
      return {
        ...item,
        full_path: `${ctx.request.protocol}://${
          ctx.request.host
        }/uploads/${path.basename(item.file_path)}`,
      };
    });

    ctx.body = {
      // success: true,
      // data: fileListData, // 分页数据
      // total: total[0].count, // 总记录数
      // page: page, // 当前页码
      // limit: limit, // 每页条数
      ...resObj(200, fileListData, '查询成功'),
      total: total[0].count,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  } catch (error) {
    console.error('查询已删除文件失败:', error);
    ctx.body = resObj(500, null, '查询已删除文件失败');
    // ctx.body = { success: false, msg: '查询已删除文件失败' };
  }
};

// 列表页面批量删除

exports.batchDeleteFile = async (ctx) => {
  const { fileList } = ctx.request.body;
  const ids = fileList.map((item) => item.id);
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    ctx.body = resObj(500, null, '请选择要删除的文件');
    // return (ctx.body = { success: false, msg: '请选择要删除的文件' });
  }

  try {
    const result = await fileModel.batchDeleteFiles({ ids });

    // const deletePromises = fileList.map(async item => {
    // const filePath = path.join(__dirname, `../public/${item.file_path}`);
    // // 检查是否为文件
    //   const stat = await fs.promises.stat(filePath);
    //   if (stat.isFile()) {
    //     await fs.promises.unlink(filePath);
    //      console.log(`已删除文件: ${filePath}`);
    //   }

    // });
    // // 等待所有删除操作完成
    // await Promise.all(deletePromises);

    if (result.affectedRows > 0) {
      ctx.body = resObj(200, null, '删除成功');
      // ctx.body = { success: true, code: 200, msg: '删除成功' };
    } else {
      ctx.body = resObj(500, null, '删除失败');
      // ctx.body = { success: false, code: 500, msg: '删除失败' };
    }
  } catch (error) {
    console.error('批量删除文件失败:', error);
    ctx.body = resObj(500, null, '批量删除文件失败');
    // ctx.body = { success: false, code: 500, msg: '批量删除文件失败' };
  }
};

// 还原文件
exports.restoreFile = async (ctx) => {
  // const { fileId } = ctx.request.body;
  // 从 ctx.params 中获取 fileId 参数
  const fileId = ctx.params.fileId;
  console.log('fileId', fileId);
  if (await fileModel.restoreFile(fileId)) {
    ctx.body = resObj(200, null, '还原成功');
    // ctx.body = { success: true, code: 200, msg: '还原成功' };
  } else {
    ctx.status = 500;
    ctx.body = resObj(500, null, '还原失败');
    // ctx.body = { success: false, code: 500, msg: '还原失败' };
  }
};

// 获取轮播图数据(最新上传的前5张图片)
exports.getCarousel = async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const fileListPicTop5 = await fileModel.getFileListPicTop5(userId);

    const fileListData = fileListPicTop5.map((item) => {
      return {
        ...item,
        full_path: `${ctx.request.protocol}://${
          ctx.request.host
        }/uploads/${path.basename(item.file_path)}`,
      };
    });
    ctx.body =resObj(200, fileListData, '查询成功');
    // ctx.body = { success: true, code: 200, data: fileListData };
  } catch (error) {
    console.log('error', error);
    ctx.body = resObj(500, null, `${error.message}`);
    // ctx.body = { success: false, code: 500, message: error.message };
  }
};

// 获取非图片文件 top5

exports.getOtherFileListTop5 = async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const fileOtherListPicTop5 = await fileModel.getOtherFileListPicTop5(
      userId
    );

    const fileListData = fileOtherListPicTop5.map((item) => {
      return {
        ...item,
        full_path: `${ctx.request.protocol}://${
          ctx.request.host
        }/uploads/${path.basename(item.file_path)}`,
      };
    });
    ctx.body = resObj(200, fileListData, '查询成功');
    // ctx.body = { success: true, code: 200, data: fileListData };
  } catch (error) {
    console.log('error', error);
    ctx.body = resObj(500, null, `${error.message}`);
  }
};

// base64上传接口
exports.uploadFileBase64 = async (ctx) => {
  try {
    const { file, fileName } = ctx.request.body;

    // 检查参数
    if (!file) {
      ctx.body = resObj(400, null, '文件数据不能为空');
      return;
    }

    // 将 Base64 转换为 Buffer
    const buffer = Buffer.from(file, 'base64');

    // 生成文件名
    const ext = fileName ? path.extname(fileName) : '.bin';
    const uniqueFileName = `${
      path.basename(fileName, ext) || 'file'
    }-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // 写入文件
    fs.writeFileSync(filePath, buffer);

    // 获取文件信息
    const stats = fs.statSync(filePath);

    // 构造文件信息对象
    const fileInfo = {
      originalName: fileName || uniqueFileName,
      fileName: uniqueFileName,
      filePath: `/uploads/${uniqueFileName}`,
      fileSize: stats.size,
      mimeType: getMimeType(ext),

      fileExtension: ext,
      uploadTime: new Date(),
      uploaderId: ctx.state.user.id,
      uploaderIp: ctx.request.ip,
      isWatermarked: 0,
      status: 'active',
      description: '',
      full_path: `${ctx.request.protocol}://${ctx.request.host}/uploads/${uniqueFileName}`,
    };

    // 如果是图片文件，添加水印
    if (fileInfo.mimeType.startsWith('image/')) {
      try {
        // const now = new Date();
        // const watermarkedImagePath = await addWatermark(
        //   filePath,
        //   `${now.getFullYear()}-${
        //     now.getMonth() + 1
        //   }-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
        // );

        // 更新文件信息
        // fileInfo.isWatermarked = 1;
        // fileInfo.full_path = `${ctx.request.protocol}://${
        //   ctx.request.host
        // }/uploads/${path.basename(watermarkedImagePath)}`;
        fileInfo.filePath = `${ctx.request.protocol}://${
          ctx.request.host
        }/uploads/${path.basename(filePath)}`;
      } catch (watermarkError) {
        console.error('添加水印失败:', watermarkError);
      }
    }

    // 文件信息入库
    await fileModel.insertUploadInfo([fileInfo]);

    ctx.body = resObj(200, fileInfo, '文件上传成功');

  } catch (error) {
    console.error('Base64 文件上传失败:', error);
    ctx.body = resObj(500, null, '文件上传失败');
  }
};

/**
 * 根据文件扩展名获取 MIME 类型
 */
function getMimeType(ext) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
  };

  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// 二进制格式上传
exports.uploadFileBinary = async (ctx) => {
  try {
    // 检查是否是 application/octet-stream 类型的二进制数据
    if (
      ctx.request.type === 'application/octet-stream' ||
      ctx.request.headers['content-type'] === 'application/octet-stream'
    ) {
      console.log('Processing raw binary stream...');

      // 收集原始二进制数据
      const chunks = [];

      // 使用 Promise 包装流数据读取
      const binaryData = await new Promise((resolve, reject) => {
        ctx.req.on('data', (chunk) => {
          chunks.push(chunk);
        });

        ctx.req.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        ctx.req.on('error', (err) => {
          reject(err);
        });
      });

      console.log('Received binary data length:', binaryData.length);

      // 检查是否有数据
      if (!binaryData || binaryData.length === 0) {

        ctx.body = resObj(400, null, '文件数据不能为空');
        // ctx.body = {
        //   success: false,
        //   code: 400,
        //   msg: '文件数据不能为空',
        // };
        return;
      }

      // 从请求头中获取文件信息
      const fileName = decodeURIComponent(
        ctx.request.headers['x-file-name'] || 'file.bin'
      );
      const fileSize =
        parseInt(ctx.request.headers['x-file-size']) || binaryData.length;
      const mimeType =
        ctx.request.headers['x-file-type'] || 'application/octet-stream';

      console.log('File info:', { fileName, fileSize, mimeType });

      // 生成文件名
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      const uniqueFileName = `${name || 'file'}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, uniqueFileName);

      console.log('Saving file to:', filePath, ext);

      // 写入文件
      fs.writeFileSync(filePath, binaryData);

      // 构造文件信息对象
      const fileInfo = {
        originalName: fileName,
        fileName: uniqueFileName,
        filePath: `/uploads/${uniqueFileName}`,
        fileSize: fileSize,
        mimeType: mimeType,
        fileExtension: ext,
        uploadTime: new Date(),
        uploaderId: ctx.state.user.id,
        uploaderIp: ctx.request.ip,
        isWatermarked: 0,
        status: 'active',
        description: '',
        full_path: `${ctx.request.protocol}://${ctx.request.host}/uploads/${uniqueFileName}`,
      };

      // 如果是图片文件，添加水印
      // if (fileInfo.mimeType && fileInfo.mimeType.startsWith('image/')) {
      //   try {
      //     const now = new Date();
      //     const watermarkedImagePath = await addWatermark(
      //       filePath,
      //       `${now.getFullYear()}-${
      //         now.getMonth() + 1
      //       }-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
      //     );

      //     // 更新文件信息
      //     fileInfo.isWatermarked = 1;
      //     fileInfo.full_path = `${ctx.request.protocol}://${
      //       ctx.request.host
      //     }/uploads/${path.basename(watermarkedImagePath)}`;
      //   } catch (watermarkError) {
      //     console.error('添加水印失败:', watermarkError);
      //   }
      // }

      // 文件信息入库
      await fileModel.insertUploadInfo([fileInfo]);

      ctx.body = resObj(200, fileInfo, '文件上传成功');

      // ctx.body = {
      //   success: true,
      //   code: 200,
      //   msg: '文件上传成功',
      //   files: fileInfo,
      // };
      return;
    }

    // 如果是通过 multer 处理的文件上传（multipart/form-data）
    if (ctx.req.files && ctx.req.files.length > 0) {
      console.log('Processing multipart files...');
      const files = ctx.req.files;
      const processedFiles = [];

      for (const file of files) {
        // 确保 file.path 存在且为字符串
        if (!file.path || typeof file.path !== 'string') {
          throw new Error('文件路径无效');
        }

        // 构造文件信息对象
        let fileInfo = {
          originalName: file.originalname,
          fileName: file.filename,
          filePath: `/uploads/${file.filename}`,
          fileSize: file.size,
          mimeType: file.mimetype || 'application/octet-stream',
          fileExtension: path.extname(file.originalname),
          uploadTime: new Date(),
          uploaderId: ctx.state.user.id,
          uploaderIp: ctx.request.ip,
          isWatermarked: 0,
          status: 'active',
          description: '',
          full_path: `${ctx.request.protocol}://${ctx.request.host}/uploads/${file.filename}`,
        };

        // 如果是图片文件，添加水印
        // if (fileInfo.mimeType && fileInfo.mimeType.startsWith('image/')) {
        //   try {
        //     const now = new Date();
        //     const watermarkedImagePath = await addWatermark(
        //       file.path,
        //       `${now.getFullYear()}-${
        //         now.getMonth() + 1
        //       }-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
        //     );

        //     // 更新文件信息
        //     fileInfo.isWatermarked = 1;
        //     fileInfo.full_path = `${ctx.request.protocol}://${
        //       ctx.request.host
        //     }/uploads/${path.basename(watermarkedImagePath)}`;
        //   } catch (watermarkError) {
        //     console.error('添加水印失败:', watermarkError);
        //   }
        // }

        processedFiles.push(fileInfo);
      }

      // 文件信息入库
      await fileModel.insertUploadInfo(processedFiles);

      ctx.body = resObj(200, processedFiles.length === 1 ? processedFiles[0] : processedFiles, `成功上传 ${processedFiles.length} 个文件`);

      // ctx.body = {
      //   success: true,
      //   code: 200,
      //   msg: `成功上传 ${processedFiles.length} 个文件`,
      //   files: processedFiles.length === 1 ? processedFiles[0] : processedFiles,
      // };
      return;
    }
  } catch (error) {
    console.error('二进制文件上传失败:', error);

    ctx.body = resObj(500, null,  error.message|| '文件上传失败');
    // ctx.body = {
    //   success: false,
    //   code: 500,
    //   msg: '文件上传失败',
    //   error: error.message,
    // };
  }
};

// 彻底删除文件
exports.completeDeleteFile = async (ctx) => {
  const { filename } = ctx.request.body;
  const userId = ctx.state.user.id; // 获取当前用户ID
  if (!filename) {
     ctx.body = resObj(400, null, '文件ID不能为空');
    // ctx.body = { success: false, msg: '文件ID不能为空' };
    return;
  }

  try {
    const filePath = path.join(__dirname, `../public/${filename}`);
    await fileModel.completeDeleteFile(userId, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // 删除文件
    }
    ctx.body = { success: true };
  } catch (err) {
    console.log('error', err);
     ctx.body = resObj(400, null, '删除失败');
    // ctx.body = { success: false, msg: '删除失败' };
  }
};

// 查询所有上传文件的类型
exports.getFileTypeList = async (ctx) => {
  const result = await fileModel.queryFileType();
  ctx.body = resObj(200, result, '查询文件的类型成功');
  // ctx.body = {
  //   success: true,
  //   code: 200,
  //   data: result,
  // };
};
