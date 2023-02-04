import { EChartsCtrl } from './echarts_ctrl';
import { loadPluginCss } from 'app/plugins/sdk';

loadPluginCss({ // 加载插件CSS
    dark: 'plugins/pingmesh-heatmap-panel/css/echarts.dark.css',
    light: 'plugins/pingmesh-heatmap-panel/css/echarts.light.css',
});

export { EChartsCtrl as PanelCtrl };
