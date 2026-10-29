# coiHan · 个人网站

一个以三维书桌和复古电脑桌面为入口的个人网站。

在线访问：[coihan.github.io](https://coihan.github.io/)

## 交互效果

- 点击书桌上的物品探索内容，镜头平滑走近电脑并展开复古桌面。
- 鼠标移动时，三维场景随之轻微转动；静止时暂停重复渲染。
- 桌面窗口支持拖动、最小化、最大化和关闭，并适配手机屏幕。
- 支持日夜切换、交互音效、偏好保存，以及键盘操作和减少动态效果。

## 使用的技术

- HTML、CSS 和原生 JavaScript，采用 ES Modules 组织代码。
- Three.js 负责三维渲染，场景物件和纹理由代码生成。
- 静态文件通过 GitHub Pages 托管，无需后台或构建步骤。

## 本地预览

在网站根目录启动静态服务，例如：

```sh
python3 -m http.server 8080
```

然后打开 `http://localhost:8080/`。

## 致谢

空间交互的灵感来自 [Henry Heffernan](https://henryheffernan.com/)。

Three.js 使用 MIT 许可，详见 [许可文件](assets/vendor/three.LICENSE.txt)。
