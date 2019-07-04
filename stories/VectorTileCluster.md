Cluster 实现详见：[使用 k-d tree 实现点聚合图](https://zhuanlan.zhihu.com/p/64450167)

另外包含以下特性：

* SDF 渲染文字，详见 [在 WebGL 中渲染文字](https://zhuanlan.zhihu.com/p/65421383)。勾选 "debug" 选项可以看到左下角生成的 SDF Atlas。
* 基于 SDF 实现 halo 描边，可配置宽度、颜色和模糊半径。
* 文本标注，可配置布局。
* SDF 渲染点的形状，包括圆形、星形、三角形、正六边形等。
* [WebGL 中的顶点数据压缩](https://zhuanlan.zhihu.com/p/67484498)

全部配置项如下，参考 Mapbox 样式标准：

* 叶节点（多种形状）
    * pointColor 点颜色
    * pointRadius 点半径
    * pointOpacity 透明度
    * strokeColor 描边颜色
    * strokeWidth 描边宽度
    * strokeOpacity 描边透明度
* 文字样式
    * fontSize 字号
    * fontColor 字体颜色
    * fontOpacity 字体透明度
    * haloColor 外描边颜色
    * haloWidth 外描边宽度
    * haloBlur 外描边模糊半径
* 文本布局
    * symbolAnchor 锚点位置
    * textSpacing 字符间距
    * textOffset 偏移量