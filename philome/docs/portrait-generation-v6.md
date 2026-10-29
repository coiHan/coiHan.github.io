# philome v6 新增人物插画

2026-10-29，使用内置 `image_gen`（非 CLI/API）分别生成约翰·斯图亚特·密尔与约翰·洛克的透明背景人物插画。沿用既有彩色人物半身、深色轮廓与暖色面部明暗的视觉语言；现有人物只用于观察风格，没有改动原有插画。

## 原始生成资源

- `portraits/mill.png`：1254 × 1254，1,791,957 字节，透明 PNG。
- `portraits/locke.png`：1254 × 1254，1,775,469 字节，透明 PNG。

源输出保留于 Codex 生成目录，已复制到项目，页面不依赖该生成目录。未对生成图做像素级二次编辑。构图和人物特征经逐张目视检查；历史人物为风格化插画，不是史料照片。

## 网页发布资源

保留原始像素尺寸，将两张插画编码为 WebP（quality 93、method 6、exact alpha），不更改构图或内容。逐像素核对透明通道与源PNG一致。页面引用以下轻量版本，原PNG在本地保留。

- `portraits/mill.webp`：1254 × 1254，317,210 字节。
- `portraits/locke.webp`：1254 × 1254，283,892 字节。

## 密尔的最终提示词

```text
Use case: illustration-story. Asset type: philosopher portrait cutout for the philome website, matching an existing set of polished colorful cartoon philosopher busts with crisp dark outlines, warm softly cel-shaded faces, expressive thoughtful eyes and realistically stylized historical likenesses.
Primary request: a single portrait of John Stuart Mill (1806–1873), the nineteenth-century English philosopher, recognizable older middle-aged man with a high balding forehead, short grey-brown hair at the sides, substantial grey mutton-chop sideburns extending down the cheeks, clean-shaven chin, long narrow nose, serious thoughtful eyes. Period dark navy/charcoal Victorian coat, white shirt, restrained black cravat.
Composition: centered head-and-shoulders bust, face turned slightly three quarters toward viewer's left, eye contact, complete uncropped head and shoulders, oval curved lower crop at chest like a polished collectible portrait sticker. Head and bust fill around 90 percent of square canvas. Clean editorial cartoon illustration, detailed hair and cloth folds, subtle paperless brush shading, no photorealism, no 3D.
Scene/backdrop: genuinely transparent background, clean alpha around silhouette. No colored circle, no frame, no border around canvas, no text, no labels, no signature, no watermark. Do not include another character. Square image, moderate resolution suitable for a website asset.
```

## 洛克的最终提示词

```text
Use case: illustration-story. Asset type: philosopher portrait cutout for the philome website, matching an existing set of polished colorful cartoon philosopher busts with crisp dark outlines, warm softly cel-shaded faces, expressive thoughtful eyes and realistically stylized historical likenesses.
Primary request: a single portrait of John Locke (1632–1704), the English philosopher, recognizable mature man with a long lean face, high broad forehead, long wavy medium-brown hair falling to shoulders with some grey strands, thin arched brows, long prominent slightly hooked nose, deep-set attentive brown eyes, clean-shaven face, no moustache or beard. A seventeenth-century olive-brown draped coat and plain white open linen collar, historically plausible scholar.
Composition: centered head-and-shoulders bust, face turned slightly three quarters toward viewer's right, eye contact, complete uncropped head and shoulders, oval curved lower crop at chest like a polished collectible portrait sticker. Head and bust fill around 90 percent of square canvas. Clean editorial cartoon illustration, detailed hair and cloth folds, subtle paperless brush shading, no photorealism, no 3D.
Scene/backdrop: genuinely transparent background, clean alpha around silhouette. No colored circle, no frame, no border around canvas, no text, no labels, no signature, no watermark. Do not include another character. Square image, moderate resolution suitable for a website asset.
```
