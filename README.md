## A custom layer based on Mapbox

基于 Mapbox Custom Layer Interface 开发的一些地理信息可视化 DEMO。
涉及一些 WebGL 渲染技术，在知乎上发表了一系列文章：

[在 WebGL 中绘制地图（多边形篇）](https://zhuanlan.zhihu.com/p/52989166)
[在 WebGL 中绘制直线](https://zhuanlan.zhihu.com/p/59541559)
[在 WebGL 中渲染文字](https://zhuanlan.zhihu.com/p/65421383)
[WebGL 中的顶点数据压缩](https://zhuanlan.zhihu.com/p/67484498)

[解决高缩放等级下的抖动问题](https://zhuanlan.zhihu.com/p/57469121)
[使用数据瓦片展示海量数据](https://zhuanlan.zhihu.com/p/64130041)
[使用 k-d tree 实现点聚合图](https://zhuanlan.zhihu.com/p/64450167)

```bash
npm run start
```

Demo：
* [点分布图](https://xiaoiver.github.io/custom-mapbox-layer/PointCloudLayer2.html)
* [2D 线](https://xiaoiver.github.io/custom-mapbox-layer/LineLayer.html)
* [使用数据瓦片展示线](https://xiaoiver.github.io/custom-mapbox-layer/VectorTileLineLayer.html)
* [使用数据瓦片展示点聚合效果](https://xiaoiver.github.io/custom-mapbox-layer/VectorTileClusterLayer.html)

## TODO

regl 不支持 WebGL2: https://github.com/regl-project/regl/issues/378
