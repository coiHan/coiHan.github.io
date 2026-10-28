# coiHan · 个人太阳系

在线主页：[coihan.github.io](https://coihan.github.io/)。

首页以柔和的动漫星系为主要画面。桌面端通过星球进入独立页面；手机端展示当前选中的星球，可用按钮或轻扫切换，再进入对应维度。星球只标注个人维度：

| 个人维度 | 页面 | 内容 |
| --- | --- | --- |
| 关于我 | `/worlds/about.html` | 韩广路 / Jack，山东大学人工智能研一，研究兴趣为具身智能 |
| 兴趣与好奇 | `/worlds/curiosity.html` | 从问题和不同视角出发 |
| 生活影像 | `/worlds/interests.html` | 旧站影像素材 |
| 项目 | `/worlds/projects.html` | [philome](https://coihan.github.io/philome/)，64题、8维、20位思想家 |
| 研究方向 | `/worlds/research.html` | 具身智能与想进一步理解的问题 |
| 想法实验室 | `/worlds/lab.html` | 留给未来的小想法和原型 |
| 成长轨迹 | `/worlds/growth.html` | 当前学习阶段和接下来的方向 |
| 联系我 | `/worlds/contact.html` | 用户确认的公开邮箱与 GitHub |

星球点击后有聚焦过渡，再进入对应页面。八个详情页都支持直接访问与返回，减少动态偏好下提供简化效果。生活影像支持放大浏览，联系页支持复制邮箱。

当前星球由 Three.js 几何体、程序图案与柔和材质在代码中生成，首页不再加载旧版天文照片贴图。体量、间距与运动服务于导航和视觉构图，采用插画式表达。当前画面与旧版素材的来源分别列在 [素材与致谢](https://coihan.github.io/credits.html)。

## 静态部署

网站使用静态 HTML、CSS、JavaScript 与本地托管的 Three.js，可直接部署到 GitHub Pages，不需要后台、数据库或额外服务器。页面、脚本、照片与渲染库都随站点托管，不依赖外部 CDN。链接按 `https://coihan.github.io/` 的站点根目录设置。

联系邮箱：guangluhan686@gmail.com；GitHub：[coiHan](https://github.com/coiHan)。

## 内容与素材

个人信息来自本人明确确认：韩广路 / Jack，山东大学人工智能研一，当前研究兴趣为具身智能。项目展示以已有的 philome 为主；想法实验室与成长轨迹记录正在探索的方向。未添加未经本人确认的论文、奖项或研究成果，也没有沿用旧模板中的工作经历、技能评分、地址、手机号或虚构文章，没有添加笔记栏目。

三张照片沿用已有仓库素材，保留原构图并转成 WebP；仅按画面描述，不添加拍摄者、地点或日期：

| 新资源 | 旧资源 |
| --- | --- |
| `assets/photos/city-view.webp` | `images/gallery/p3.jpg` |
| `assets/photos/green-path.webp` | `images/gallery/p6.jpg` |
| `assets/photos/night-walk.webp` | `images/resource/blog3.jpg` |

旧版天文贴图仍保留在 `assets/textures/` 作为历史素材，其 Solar System Scope / INOVE 署名与 CC BY 4.0 许可保留在素材说明中。Three.js 的 MIT 许可保存在 `assets/vendor/three.LICENSE.txt`。

philome 位于独立子目录，旧 `/philosophy-portrait/` 地址会跳转到 `/philome/`。题库与人物审查记录见 [philome 项目说明](https://github.com/coiHan/coiHan.github.io/tree/main/philome)。
