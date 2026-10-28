# 新增人物插画生成记录

生成日期：2026-10-28。

卢梭、笛卡尔、休谟、卡夫卡四张插画分别通过内置 `image_gen` 工具生成，每个人物使用一次独立调用，未使用 API/CLI 回退。生成时设置 `transparent_background: true`，以项目中的 `portraits/kant.webp` 作为画风参考，要求生成新人物而非修改康德。

## 最终提示词

以下为各次调用使用的完整提示词；参考图路径以项目内相对位置记录。

### 卢梭 · `rousseau.webp`

```text
Use case: stylized-concept. Asset type: one independent transparent portrait illustration for the philome philosophy quiz. Reference image role: use the attached Kant illustration ONLY as the visual style reference; do not depict Kant. Subject: Jean-Jacques Rousseau, recognizable mature eighteenth-century philosopher: long thoughtful face, brown eyes, dark hair at the sides, distinctive dark fur cap and Armenian-style fur-trimmed brown coat over muted green waistcoat, gentle serious expression. Style: match the reference's polished warm editorial cartoon portrait: dark ink contour lines, softly shaded painterly color planes, expressive but respectful recognizable face, softly rounded caricature proportions. Composition: exactly ONE head-and-shoulders bust, centered front-facing or slight three-quarter view, complete top of head and hair, ample transparent margin all around, cutout shoulders with a softly curved complete lower silhouette. Use approximately 80% of a square canvas. TRUE transparent background with alpha; no halo, no circular disc, no scenery, no text, no letters, no labels, no watermark, no border. Preserve period-appropriate clothes. This is a new portrait, not a modification of the Kant subject.
```

### 笛卡尔 · `descartes.webp`

```text
Use case: stylized-concept. Asset type: one independent transparent portrait illustration for the philome philosophy quiz. Reference image role: use the attached Kant illustration ONLY as the visual style reference; do not depict Kant. Subject: René Descartes, recognizable seventeenth-century French philosopher: thoughtful oval face, shoulder-length dark brown wavy hair, thin moustache and small pointed goatee, black seventeenth-century doublet with a broad crisp white falling collar, reserved subtle smile. Style: match the reference's polished warm editorial cartoon portrait: dark ink contour lines, softly shaded painterly color planes, expressive but respectful recognizable face, softly rounded caricature proportions. Composition: exactly ONE head-and-shoulders bust, centered front-facing or slight three-quarter view, complete top of head and hair, ample transparent margin all around, cutout shoulders with a softly curved complete lower silhouette. Use approximately 80% of a square canvas. TRUE transparent background with alpha; no halo, no circular disc, no scenery, no text, no letters, no labels, no watermark, no border. Preserve period-appropriate clothes. This is a new portrait, not a modification of the Kant subject.
```

### 休谟 · `hume.webp`

```text
Use case: stylized-concept. Asset type: one independent transparent portrait illustration for the philome philosophy quiz. Reference image role: use the attached Kant illustration ONLY as the visual style reference; do not depict Kant. Subject: David Hume, recognizable eighteenth-century Scottish philosopher: broad round rosy clean-shaven face, high forehead and dark hair, soft dark scholar's cap with a subdued red band, burgundy eighteenth-century scholar's coat with white neck cloth, warm observant expression. Distinct from Kant and Rousseau. Style: match the reference's polished warm editorial cartoon portrait: dark ink contour lines, softly shaded painterly color planes, expressive but respectful recognizable face, softly rounded caricature proportions. Composition: exactly ONE head-and-shoulders bust, centered front-facing or slight three-quarter view, complete top of head and hair, ample transparent margin all around, cutout shoulders with a softly curved complete lower silhouette. Use approximately 80% of a square canvas. TRUE transparent background with alpha; no halo, no circular disc, no scenery, no text, no letters, no labels, no watermark, no border. Preserve period-appropriate clothes. This is a new portrait, not a modification of the Kant subject.
```

### 卡夫卡 · `kafka.webp`

```text
Use case: stylized-concept. Asset type: one independent transparent portrait illustration for the philome philosophy quiz. Reference image role: use the attached Kant illustration ONLY as the visual style reference; do not depict Kant. Subject: Franz Kafka, recognizable young adult Central European writer around 1910: slender angular clean-shaven face, pronounced ears, short neatly combed dark hair, large dark introspective eyes, dark charcoal suit, white collared shirt and simple dark tie, quietly thoughtful expression. Style: match the reference's polished warm editorial cartoon portrait: dark ink contour lines, softly shaded painterly color planes, expressive but respectful recognizable face, softly rounded caricature proportions. Composition: exactly ONE head-and-shoulders bust, centered front-facing or slight three-quarter view, complete top of head and hair, ample transparent margin all around, cutout shoulders with a softly curved complete lower silhouette. Use approximately 80% of a square canvas. TRUE transparent background with alpha; no halo, no circular disc, no scenery, no text, no letters, no labels, no watermark, no border. Preserve period-appropriate clothes. This is a new portrait, not a modification of the Kant subject.
```

## 机械处理与检查

生成结果为独立的透明 PNG，随后使用 Sharp 做等比例缩放与格式转换：

- 目标尺寸：640 × 640 像素。
- 缩放方式：`fit: 'contain'`，不足部分使用完全透明背景。
- 输出编码：WebP，`quality: 86`、`alphaQuality: 100`、`effort: 5`。
- 保留原始 Alpha 通道，不进行去背、内容重绘或人物拼接。
- 检查四张成品均有 Alpha 通道，透明度覆盖 0–255，头部、头发与肩部轮廓完整，无文字或边框。

| 人物 | 项目文件 | 尺寸 | 文件大小 |
| --- | --- | --- | ---: |
| 卢梭 | `portraits/rousseau.webp` | 640 × 640 | 65,156 字节 |
| 笛卡尔 | `portraits/descartes.webp` | 640 × 640 | 54,428 字节 |
| 休谟 | `portraits/hume.webp` | 640 × 640 | 55,650 字节 |
| 卡夫卡 | `portraits/kafka.webp` | 640 × 640 | 47,310 字节 |
