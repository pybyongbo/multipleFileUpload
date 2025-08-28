const isBrowser = () => typeof window !== 'undefined';
// 格式化参数
export function formatParams(params) {
  const p = [];
  for (const key in params) {
    p.push(key + '=' + params[key]);
  }
  return p.join('&');
}

/**
 * @description 公共方法-获取sessionStorage数据
 * @param {string} type 搜索项数组对象type值
 * @param {Function} callback 回调函数
 * @return {Array} 搜索项数组对象
 */
// import { findProvince } from '@/api/base';

// 获取url后面的参数
export const getQueryString = (url, name) => {
  let locationSearch = !!isBrowser() && window.location.search;
  let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  let r =
    !!locationSearch && (!!url ? url : locationSearch).substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
};

//获取url参数对应value值
export const getValue = (value) => {
  const locationSearch = !!isBrowser() && window.location.search;
  return !!getQueryString(decodeURI(locationSearch), value) &&
    getQueryString(decodeURI(locationSearch), value) !== 'undefined'
    ? getQueryString(decodeURI(locationSearch), value)
    : '';
};

// 节流函数

export const throttle = (fn, wait = 1000) => {
  // 上一次执行 fn 的时间
  let previous = 0;
  // 将 throttle 处理结果当作函数返回
  return function (...args) {
    // 获取当前时间，转换成时间戳，单位毫秒
    let now = +new Date();
    // 将当前时间和上一次执行函数的时间进行对比
    // 大于等待时间就把 previous 设置为当前时间并执行函数 fn
    if (now - previous > wait) {
      previous = now;
      fn.apply(this, args);
    }
  };
};


// 判断当前文件是否为图片文件
export const isImage = (fileName) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return imageExtensions.includes(ext);
}


// 获取文件的后缀名
export const getFileExtension = (fileName) => {
  return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
}



/**
 * 将字节转换为KB
 * @param {number} bytes - 字节大小
 * @param {number} decimals - 保留小数位数
 * @returns {string} 格式化后的KB大小
 */
export function bytesToKB(bytes, decimals = 2) {
  if (bytes === 0) return '0 KB';
  
  const dm = decimals < 0 ? 0 : decimals;
  const kbValue = bytes / 1024;
  
  return kbValue.toFixed(dm) + ' KB';
}


 // 获取 MIME 类型分类
export const getMimeTypeCategory = (mimeType) => {
  if (!mimeType) return 'other'
  
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('text/') || 
      mimeType.includes('document') || 
      mimeType.includes('pdf') || 
      mimeType.includes('msword') ||
      mimeType.includes('officedocument')) return 'document'
  if (mimeType.includes('zip') || 
      mimeType.includes('rar') || 
      mimeType.includes('7z') || 
      mimeType.includes('tar') || 
      mimeType.includes('gz')) return 'archive'
  
  return 'other'
}


export const getCategoryLabel = (category) => {
  const labels = {
    'image': '图片',
    'video': '视频',
    'audio': '音频',
    'document': '文档',
    'archive': '压缩包',
    'other': '其他'
  }
  return labels[category] || '其他'
}


// 在 utils/tools.js 中添加时间处理函数
// 在 utils/tools.js 中修改时间处理函数
export const formatDateRange = (dateRange) => {
  if (!dateRange || !Array.isArray(dateRange) || dateRange.length === 0) {
    return {};
  }
  
  const result = {};
  
  // 处理开始时间
  if (dateRange[0]) {
    const startDate = new Date(dateRange[0]);
    // 设置为当天的开始时间 00:00:00
    startDate.setHours(0, 0, 0, 0);
    // 使用本地时区格式化
    const dateStr = startDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    result.startTime = `${dateStr} 00:00:00`;
  }
  
  // 处理结束时间
  if (dateRange[1]) {
    const endDate = new Date(dateRange[1]);
    // 设置为当天的结束时间 23:59:59
    endDate.setHours(23, 59, 59, 999);
    // 使用本地时区格式化
    const dateStr = endDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    result.endTime = `${dateStr} 23:59:59`;
  }
  
  return result;
};

