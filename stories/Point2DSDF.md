使用 2D SDF 函数绘制点要素。

* 距离场特性决定了描边、边缘反走样、内外阴影效果容易高效实现，完全不需要额外 Pass 绘制边缘
* 每个图形顶点数目始终为 4，完全不需要 CPU 计算正多边形顶点
* 完全可以使用一组通用的 Vertex/Fragment shader 实现全部种类图形的绘制，例如正六边形、正八边形、三角形、菱形、五角星、椭圆甚至是贝塞尔曲线

[完整 2D SDF 函数](http://www.iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm)