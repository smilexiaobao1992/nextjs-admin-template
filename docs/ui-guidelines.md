# UI guidelines

## 1. Visual theme

这是工具型后台，不是营销页。默认采用石墨侧栏、暖色工作区和珊瑚强调色；深色模式跟随系统偏好。装饰背景、渐变标题和无意义数据默认禁用。

## 2. Color roles

颜色集中定义在 `src/app/globals.css`，使用 OKLCH。`background` 是暖色工作区，`card` 是内容面，`sidebar` 系列负责石墨导航，`primary` 珊瑚色只用于当前导航和主要操作。`destructive`、成功和警告保留独立语义，不要复用品牌色。不要在组件内另建灰色或蓝色体系。

## 3. Typography

- 正文使用 Geist Sans，代码和标识符使用 Geist Mono。
- 页面标题为 30 到 36px，字距 `-0.022em`。
- 区块标题为 18 到 20px，字距 `-0.012em`。
- 正文默认 14 到 16px；表格数字、日期和计数使用 `tabular-nums`。
- 短标题使用 `text-balance`，说明文字使用 `text-pretty`。

## 4. Components

- 圆角只使用 6、8、12、16px 四档。
- 按钮与输入框最小高度 40px，交互目标不小于 40 x 40px。
- 卡片只用于需要独立边界的表单或数据组；普通说明优先使用无卡片结构。面板使用背景阶差和一组分层阴影，不要让每个区块都同时出现边框与阴影。
- 按钮按下使用轻微 `scale(0.95)`，其他状态只改变颜色、背景或边框。
- 表单必须提供可见 label、name、autocomplete、服务端校验和可读错误。
- 下拉框使用 `components/ui/select`，高度、边框和 focus 环与 `Input` 一致，不要在页面里手写一套原生样式。
- Server Action 提交按钮使用 `components/ui/submit-button`，展示 pending 状态；列表为空时提供 empty state 与下一步操作提示。

## 5. Layout

页面容器最大宽度为 `max-w-7xl`。移动端左右 16px，平板 24px，桌面 32px。页面主要区块使用 32px 垂直间距，表单字段使用 16px。外层 padding 与内部主要 gap 优先使用同一档位。

## 6. Depth

侧栏、工作区和内容面至少有 4% 明度差。侧栏主要靠石墨色与工作区分层，内容面可以使用一组轻量分层阴影，但不得把阴影叠加在装饰性粗边框上。深色模式通过表面明度阶差表达层级，不依赖黑色投影。

## 7. Do and do not

- 使用语义化 header、nav、main、section 和 table。
- 没有自身路由的菜单分组使用整行 `button` 展开或收起；有自身路由的分组才拆分导航与箭头操作。
- 图标按钮必须有 `aria-label`，装饰图标必须 `aria-hidden`。
- 使用 `focus-visible`，不得删除焦点样式。
- 只动画 transform 和 opacity，不使用 `transition-all`。
- 不展示伪造指标、占位客户或无法操作的菜单。
- 不在全局 CSS 中用 `!important` 修补局部组件。

## 8. Responsive behavior

桌面端侧栏可以收起；移动端使用可关闭 Dialog 导航，不保留固定侧栏。表格放在可横向滚动容器中，长邮箱和标识符使用截断或换行。必须在 375px 和桌面宽度检查无横向页面溢出。

## 9. Accessibility and motion

受保护布局提供“跳到主要内容”链接。错误和操作状态使用 `role=alert` 或 `role=status`。组件必须支持键盘操作；系统启用减少动态效果时，动画与过渡缩短到接近零。
