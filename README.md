# pingmesh-heatmap-panel
pingmesh heatmap panel 该插件是基于[echarts](https://echarts.baidu.com/)开发的Grafana插件，现支持Heatmap图，将Heatmap改造为专属网络状况`Pingmesh`图。


## Quick Start
```sh
cd pingmesh-heatmap-panel/
yarn install
grunt
```

## 安装
```bash
cd /var/lib/grafana/plugins
git clone https://github.com/kubeservice-stack/pingmesh-heatmap-panel.git
sudo service grafana-server restart
```

## 使用方式
[Grafana Panel Plugin: Pingmesh Heatmap Panel](https://www.kubeservice.cn/2023/02/09/devops-grafana-pingmesh-heatmap-panel/)

## 效果截图
### 效果图
![avatar](https://raw.githubusercontent.com/kubeservice-stack/pingmesh-heatmap-panel/master/src/img/pingmesh_screen_1.png)

### 数据配置
![avatar](https://raw.githubusercontent.com/kubeservice-stack/pingmesh-heatmap-panel/master/src/img/pingmesh_screen_2.png)

### 展示效果调整
![avatar](https://raw.githubusercontent.com/kubeservice-stack/pingmesh-heatmap-panel/master/src/img/pingmesh_screen_3.png)


## 常见问题
### 错误诊断
查看`grafana` 日志

在 `mac` 日志目录是 `/usr/local/var/log/grafana`

在 `linux` 日志目录是` /var/log/grafana`

- /var/lib/grafana/plugins/pingmesh-heatmap-panel/*: permission denied , 需要授予插件目录下执行权限:
- 
```bash
$ chmod 777 /var/lib/grafana/plugins/pingmesh-heatmap-panel/
```
### grafana > 7.0
参考 [Backend plugins: Unsigned external plugins should not be loaded by default #24027](https://github.com/grafana/grafana/issues/24027)
修改grafana配置文件
在mac上一般为 `/usr/local/etc/grafana/grafana.ini`

在linux上一般为 `/etc/grafana/grafana.ini`

在`[plugins]`标签下设置参数
```
allow_loading_unsigned_plugins = pingmesh-heatmap-panel
```

## 开发者
[开发者](https://raw.githubusercontent.com/kubeservice-stack/pingmesh-heatmap-panel/master/DEVELOPMENT.md)
