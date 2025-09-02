import http,{ service } from '@/utils/request'
import axios from 'axios'

// 获取上传/删除文件总数
export const getFileTotalCount = () => {
  return http.get("/getUploadFileCount");
}


// 上传文件
export const uploadFile = params => {
  return http.post("/upload", params);
};


// 删除文件
export const deleteUploadFile = params => {
  return http.post("/delete", params);
};

// 获取当前用户上传的文件列表 
// export const getFileListByUserId = (page) => {
//   return http.get(`/fileList?page=${page}`);
// };

export const getFileListByUserId = (params) => {
  console.log('params',params);
  return http.post('/fileList',  params );
};


// 获取当前用户删除的文件列表
export const getFileListDeletedByUserId = (params) => {
  return http.post('/fileListDeleted', params);
};

// 删除文件 (列表页面,单个,多个)

export const batchDeleteFile = ({fileList}) => {
  return http.post("/batchDeleteFile", {fileList});
};

//  responseType: 'arraybuffer',  'blob',   都可以
export const getFile = url =>{
	// return new Promise((resolve, reject) =>{
	// 	return service.get(url, {
	// 		responseType: "arraybuffer"
	// 	}).then(res =>{
	// 		resolve(res.data);
	// 	}).
	// 	catch(err =>{
	// 		reject(err.toString());
	// 	});
	// });
  return service.get(url, {
    responseType: "blob"
  }).then(res =>{
    console.log('res',res);
    return res.data;
  });

//  return new Promise((resolve, reject) =>{
// 		service.get(url, {
// 			responseType: "blob"
// 		}).then(res =>{
// 			resolve(res.data);
// 		}).
// 		catch(err =>{
// 			reject(err.toString());
// 		});
// 	});
};

// 还原文件
export const restoreFileById = (fileId) => {
  return http.get(`/restoreFile/${fileId}`);
};


// 轮播图数据

export const getCarouselData = () => {
  return http.get('/getCarouselData');
};

// 非图片文件 top5 

export const getOtherFileListTop5 = () => {
  return http.get('/getOtherFileListTop5');
};


// 上传文件 base64 格式上传
export const uploadFileBase64 = params => {
  return http.post('/uploadFileBase64', params);
}

// 上传文件  二进制格式上传

export const uploadFileBinary = (params,headers) => {
  return http.post('/uploadFileBinary', params, {...headers});
}


// 彻底删除文件

export const completeDeleteFile = (params) => {
  return http.post("/completedelete", params);
}


// update, checkFile, mergeSlice,  clearDir

export const update = (data, headers) => {
  // const CancelToken = axios.CancelToken
  return service.post('/update', data, {...headers})
};


export const checkFile = params => {
  console.log('checkFilecheckFilecheckFile');
   return http.post('/checkFile', params)
}

export function mergeSlice(data, config = {}) {
  // 不加 /bigupload 前缀
  return service.post('/mergeSlice', data, config)
}

export const clearDir = () => {
  return http.post('/clearDir')
}


// 获取文件类型下拉列表

export const getFileTypeList = () => {
  return http.get('/getFileType')
}



// 下载文件到本地
export const downloadFileById = (fileId,fileName='',{headers}) => {
  // console.log('headers',headers);
   return service.get(`/download/${fileId}`, {
    responseType: "blob",
    headers: {
      ...headers
    }
  }).then(res =>{
    console.log('res',res);
    return res.data;
  });
};