// hooks/useWatermarkBg.js
import { computed, watch } from "vue";

export default function useWatermarkBg(props){
  // 如果 props 是响应式的，直接解构会失去响应性
  // 应该这样处理：

  return computed(() => {
    const { text, fontSize, gap, color } = props;
    
    if (!text) {
      return {
        base64: '',
        size: 0,
        styleSize: 0,
      }
    }
    
    const canvas = document.createElement('canvas');
    const devicePixelRatio = window.devicePixelRatio || 1;
    const fontSizeStyle = fontSize * devicePixelRatio;
    const font = `${fontSizeStyle}px serif`;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return {
        base64: '',
        size: 0,
        styleSize: 0,
      }
    }

    // 获取文字宽度
    ctx.font = font;
    const { width } = ctx.measureText(text);
    const canvasSize = Math.max(100, width) + gap * devicePixelRatio;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.translate(canvas.width / 2, canvas.height / 2);

    // 倾斜文本
    ctx.rotate(Math.PI / 180 * -45);
    ctx.fillStyle = color || 'rgba(0, 0, 0, 0.15)';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);

    return {
      base64: canvas.toDataURL(),
      size: canvasSize,
      styleSize: canvasSize / devicePixelRatio,
    }
  })
}