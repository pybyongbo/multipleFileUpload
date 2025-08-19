import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'dayjs/locale/zh-cn'; //中文
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import './style.css';

import store from './store'
import App from './App.vue';

import directive from './directive' // directive
import router from '../router';

// svg图标
import 'virtual:svg-icons-register'
import SvgIcon from './components/SvgIcon/index.vue';
import elementIcons from './components/SvgIcon/svgicon.js'



const app = createApp(App);
directive(app)
app.use(store)
app.use(elementIcons)
app.component('svg-icon', SvgIcon)
app.use(ElementPlus, { locale: zhCn }).use(router).mount('#app')
