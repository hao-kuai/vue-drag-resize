/**
 * vue-drag-resize 组件入口文件
 * 
 * 设计目的：
 * 1. 提供组件的全局注册机制
 * 2. 支持多种引入方式（Vue.use 和直接引入）
 * 3. 自动检测环境并安装
 * 4. 防止重复安装
 */

// 导入 vue 组件
import VueDragResize from './components/vue-drag-resize.vue';

/**
 * install 函数实现
 * 作用：
 * 1. 提供给 Vue.use() 调用的安装方法
 * 2. 将组件注册为全局组件
 * 3. 确保只安装一次
 */
export function install(Vue) {
    // 防止重复安装插件
    if (install.installed) return;
    install.installed = true;
    // 全局注册组件，使其在所有组件中都可用
    Vue.component('vue-drag-resize', VueDragResize);
}

/**
 * 插件定义
 * 符合 Vue 插件开发规范
 * 必须提供 install 方法
 */
const plugin = {
    install,
};

// 自动安装：当发现 Vue 时自动安装（例如在浏览器通过 <script> 标签引入的情况）
let GlobalVue = null;
// 环境检测：区分浏览器和 Node 环境
if (typeof window !== 'undefined') {
    // 浏览器环境
    GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
    // Node 环境
    GlobalVue = global.Vue;
}
// 如果找到 Vue 则自动安装插件
if (GlobalVue) {
    GlobalVue.use(plugin);
}

// 导出组件，支持通过模块方式使用（npm/webpack 等）
export default VueDragResize;