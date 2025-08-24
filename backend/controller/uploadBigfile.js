
const path = require('path')
const fs = require('fs')
const os = require('os')

// 修改路径定义
const staticPath = path.join(__dirname, '../public/uploads')
const cachePath = path.join(staticPath, 'cache')  // 临时存储分片
const finishPath = path.join(staticPath, 'finish') // 最终存储合并后的文件


// 确保目录存在
if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, { recursive: true })
}

if (!fs.existsSync(finishPath)) {
  fs.mkdirSync(finishPath, { recursive: true })
}


// 大文件分片上传接口

exports.update = async (ctx) => {
  try {
    const files = ctx.request.files;
    const body = ctx.request.body;

    if (!files || !files.file) {
      ctx.body = { result: -1, msg: '没有上传文件' };
      return;
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file.filepath) {
      ctx.body = { result: -1, msg: '文件路径不存在', file };
      return;
    }

    const { fileMd5, fileName } = body;
    if (!fileMd5 || !fileName) {
      ctx.body = { result: -1, msg: '缺少必要参数' };
      return;
    }

    const haveSuffix = fileName.lastIndexOf('.') > -1;
    let nameSuffix = haveSuffix ? fileName.slice(fileName.lastIndexOf('.')) : '';
    let justMd5 = fileMd5.slice(0, fileMd5.lastIndexOf('-'));
    let folderPath = path.join(staticPath, 'cache', justMd5);
    let dirPath = path.join(folderPath, `${fileMd5}${nameSuffix}`);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // 推荐用 copyFileSync 或 renameSync
    fs.copyFileSync(file.filepath, dirPath);

    ctx.body = {
      result: 1,
      msg: '单片上传完成',
      data: { folderPath, fileMd5, justMd5, nameSuffix, fileName }
    };
  } catch (err) {
    console.log('文件上传错误:', err);
    ctx.body = { result: -1, msg: '单片上传失败', data: err.message };
  }
};




