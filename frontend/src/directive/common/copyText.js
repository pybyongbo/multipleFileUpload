/**
 * v-copyText 复制文本内容
 * 优化版本 - 支持现代 Clipboard API 和回退方案
 * Copyright (c) 2022 ruoyi
 */

export default {
  mounted(el, { value, arg }) {
    // 存储配置值
    if (arg === "callback") {
      el.$copyCallback = value;
    } else {
      el.$copyValue = value;
      
      // 创建点击处理函数
      const handler = async (event) => {
        // 防止表单提交或其他默认行为
        event.preventDefault();
        
        try {
          const isSuccess = await copyTextToClipboard(el.$copyValue);
          
          // 执行回调函数（如果有）
          if (el.$copyCallback) {
            el.$copyCallback(isSuccess, el.$copyValue);
          }
        } catch (error) {
          // 处理复制失败的情况
          if (el.$copyCallback) {
            el.$copyCallback(false, el.$copyValue, error);
          }
          console.warn('复制失败:', error);
        }
      };
      
      // 绑定事件监听器
      el.addEventListener("click", handler);
      
      // 存储清理函数
      el.$destroyCopy = () => el.removeEventListener("click", handler);
    }
  },

  updated(el, { value, arg }) {
    // 更新时重新设置值
    if (arg === "callback") {
      el.$copyCallback = value;
    } else {
      el.$copyValue = value;
    }
  },

  unmounted(el) {
    // 清理事件监听器
    if (el.$destroyCopy) {
      el.$destroyCopy();
      delete el.$destroyCopy;
    }
    
    // 清理存储的值
    if (el.$copyValue) delete el.$copyValue;
    if (el.$copyCallback) delete el.$copyCallback;
  }
};

/**
 * 复制文本到剪贴板
 * @param {string} input - 要复制的文本
 * @param {Object} options - 配置选项
 * @returns {Promise<boolean>} 复制是否成功
 */
async function copyTextToClipboard(input, { target = document.body } = {}) {
  // 优先使用现代 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(input);
      return true;
    } catch (error) {
      // 如果现代 API 失败，回退到传统方法
      console.warn('Clipboard API 失败，使用回退方法:', error);
    }
  }
  
  // 回退到传统方法
  return fallbackCopyTextToClipboard(input, { target });
}

/**
 * 传统复制方法（兼容旧浏览器）
 * @param {string} input - 要复制的文本
 * @param {Object} options - 配置选项
 * @returns {boolean} 复制是否成功
 */
function fallbackCopyTextToClipboard(input, { target = document.body }) {
  const element = document.createElement('textarea');
  const previouslyFocusedElement = document.activeElement;

  element.value = input;

  // 防止移动设备上键盘弹出
  element.setAttribute('readonly', '');
  
  // 样式优化
  element.style.cssText = `
    position: absolute;
    left: -9999px;
    top: -9999px;
    opacity: 0;
    pointer-events: none;
    z-index: -1;
  `;

  const selection = document.getSelection();
  const originalRange = selection.rangeCount > 0 && selection.getRangeAt(0);

  target.appendChild(element);
  
  // 选择文本内容
  if (/ipad|iphone/i.test(navigator.userAgent)) {
    // iOS 特殊处理
    element.contentEditable = true;
    element.readOnly = false;
    
    const range = document.createRange();
    range.selectNodeContents(element);
    
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    element.setSelectionRange(0, 999999);
  } else {
    element.select();
    element.setSelectionRange(0, element.value.length);
  }

  let isSuccess = false;
  try {
    isSuccess = document.execCommand('copy');
  } catch (error) {
    console.error('复制命令失败:', error);
  }

  // 清理
  target.removeChild(element);

  if (originalRange) {
    selection.removeAllRanges();
    selection.addRange(originalRange);
  }

  // 恢复焦点
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }

  return isSuccess;
}