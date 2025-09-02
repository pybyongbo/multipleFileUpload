const router = require('koa-router')();
const multer = require('koa-multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads');

const fileController = require('../controller/uploadFile.js');

// 确保目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const uniqueName = `${name}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// 文件信息入库
router.post('/upload', upload.array('files', 5), fileController.uploadFile);

// router.post('/upload', upload.single('file'), fileController.uploadFile);


// 删除文件接口
router.post('/delete', fileController.deleteFile);


// 获取当前用户上传的文件列表
router.post('/fileList', fileController.getFileListByUserId);


router.post('/fileListDeleted', fileController.getFileListDeletedByUserId);


// 列表页面删除接口  (支持批量删除操作)

router.post('/batchDeleteFile', fileController.batchDeleteFile);

// 还原文件 fileRestore
router.get('/restoreFile/:fileId', fileController.restoreFile);


// 获取轮播图数据
router.get('/getCarouselData', fileController.getCarousel);


// 获取非图片文件 top5
router.get('/getOtherFileListTop5', fileController.getOtherFileListTop5);


// base64图片上传
router.post('/uploadFileBase64', upload.array('files', 5), fileController.uploadFileBase64);


// 二进制格式上传
router.post('/uploadFileBinary', upload.array('files', 5), fileController.uploadFileBinary);


// 彻底删除文件操作
router.post('/completedelete', fileController.completeDeleteFile);


// 查询上传所有文件的类型数据
router.get('/getFileType', fileController.getFileTypeList);


// 查询上传文件/删除文件总数
router.get('/getUploadFileCount', fileController.getUploadFileCount);


// 下载文件接口 - 通过文件ID下载
router.get('/download/:fileId', fileController.downloadFile);


module.exports = router;