exports.mergeSlice = async (ctx) => {
  try {
    let { folderPath, fileMd5, justMd5, nameSuffix, fileName } = ctx.request.body;
    await new Promise((resolve, reject) => {
      mergeChunks(folderPath, fileMd5, nameSuffix, (endPathUrl) => {
        try {
          fs.rmdirSync(folderPath)
          let needObj = { url: endPathUrl, name: fileName, md5: justMd5 }
          ctx.body = { result: 1, msg: '合并完成' }
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    })
  } catch (err) {
    console.log('err', err);
    ctx.body = { result: -1, msg: '合并失败', data: err }
  }
}



exports.checkFile = async (ctx) => {
  console.log('checkFile method called');
  console.log('Request body:', ctx.request.body);

  const fakeFreeMem = 1024 * 1024 * 1024 * 2 // 2GB
  
  try {
    let { md5, size } = ctx.request.body;
    
    // 检查必要参数
    if (!md5 || size === undefined) {
      ctx.body = {result: -1, msg: '缺少必要参数'};
      return;
    }

    console.log('os.freemem()',os.freemem());
    
    // if (size > os.freemem()) {
    if (size > fakeFreeMem) { // 仅用于测试，实际部署请用 os.freemem()
      ctx.body = {result: -2, msg: '服务器剩余容量不足! 请清空本地和服务器存储的文件'};
      return;
    } else {
      // 检查 finish 目录中是否已存在该文件
      const files = fs.readdirSync(finishPath);
      const existingFile = files.find(item => item.startsWith(md5));
      
      if (existingFile) {
        ctx.body = {result: -1, msg: '该文件已经上传完成了'};
      } else {
        ctx.body = {result: 1, msg: '还没上传过这个文件'};
      }
    }
  } catch (err) {
    console.log('err', err);
    ctx.body = {result: -1, msg: '检查文件失败', data: err.message};
  }
}


exports.clearDir = async (ctx) => {
  // try {
  //   // 清空 cache 目录
  //   if (fs.existsSync(cachePath)) {
  //     fs.rmSync(cachePath, { recursive: true, force: true });
  //   }
    
  //   // 清空 finish 目录
  //   if (fs.existsSync(finishPath)) {
  //     fs.rmSync(finishPath, { recursive: true, force: true });
  //   }
    
  //   // 重新创建目录
  //   fs.mkdirSync(cachePath, { recursive: true });
  //   fs.mkdirSync(finishPath, { recursive: true });
    
  //   ctx.body = {result: 1, msg: '清空成功'};
  // } catch (err) {
  //   console.log('clear err', err);
  //   ctx.body = {result: -1, msg: '清空失败', data: err.message};
  // }
   try{
        let finishDir = path.join(staticPath,'finish')
        let cacheDir = path.join(staticPath,'cache')
        const files = fs.readdirSync(finishDir)
        const filesB = fs.readdirSync(cacheDir)
        for (const file of files) {
            // 注意:git是不能接收空文件夹的,.gitignore文件相当于空文件夹的占位文件夹,不能删它,如果删了它文件夹一空git会主动把你的空文件删掉
            file !== '.gitignore' ? fs.unlinkSync(`${finishDir}/${file}`) : ''
        }
        for (const file of filesB) {
            // node.js不支持删除有文件的文件夹,这种情况下就只能递归处理了
            file !== '.gitignore' ? rmdirSync(`${cacheDir}/${file}`) : ''
        }
        // res.send({result:1,msg:'清空成功'})
        ctx.body = {result: 1, msg: '清空成功'}

    }catch(err){
      ctx.body = {result: -1, msg: '清空失败', data: err.message};
    }
}

// 合并分片
function mergeChunks(folderPath,fileMd5,nameSuffix,cb){
    fs.readdir(folderPath,(err,data)=>{
        if(!err){
            const pathArr = []
            // console.log(data,'data')
            for (let i = 0; i < data.length; i++) {
                let needPath = data.filter(item => item.split('-')[1].split('.')[0] === String(i))[0]
                pathArr.push(path.join(folderPath,needPath)) 
            }
            const endPathUrl = path.join(staticPath,'finish',`${fileMd5.split('-')[0]}${nameSuffix}`)  // 合并之后的文件路径
            const endWs = fs.createWriteStream(endPathUrl,{flags:'a'})  // 创建可写流,a表示追加内容
            // 将追加添加到文档流封装成一个方法,循环调用
            const addStream = (pathArr)=>{
                let path = pathArr.shift()  // 删除数组的第一个并返回第一个
                const buffer = fs.readFileSync(path)  // 根据file对象的路径获取file对象里的内容
                endWs.write(buffer)  
                fs.unlinkSync(path)  // 追加完就删除文件
                if(pathArr.length > 0){
                    addStream(pathArr)
                }else{
                    endWs.close()
                    cb(endPathUrl)
                }
            }
            addStream(pathArr)
        }
    }) 
}
// 删除目录和子目录
const rmdirSync = (function(){
    function iterator(url,dirs){
        var stat = fs.statSync(url);
        if(stat.isDirectory()){
            dirs.unshift(url);  //收集目录
            inner(url,dirs);
        }else if(stat.isFile()){
            fs.unlinkSync(url);  //直接删除文件
        }
    }
    function inner(path,dirs){
        var arr = fs.readdirSync(path);
        for(var i = 0, el ; el = arr[i++];){
            iterator(path+"/"+el,dirs);
        }
    }
    return function(dir,cb){
        cb = cb || function(){};
        var dirs = [];
        try{
            iterator(dir,dirs);
            for(var i = 0, el ; el = dirs[i++];){
                fs.rmdirSync(el);  //一次性删除所有收集到的目录
            }
            cb()
        }catch(e){
            //如果文件或目录本来就不存在，fs.statSync会报错，不过我们还是当成没有异常发生
            e.code === "ENOENT" ? cb() : cb(e);
        }
    }
})()