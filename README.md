# coiHan · 个人太阳系

在线主页：[coihan.github.io](https://coihan.github.io/)。

首页以柔和的动漫星系为主要画面。桌面端通过星球进入独立页面；手机端展示当前选中的星球，可用按钮或轻扫切换，再进入对应维度。星球只标注个人维度：

| 当前入口 | 星球 | 页面 |
| --- | --- | --- |
| 关于我的 | 水星 | `/worlds/about.html` |
| 日常生活 | 金星 | `/worlds/interests.html` |
| 一些项目 | 地球 | `/worlds/projects.html` |
| 取得联系 | 火星 | `/worlds/contact.html` |

木星、土星、天王星与海王星暂不安排内容，点击后进入 `/#jupiter`、`/#saturn`、`/#uranus`、`/#neptune` 空白空间，可返回星系。

星球点击后有简短淡出过渡，再进入对应页面。四个详情页都支持直接访问与返回，减少动态偏好下提供简化效果。日常生活支持放大浏览，联系页支持复制邮箱。

当前首页采用透明 WebP 手绘插画、静态星点画布与 CSS 星云层。太阳在左，前四个个人维度按行星顺序错落展开；尺寸和间距以可读性为主。星球沿以太阳为中心的局部圆轨道缓慢移动，并保留放大保护间距；每个位置预留悬停放大空间，鼠标经过时仅当前星球最多放大 1.22 倍，其他星球和标签保持原尺寸。900px 以下切换为单星球浏览；窗口放大到较窄宽度时自动切布局，避免挤压。

页面点击采用 220ms 的淡出过渡，保留正常链接、键盘和浏览器返回。首页不加载 Three.js，不做每帧三维渲染。地球采用亚洲朝向；“关于我的”的思考卡通头像可在之后替换为生活照。详情页使用灰紫靛蓝星云底色，导航的带环图标有独立槽位。

关于我的采用简历式信息分区；项目页以真实 philome 卡片为主，另有两张明确标记为构思/待探索的预留卡片。philome v4 使用32条简短自我描述与七档同意程度、八种思想关注和20位人物原型；雷达展示本次选择中的相对关注侧重，可保存总结长图。

## 静态部署

网站使用静态 HTML、CSS、JavaScript 与随站点托管的插画，可直接部署到 GitHub Pages，不需要后台、数据库或额外服务器。页面、脚本、照片与渲染库都随站点托管，不依赖外部 CDN。链接按 `https://coihan.github.io/` 的站点根目录设置。

联系邮箱：guangluhan686@gmail.com；GitHub：[coiHan](https://github.com/coiHan)。

## 内容与素材

个人信息来自本人明确确认：韩广路 / Jack，山东大学人工智能研一，当前研究兴趣为具身智能。项目展示以已有的 philome 为主；其余四颗星球暂留空白供以后扩展。未添加未经本人确认的论文、奖项或研究成果，也没有沿用旧模板中的工作经历、技能评分、地址、手机号或虚构文章，没有添加笔记栏目。

三张照片沿用已有仓库素材，保留原构图并转成 WebP；仅按画面描述，不添加拍摄者、地点或日期：

| 新资源 | 旧资源 |
| --- | --- |
| `assets/photos/city-view.webp` | `images/gallery/p3.jpg` |
| `assets/photos/green-path.webp` | `images/gallery/p6.jpg` |
| `assets/photos/night-walk.webp` | `images/resource/blog3.jpg` |

旧版天文贴图仍保留在 `assets/textures/` 作为历史素材，其 Solar System Scope / INOVE 署名与 CC BY 4.0 许可保留在素材说明中。Three.js 的 MIT 许可保存在 `assets/vendor/three.LICENSE.txt`。

philome 位于独立子目录，旧 `/philosophy-portrait/` 地址会跳转到 `/philome/`。题库与人物审查记录见 [philome 项目说明](https://github.com/coiHan/coiHan.github.io/tree/main/philome)。
