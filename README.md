# pingmesh-heatmap-panel
pingmesh heatmap panel 该插件是基于[echarts](https://echarts.baidu.com/)开发的Grafana插件，现支持Heatmap图，将Heatmap改造为专属网络状况`Pingmesh`图。


## Quick Start
```sh
cd pingmesh-heatmap-panel/
yarn install
grunt
```

## 安装
```sh
cd /var/lib/grafana/plugins
git clone https://github.com/kubeservice-stack/pingmesh-heatmap-panel.git
sudo service grafana-server restart
```

## 效果截图
### 效果图
![avatar](https://raw.githubusercontent.com/kubeservice-stack/pingmesh-heatmap-panel/master/src/img/pingmesh_screen_1.png)

### 数据配置
![avatar](https://raw.githubusercontent.com/kubeservice-stack/pingmesh-heatmap-panel/master/src/img/pingmesh_screen_2.png)

### 展示效果调整
![avatar](https://raw.githubusercontent.com/kubeservice-stack/pingmesh-heatmap-panel/master/src/img/pingmesh_screen_3.png)

## 开发者
[开发者](https://raw.githubusercontent.com/kubeservice-stack/pingmesh-heatmap-panel/master/DEVELOPMENT.md)