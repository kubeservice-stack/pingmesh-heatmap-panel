import _ from 'lodash';
import $ from 'jquery';
import 'jquery.flot';
import 'jquery.flot.pie';
import echarts from './echarts/echarts.min';

export default function link (scope, elem, attrs, ctrl) {
    var data;
    var panel = ctrl.panel;
    elem = elem.find('.echarts-panel__chart');
    var $tooltip = $('<div id="tooltip">');

    ctrl.events.on('render', function () { // 触发刷新/重新加载事件
        if (panel.legendType === 'Right side') {
            render(false);
            setTimeout(function () {
                render(true);
            }, 50);
        } else {
            render(true);
        }
    });


    function noDataPoints () {
        var html = '<div class="datapoints-warning"><span class="small">No data points</span></div>';
        elem.html(html);
    }

    function addecharts () { // 绘图
        let option;
        var width = elem.width();
        var height = ctrl.height;
        // var size = Math.min(width, height);
        const plotCanvas = $('<div style="height: 100%"></div>');
        elem.html(plotCanvas);
        const container = plotCanvas[0];

        var echartPanel = echarts.init(container);

        if (ctrl.panel.chartsType === 'pie') {
            option = pieChartsOptions(echartPanel)
        } else if (ctrl.panel.chartsType === 'bar' || ctrl.panel.chartsType === 'line') {
            option = barChartsOptions(echartPanel)
        } else if (ctrl.panel.chartsType === 'map') {
            option = mapChartsOptions(echartPanel);
        } else if (ctrl.panel.chartsType === 'heatmap') {
            option = heatmapChartsOptions(echartPanel);
        }
        if (option && typeof option === "object") {
            echartPanel.setOption(option, true);
        }
        let backgroundColor = $('body').css('background-color')

    }

    function mapChartsOptions (echartPanel) {
        let option = {};
        let seriesData = [];
        let valueList = [];
        data.series.map(item => {
            let value = item.data.pop().value[1];
            valueList.push(value);
            seriesData.push({
                name: item.name,
                value: value,
            })
        });
        $.get('public/plugins/beike-grafana-pingmesh-panel/echarts/datav-china.json', function (geoJson) {
            echartPanel.hideLoading();
            echarts.registerMap('china', geoJson);
            option = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}<br/>{c}'
                },
                visualMap: {
                    min: 0,
                    max: Math.max.apply(null, valueList) * 0.8,
                    text: ['High', 'Low'],
                    realtime: false,
                    calculable: true,
                    inRange: {
                        color: ['rgb(200,255,255)', 'rgb(36,104,202)']
                    }
                },
                series: [
                    {
                        type: 'map',
                        mapType: 'china', // 自定义扩展图表类型
                        itemStyle: {
                            normal: {
                                label: {
                                    show: ctrl.panel.label.show,
                                    fontSize: ctrl.panel.label.fontSize
                                }
                            },
                            emphasis: { label: { show: true } }
                        },
                        data: seriesData
                    }
                ]

            };
            echartPanel.setOption(option, true);
        });
        return option;
    }

    function heatmapChartsOptions (echartPanel) {
        let seriesData = [];
        let instances = _.chain(_.split(ctrl.panel.pingmesh.instances, ',')).map(ele => { return ele.replace(/ /g, '') }).value();
        console.log('instances', instances)
        let cache = {};

        data.series.map(item => {
            let metadata = item.data.pop()
            // 只取过去一分钟的点实时展示
            if ((new Date().getTime() - new Date(metadata.value[0].replace(/-/g, "/")).getTime()) / 1000 > 120) {
                return
            }
            let value = metadata.value[1];
            let isPingFail = false
            if (_.startsWith(item.name, 'pingmesh_fail')) {
                isPingFail = true
            }
            let jsonStrList = item.name.match(/({.*})/g)
            if (jsonStrList.length < 1) { return }
            let tags = {}
            _.forEach(_.split(jsonStrList[0].replace(/{/g, '').replace(/}/g, '').replace(/"/g, '').replace(/'/g, '').replace(/ /g, ''), ','), ele => {
                let cur = _.split(ele, '=')
                if (cur.length < 2) { return }
                tags[cur[0]] = cur[1]
            })

            let fromKey = 'from'
            let targetKey = 'target'

            if (!_.has(cache, tags[fromKey])) {
                cache[tags[fromKey]] = {}
            }
            if (isPingFail && value > 0) {
                value = 10001
            }
            if (cache[tags[fromKey]][tags[targetKey]] > 10000) {
                return
            }
            cache[tags[fromKey]][tags[targetKey]] = { 'tags': tags, 'value': value }
        });

        for (let i = 0; i < instances.length; i++) {
            for (let j = 0; j < instances.length; j++) {
                if (instances[i] === instances[j]) {
                    seriesData.push({ value: [i, j, '-'], url: '' })
                } else if (_.has(cache, instances[i]) && _.has(cache[instances[i]], instances[j])) {
                    seriesData.push({
                        value: [i, j, cache[instances[i]][instances[j]]['value']] || '-',
                        url: 'http://' + cache[instances[i]][instances[j]]['tags']['from'] + ":9115/probe?module=ping&target=" + cache[instances[i]][instances[j]]['tags']['target']
                    })
                } else {
                    seriesData.push({ value: [i, j, 0], url: 'http://' + instances[i] + ":9115/probe?module=ping&target=" + instances[j] })
                }
            }
        }
        // console.log('cache', cache)
        // console.log('seriesData', seriesData)
        // console.log('ctrl.panel.pingmesh', ctrl.panel.pingmesh)

        // seriesData = seriesData.map(function (item) {
        //     return [item[1], item[0], item[2]];
        // });
        let option = {
            tooltip: {                                        //4. modest a tooltip
                show: ctrl.panel.label.show,
                textStyle: {
                    fontSize: ctrl.panel.label.fontSize
                },
                position: 'top',
                padding: 5,
                backgroundColor: '#52545c',
                borderColor: '#777',
                borderWidth: 1,
                formatter: function (obj) {
                    var value = obj.value;
                    var fromKey = instances[value[0]];
                    var targetKey = instances[value[1]];
                    var fromInstance = '无';
                    var targetInstance = '无';
                    if (_.has(cache, fromKey) && _.has(cache[fromKey], targetKey)) {
                        fromInstance = cache[fromKey][targetKey]['tags']['from']
                        fromInstance = fromInstance === undefined ? '无' : fromInstance
                        targetInstance = cache[fromKey][targetKey]['tags']['target']
                        targetInstance = targetInstance === undefined ? '无' : targetInstance
                    }
                    return 'Pingmesh: <br>' +
                        '源IP: ' + fromInstance + '<br>' +
                        '目标IP: ' + targetInstance + '<br>' +
                        obj.marker + ' Value: ' + value[2] + '<br>';
                },
            },
            animation: false,
            grid: {
                show: true,
                left: '5%',
                right: '5%',
                top: '5%',
                bottom: '10%'
            },
            xAxis: {
                show: false,
                name: '',
                type: 'category',                            //5.modest the xAxis.
                data: instances,
                nameGap: 50,
                splitArea: {
                    show: true
                },
                // position: 'top',
                nameLocation: 'middle',
                nameTextStyle: {
                    fontSize: 20
                },
                axisLine: {
                    lineStyle: {
                        color: '#aaa'
                    }
                },
                axisLabel: {
                    rotate: 25,
                    color: function (value, index) {
                        return value >= 4 ? 'green' : 'black';
                    }
                }
            },
            yAxis: {
                show: false,
                name: '',                           //5.modest the yAxis.
                type: 'category',
                data: instances,
                splitArea: {
                    show: true
                },
                nameTextStyle: {
                    color: '#aaa',
                    fontSize: 20
                },
                axisLine: {
                    lineStyle: {
                        color: '#aaa'
                    }
                },
                axisLabel: {
                    rotate: 25,
                    color: function (value, index) {
                        return value >= 4 ? 'green' : 'black';
                    }
                }
            },
            visualMap: [
                {
                    type: 'piecewise',
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    bottom: '2%',
                    splitNumber: 3,
                    // borderColor:'#ccc',
                    // borderWidth:1,
                    textStyle: {
                        fontStyle: 'oblique',
                        fontWeight: 'bold'
                    },
                    pieces: [
                        { lte: Number(ctrl.panel.pingmesh.delayValue), label: 'Ping通', color: ctrl.panel.pingmesh.okStatusColor },
                        { gt: Number(ctrl.panel.pingmesh.delayValue), lte: 10000, label: '延时高', color: ctrl.panel.pingmesh.delayStatusColor },
                        { gt: 10000, label: 'Ping失败', color: ctrl.panel.pingmesh.failStatusColor }
                    ],
                    hoverLink: true
                }],
            series: [{
                name: 'Pingmesh',
                type: 'heatmap',
                data: seriesData,
                label: {
                    show: false  // 是否显示当前值
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
        echartPanel.setOption(option, true);
        echartPanel.on('click', e => { window.open(e.data.url) })
        return option
    }

    function pieChartsOptions (echartPanel) {
        let labelOptions;
        let option = {
            tooltip: {
                trigger: 'item',
                formatter: "{a} <br/>{b}: {c} ({d}%)"
            },
            legend: {
                type: 'scroll',
                show: ctrl.panel.legend.show,
                data: []
            },
            series: []
        };

        if (ctrl.panel.legend.position === "top") {
            option.legend.top = 10;
            option.legend.orient = "horizontal";
        } else if (ctrl.panel.legend.position === "bottom") {
            option.legend.bottom = 10;
            option.legend.orient = "horizontal";
        } else if (ctrl.panel.legend.position === "right") {
            option.legend.right = 10;
            option.legend.orient = "vertical";
        }
        let legendData = new Set();
        let maxRadius;
        if (ctrl.panel.label.show) {
            maxRadius = 80;
        } else {
            maxRadius = 100;
        }
        data.series = data.series.slice(0, 5);
        data.series.map((item, i) => {
            let radius = [
                maxRadius * (data.series.length - i - 1) / data.series.length + '%',
                maxRadius * (data.series.length - i) / data.series.length * 0.9 + '%'
            ];
            let itemData = item.data.map(i => {
                legendData.add(i.name);
                return { name: i.name, value: i.value[1] }
            });
            if (i !== 0) {
                labelOptions = {
                    normal: {
                        show: ctrl.panel.label.show,
                        position: 'inner'
                    }
                }
            } else {
                labelOptions = {
                    normal: {
                        show: ctrl.panel.label.show,
                        formatter: '{a|{a}}{abg|}\n{hr|}\n  {b|{b}：}{c}  {per|{d}%}  ',
                        backgroundColor: '#eee',
                        borderColor: '#aaa',
                        borderWidth: 1,
                        borderRadius: 4,
                        rich: {
                            a: {
                                color: '#999',
                                lineHeight: 22,
                                align: 'center'
                            },
                            hr: {
                                borderColor: '#aaa',
                                width: '100%',
                                borderWidth: 0.5,
                                height: 0
                            },
                            b: {
                                fontSize: 16,
                                lineHeight: 33
                            },
                            per: {
                                color: '#eee',
                                backgroundColor: '#334455',
                                padding: [2, 4],
                                borderRadius: 2
                            }
                        }
                    }
                };
            }
            option.series.push({
                name: item.name,
                type: 'pie',
                radius: radius,
                label: labelOptions,
                data: itemData
            })
        });
        option.legend.data = Array.from(legendData);
        return option;
    }

    function barChartsOptions (echartPanel) {
        let option;

        let labelOption = {
            normal: {
                position: 'insideBottom',
                distance: 15,
                align: 'left',
                verticalAlign: 'middle',
                rotate: 90,
                formatter: '{c}  {a}',
                fontSize: 12,
                rich: {
                    name: {
                        textBorderColor: '#fff'
                    }
                }
            }
        };
        if (ctrl.panel.show.label) {
            labelOption.normal.show = ctrl.panel.label.show
        }
        console.log(data.textColor);
        option = {
            color: data.color,
            legend: {
                type: 'scroll',
                show: ctrl.panel.legend.show,
                textStyle: {
                    color: data.textColor
                }
            },
            tooltip: { // 图例
                trigger: 'axis',
                show: ctrl.panel.tooltip.show,
                axisPointer: {
                    type: 'shadow'
                }
            },
            calculable: true,
            xAxis: [
                {
                    type: 'category',
                    axisTick: { show: false },
                    data: data.metrics,
                    axisLabel: {
                        color: data.textColor,
                        rotate: ctrl.panel.xlabel.rotate
                    },
                    nameTextStyle: {
                        color: data.textColor,
                    },
                    axisLine: { lineStyle: { color: "#999" } },
                    splitLine: { lineStyle: { color: "#999" } },
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    axisLabel: { color: data.textColor },
                    nameTextStyle: { color: data.textColor },
                    axisLine: { lineStyle: { color: "#999" } },
                    splitLine: { lineStyle: { color: "#999" } },
                }
            ],
            grid: [{ "borderColor": "#F00", show: false },],
            series: []
        };
        if (data.type) {
            option.xAxis[0].type = data.type;
        }
        if (ctrl.panel.legend.position === "top") {
            option.legend.top = 10;
            option.legend.orient = "horizontal";
        } else if (ctrl.panel.legend.position === "bottom") {
            option.legend.bottom = 10;
            option.legend.orient = "horizontal";
        } else if (ctrl.panel.legend.position === "right") {
            option.legend.right = 10;
            option.legend.orient = "vertical";
        }

        data.series.map(item => {
            option.series.push({
                name: item.name,
                stack: ctrl.panel.stack,
                type: ctrl.panel.chartsType,
                label: labelOption,

                showSymbol: false,
                hoverAnimation: false,
                data: item.data
            })
        });
        return option;
    }

    function render (incrementRenderCounter) {
        if (!ctrl.data) {
            return;
        }
        data = ctrl.data;
        if (0 === ctrl.data.length) {
            noDataPoints();
        } else {
            addecharts();
        }
        if (incrementRenderCounter) {
            ctrl.renderingCompleted();
        }
    }
}

