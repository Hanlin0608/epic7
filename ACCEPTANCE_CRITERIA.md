# Acceptance Criteria - Pose Recognition Game

## US 7.1 游戏入口与导航

### AC 7.1.1 访问游戏介绍页
**GIVEN** 用户想要了解游戏玩法和规则  
**WHEN** 用户访问游戏介绍页面（index.html）  
**THEN** 系统显示完整的游戏说明，包括：
- 游戏标题 "How to play?"
- 游戏简介：基于姿态识别的轻量级运动游戏
- "Access & Permission" 部分：摄像头权限说明和环境建议
- "How to Practice?" 部分：包含3个主要功能区域说明和4步练习流程
- "Play mode" 部分：竞技模式说明
- "Ready? Start" 按钮

### AC 7.1.2 进入游戏界面
**GIVEN** 用户已阅读游戏介绍并准备开始游戏  
**WHEN** 用户点击 "Start" 按钮  
**THEN** 系统直接跳转到游戏主界面（game.html），不弹出摄像头权限请求

---

## US 7.2 游戏界面布局

### AC 7.2.1 界面整体布局
**GIVEN** 用户成功进入游戏界面  
**WHEN** 页面加载完成  
**THEN** 系统显示符合以下规格的界面布局：
- 整体采用左右分栏设计，宽度比例为 4:6
- 顶部预留 100px 空间用于未来导航栏
- 四周留有适当边距（padding），避免内容紧贴浏览器边缘
- 采用橙色主题的 Glassmorphism 设计风格

### AC 7.2.2 左侧功能区域
**GIVEN** 用户在游戏界面  
**WHEN** 查看左侧区域  
**THEN** 系统显示以下内容，上下比例为 5:5：
- **上半部分 - Movement Demonstration（动作演示区）**：
  - 标题 "Movement demonstration" 加粗且字体较大
  - 灰色背景的正方形动作演示框
  - 火柴人动画实时演示当前选中的动作
  - 高清渲染（适配高DPI屏幕）
- **下半部分 - Movement Cards（动作卡片区）**：
  - 标题 "Movement cards" 加粗且字体较大
  - 垂直滚动的动作卡片列表
  - 每张卡片包含：
    - 动作名称（顶部，加粗）
    - 灰色背景的正方形动作预览框（包含火柴人动画）
    - 动作提示文字（底部，加粗）
  - 卡片尺寸设计为可以显示"一个半卡片"，提示用户可滑动

### AC 7.2.3 右侧检测区域
**GIVEN** 用户在游戏界面  
**WHEN** 查看右侧区域  
**THEN** 系统显示以下内容：
- 顶部显示 "Detection Area" 标题
- "Please choose movement card" 提示文字
- Fit 百分比显示（位于提示文字右侧）
- 大面积的视频检测区域：
  - 摄像头开启前显示占位文字
  - 摄像头开启后显示实时视频画面
  - 使用 `object-fit: cover` 填充区域，不拉伸画面
  - 实时绘制用户的骨骼点和连接线（33个关键点）
  - 成功完成动作时在中央显示庆祝文字
- 底部显示 "Tip:" 标签
  - 初始状态只显示 "Tip:"
  - 选择卡片后显示该动作的完整提示内容（字体放大加粗）
- 右下角显示音量控制按钮（橙色，较大且醒目）

---

## US 7.3 首次引导系统

### AC 7.3.1 欢迎弹窗
**GIVEN** 用户首次进入游戏界面  
**WHEN** 页面加载完成（localStorage 中无 "welcomed" 标记）  
**THEN** 系统显示欢迎弹窗：
- 半透明黑色遮罩背景（opacity: 0.45）
- 弹窗内容："Hello, beautiful soul! Welcome! Allow me to give you a brief introduction."
- 右下角显示 "Go!" 按钮（橙色渐变设计）
- 用户点击 "Go!" 后关闭弹窗，localStorage 保存 "welcomed" 状态

### AC 7.3.2 Movement Cards 引导（第1步）
**GIVEN** 用户关闭欢迎弹窗  
**WHEN** 欢迎弹窗关闭且 localStorage 中无 "guideCompleted" 标记  
**THEN** 系统显示 Movement Cards 引导：
- 半透明黑色遮罩背景（opacity: 0.45）
- 左侧 Movement Cards 区域高亮显示（聚光灯效果）
- 弹窗内容："Practice makes perfect! First, let's pick the matching card and start our practice~"
- 右下角显示 "Next!" 按钮

### AC 7.3.3 Movement Demonstration 引导（第2步）
**GIVEN** 用户点击第1步的 "Next!" 按钮  
**WHEN** 第1步引导关闭  
**THEN** 系统显示 Movement Demonstration 引导：
- 左上方 Movement Demonstration 区域高亮显示
- 弹窗内容："Your reference is right here~ Try to match the moves! You're the best!"
- 右下角显示 "Next!" 按钮

### AC 7.3.4 Detection Area 引导（第3步）
**GIVEN** 用户点击第2步的 "Next!" 按钮  
**WHEN** 第2步引导关闭  
**THEN** 系统显示 Detection Area 引导：
- 右侧 Detection Area 区域高亮显示
- 弹窗内容："Beautiful moments won't be missed! We'll do our best to capture your adorable movement right here!"
- 右下角显示 "Next!" 按钮

### AC 7.3.5 Tip 区域引导（第4步）
**GIVEN** 用户点击第3步的 "Next!" 按钮  
**WHEN** 第3步引导关闭  
**THEN** 系统显示 Tip 区域引导：
- Tip 区域高亮显示
- 弹窗内容："A bit confused? Don't worry! The move tips are right here—check them anytime!"
- 右下角显示 "Next!" 按钮

### AC 7.3.6 Fit 区域引导（第5步）
**GIVEN** 用户点击第4步的 "Next!" 按钮  
**WHEN** 第4步引导关闭  
**THEN** 系统显示 Fit 区域引导：
- Fit 百分比显示区域高亮
- 弹窗内容："Unsure about your accuracy? No need to doubt — the matching rate will reveal the truth!"
- 右下角显示 "Next!" 按钮

### AC 7.3.7 语音按钮引导（第6步）
**GIVEN** 用户点击第5步的 "Next!" 按钮  
**WHEN** 第5步引导关闭  
**THEN** 系统显示语音按钮引导：
- 右下角语音按钮高亮显示
- 弹窗内容："Sound on? If environment allows, keep it — it makes the interaction better!"
- 右下角显示 "Next!" 按钮

### AC 7.3.8 手势控制引导（第7步）
**GIVEN** 用户点击第6步的 "Next!" 按钮  
**WHEN** 第6步引导关闭  
**THEN** 系统再次高亮 Movement Cards 区域并显示引导：
- 弹窗内容："Hands-free magic! No need to move back and forth — just **<span style='font-size: 1.25em; color: #f97316; font-weight: 900;'>place your hands on your shoulders</span>**, and the next card will switch automatically."
- "place your hands on your shoulders" 文字特别放大、加粗、橙色高亮
- 右下角显示 "Next!" 按钮

### AC 7.3.9 Play 按钮引导与摄像头启动（第8步）
**GIVEN** 用户点击第7步的 "Next!" 按钮  
**WHEN** 第7步引导关闭  
**THEN** 系统显示最后一步引导：
- Play 按钮区域高亮显示
- 弹窗内容："Got your confidence up? Once you've defeated all the cards, it's time to kick off the real play!"
- 右下角显示 "Try it !" 按钮
- 用户点击 "Try it !" 后：
  - 系统请求摄像头权限
  - 权限同意后自动开启摄像头
  - 姿态检测模型同步启动
  - localStorage 保存 "guideCompleted" 状态
  - 后续访问不再显示任何引导

---

## US 7.4 摄像头与姿态检测

### AC 7.4.1 摄像头权限请求
**GIVEN** 用户点击最后一步引导的 "Try it !" 按钮  
**WHEN** 系统准备启动摄像头  
**THEN** 浏览器弹出原生摄像头权限请求对话框

### AC 7.4.2 摄像头成功启动
**GIVEN** 用户同意摄像头权限  
**WHEN** 权限授予成功  
**THEN** 系统执行以下操作：
- 在右侧 Detection Area 显示实时视频画面
- 视频使用 `object-fit: cover` 填充区域，使用更大的理想分辨率以获得更广的视角
- 姿态检测模型（MediaPipe Pose Landmarker）同步启动
- 检测循环 `loop()` 开始运行

### AC 7.4.3 实时骨骼点绘制
**GIVEN** 摄像头和姿态检测模型已启动  
**WHEN** 系统检测到用户在镜头前  
**THEN** 系统在视频画面上实时绘制：
- 33个关键骨骼点（不同颜色标识不同身体部位）
- 骨骼连接线
- 支持高DPI屏幕的清晰渲染

### AC 7.4.4 摄像头启动失败处理
**GIVEN** 用户拒绝摄像头权限或设备无摄像头  
**WHEN** 摄像头启动失败  
**THEN** 系统在 Detection Area 显示错误提示信息

---

## US 7.5 动作系统

### AC 7.5.1 动作列表加载
**GIVEN** 用户进入游戏界面  
**WHEN** 页面加载完成  
**THEN** 系统显示以下6个动作卡片（从易到难排序）：
1. Overhead Reach（头顶伸展）
2. T Pose（T字姿势）
3. Y Pose（Y字姿势）
4. High Knee Hold（左腿高抬）
5. High Knee Hold (Right)（右腿高抬）
6. Hamstring Hinge（腘绳肌铰链 - 最难）

### AC 7.5.2 选择动作卡片
**GIVEN** 用户处于 Practice 模式  
**WHEN** 用户点击任意动作卡片  
**THEN** 系统执行以下操作：
- 卡片高亮显示（橙色边框）
- 左上方 Movement Demonstration 区域显示该动作的火柴人动画
- 右侧 Detection Area 更新为该动作的检测算法
- Tip 区域显示该动作的完整提示文字
- 如启用语音，播报该动作的语音提示

### AC 7.5.3 动作评估阈值
**GIVEN** 用户正在执行某个动作  
**WHEN** 系统实时评估用户姿态  
**THEN** 系统按以下规则计算 Fit 百分比：
- 使用特定于每个动作的评估算法（角度、距离、对称性等）
- 实时平滑处理（exponential smoothing, beta=0.5）
- Fit 显示更新频率：约每100ms更新一次（10 FPS）
- 采用 50% 旧值 + 50% 新值的平滑算法
- 成功阈值：Fit ≥ 90%

### AC 7.5.4 动作完成判定
**GIVEN** 用户正在执行某个动作  
**WHEN** Fit 达到或超过 90% 并保持 1 秒  
**THEN** 系统执行以下操作：
- 在 Detection Area 中央显示彩色庆祝文字（如 "overhead_reach completed!"）
- 如启用语音，播报庆祝语音
- 庆祝文字显示 2 秒后自动消失
- 计数器重置，可重复完成同一动作

---

## US 7.6 手势控制

### AC 7.6.1 手势识别条件
**GIVEN** 用户处于 Practice 模式且摄像头已启动  
**WHEN** 系统检测到用户姿态  
**THEN** 系统持续监测以下手势：
- **双手搭肩手势**：双手腕的Y坐标均位于对应肩膀Y坐标上方

### AC 7.6.2 手势触发动作切换
**GIVEN** 用户正在使用手势控制  
**WHEN** 用户双手搭肩并保持 1 秒（防抖）  
**THEN** 系统执行以下操作：
- 自动选中下一个动作卡片（循环：最后一个 → 第一个）
- 卡片自动滚动到可视区域
- 切换到该动作的评估算法、动画、提示
- 如启用语音，播报新动作的提示

### AC 7.6.3 Play 模式禁用手势控制
**GIVEN** 用户处于 Play 模式  
**WHEN** 用户尝试使用双手搭肩手势  
**THEN** 系统不响应该手势，确保 Play 模式的动作顺序强制执行

---

## US 7.7 Practice 模式

### AC 7.7.1 默认模式
**GIVEN** 用户进入游戏界面且摄像头已启动  
**WHEN** 未点击 "Play" 按钮  
**THEN** 系统默认处于 Practice 模式，特征如下：
- 可自由选择任意动作卡片
- 可使用手势控制切换动作
- 无评分系统
- 可重复完成同一动作多次
- Fit 显示持续更新

### AC 7.7.2 动作卡片交互
**GIVEN** 用户处于 Practice 模式  
**WHEN** 用户与动作卡片交互  
**THEN** 所有卡片都可点击，无禁用状态

### AC 7.7.3 语音控制
**GIVEN** 用户处于 Practice 模式  
**WHEN** 用户点击右下角的语音按钮  
**THEN** 系统切换语音播报状态：
- 点击关闭：停止所有语音播报
- 点击开启：恢复动作提示和庆祝语音播报
- 按钮图标随状态变化（喇叭/静音图标）

---

## US 7.8 Play 模式

### AC 7.8.1 进入 Play 模式
**GIVEN** 用户已练习并准备进入竞技模式  
**WHEN** 用户点击底部的 "Play" 按钮（橙色渐变设计）  
**THEN** 系统执行以下操作：
- 按钮文字从 "Play" 变为 "Finish"
- 自动选中第一个动作卡片（Overhead Reach）
- 非当前动作的卡片变为禁用状态（灰色，不可点击）
- 隐藏手势控制功能
- 开始记录完成时间
- 在右侧显示 "Score: --" 占位文字

### AC 7.8.2 强制顺序完成
**GIVEN** 用户处于 Play 模式  
**WHEN** 用户尝试与非当前动作的卡片交互  
**THEN** 系统拒绝该操作：
- 卡片不响应点击
- 视觉上显示为禁用状态
- 确保用户必须按固定顺序完成所有动作（1 → 6）

### AC 7.8.3 自动动作切换
**GIVEN** 用户处于 Play 模式  
**WHEN** 用户成功完成当前动作（Fit ≥ 90%，保持 1 秒）  
**THEN** 系统自动执行：
- 显示庆祝文字
- 自动切换到下一个动作
- 下一个动作卡片自动高亮并滚动到可视区域
- 更新对应的动画、提示、评估算法
- 记录该动作的完成质量（用于最终评分）

### AC 7.8.4 评分计算
**GIVEN** 用户处于 Play 模式  
**WHEN** 用户完成所有6个动作  
**THEN** 系统计算最终得分：
- **动作质量分**（85%权重）：
  - 基于每个动作的平均 Fit 百分比
  - 计算方式：`round(avgFit * 1.3 + 15)`（增强+基础分）
  - 最高100分
- **速度分**（15%权重）：
  - 基于总完成时间相对于标准时间的表现
  - 完成越快，得分越高
  - 计算方式：`round(speedFactor * 1.2 + 10)`（增强+基础分）
  - 最高100分
- **最终得分** = `round(0.85 * 动作质量分 + 0.15 * 速度分)`
- 在 Detection Area 中央显示 "Final score: XX"
- 右侧顶部显示 "Score: XX"
- 如启用语音，播报最终得分

### AC 7.8.5 退出 Play 模式
**GIVEN** 用户处于 Play 模式（完成或未完成所有动作）  
**WHEN** 用户点击 "Finish" 按钮  
**THEN** 系统执行以下操作：
- 按钮文字从 "Finish" 变回 "Play"
- 恢复 Practice 模式状态
- 所有动作卡片恢复可点击状态
- 恢复手势控制功能
- 清除评分显示
- 如启用语音，播报 "Session finished"

---

## US 7.9 火柴人动画系统

### AC 7.9.1 高清渲染
**GIVEN** 用户在任何支持高DPI的设备上  
**WHEN** 系统渲染火柴人动画  
**THEN** 动画使用 `window.devicePixelRatio` 进行高清渲染：
- Movement Demonstration 区域的火柴人清晰锐利
- 动作卡片中的火柴人清晰锐利
- 在2倍、3倍屏幕上无模糊

### AC 7.9.2 动画居中
**GIVEN** 系统渲染火柴人动画  
**WHEN** 在任何显示区域（演示区或卡片）  
**THEN** 火柴人动画：
- 垂直和水平居中
- 所有肢体完整显示在框内
- 适当的缩放比例，易于观察

### AC 7.9.3 特定动作动画
**GIVEN** 系统渲染特定动作的火柴人  
**WHEN** 动作为以下类型  
**THEN** 动画符合以下规格：
- **Overhead Reach**：动态动画，双臂上下摆动
- **T Pose**：静态姿势，双臂水平伸展
- **Y Pose**：静态姿势，双臂斜向上45度伸展
- **High Knee Hold (Left)**：静态姿势，左腿抬起（大腿近水平，小腿垂直），双臂完全伸展
- **High Knee Hold (Right)**：静态姿势，右腿抬起（大腿近水平，小腿垂直），双臂完全伸展
- **Hamstring Hinge**：静态姿势，身体前倾约60度，双臂自然下垂，清晰展示保持位置

---

## US 7.10 音频系统

### AC 7.10.1 Web Speech API 支持检测
**GIVEN** 用户设备和浏览器  
**WHEN** 游戏加载  
**THEN** 系统检测 Web Speech API 可用性：
- 如支持，语音按钮正常显示和工作
- 如不支持，语音功能静默失败（不影响游戏）

### AC 7.10.2 语音播报内容
**GIVEN** 语音功能已启用  
**WHEN** 触发以下事件  
**THEN** 系统播报对应内容：
- **选择动作**：播报该动作的英文提示（如 "Let's do this! Lift arms into 'Y', wrists above shoulders; hold"）
- **完成动作**：播报庆祝语音（如 "Y pose completed"）
- **Play 模式完成**：播报最终得分（如 "Final score: 85"）
- **退出 Play 模式**：播报 "Session finished"

### AC 7.10.3 语音按钮控制
**GIVEN** 用户可见语音按钮（右下角，橙色，较大）  
**WHEN** 用户点击语音按钮  
**THEN** 系统切换语音状态：
- **启用 → 禁用**：停止当前播报，后续不再播报
- **禁用 → 启用**：恢复语音播报功能
- 按钮图标更新（喇叭/静音图标）
- 状态持久化到用户设置（localStorage）

---

## US 7.11 性能与优化

### AC 7.11.1 帧率控制
**GIVEN** 姿态检测循环正在运行  
**WHEN** 系统处理每一帧  
**THEN** 系统符合以下性能规格：
- Fit 显示更新频率：约每100ms（10 FPS）
- 姿态数据平滑处理（beta=0.5）
- 画面渲染使用 `requestAnimationFrame`
- 无明显卡顿或延迟

### AC 7.11.2 防抖机制
**GIVEN** 用户使用手势控制  
**WHEN** 系统检测手势  
**THEN** 系统应用1秒防抖：
- 避免误触或快速重复触发
- 用户必须保持手势至少1秒

### AC 7.11.3 缓存策略
**GIVEN** 代码文件更新  
**WHEN** 用户访问游戏  
**THEN** 系统使用版本号控制缓存：
- `main.js` 使用版本号参数（如 `?v=79`）
- 强制浏览器获取最新代码

---

## US 7.12 数据持久化

### AC 7.12.1 用户设置保存
**GIVEN** 用户调整设置（语音开关、保持时长等）  
**WHEN** 设置变更  
**THEN** 系统将设置保存到 localStorage：
- 键名：`pose_demo_settings`
- 内容：JSON 格式的设置对象
- 下次访问自动恢复

### AC 7.12.2 引导完成状态
**GIVEN** 用户完成首次引导  
**WHEN** 点击最后一步的 "Try it !" 按钮  
**THEN** 系统保存以下状态到 localStorage：
- `welcomed`: "true"
- `guideCompleted`: "true"
- 后续访问不再显示引导弹窗，直接进入游戏

---

## US 7.13 响应式设计

### AC 7.13.1 字体自适应
**GIVEN** 用户在不同尺寸的设备上访问  
**WHEN** 页面渲染  
**THEN** 系统使用 `clamp()` 函数实现响应式字体：
- 标题：`clamp(28px, 4vw, 36px)`
- 按钮：`clamp(16px, 2vw, 20px)`
- 确保小屏幕可读，大屏幕不过大

### AC 7.13.2 布局自适应
**GIVEN** 用户调整浏览器窗口大小  
**WHEN** 窗口尺寸变化  
**THEN** 系统保持以下布局特性：
- 左右分栏比例维持 4:6
- 视频区域使用 `object-fit: cover` 避免拉伸变形
- 所有内容在单屏内显示，无需垂直滚动（除了卡片列表）

---

## US 7.14 错误处理

### AC 7.14.1 模型加载失败
**GIVEN** MediaPipe 模型文件无法加载  
**WHEN** 系统尝试初始化姿态检测  
**THEN** 系统在控制台输出错误信息，界面显示友好提示

### AC 7.14.2 摄像头访问失败
**GIVEN** 摄像头权限被拒绝或设备无摄像头  
**WHEN** 系统尝试启动摄像头  
**THEN** 系统在 Detection Area 显示错误提示，不影响页面其他功能

### AC 7.14.3 浏览器不支持
**GIVEN** 用户浏览器不支持必要的 Web API  
**WHEN** 游戏尝试使用这些 API  
**THEN** 系统优雅降级：
- Web Speech API 不支持 → 禁用语音功能，其他功能正常
- MediaPipe 不支持 → 显示浏览器升级提示

---

## US 7.15 可访问性

### AC 7.15.1 键盘导航
**GIVEN** 用户使用键盘操作  
**WHEN** 按 Tab 键导航  
**THEN** 系统确保所有交互元素（按钮、卡片）可通过键盘访问

### AC 7.15.2 视觉反馈
**GIVEN** 用户与界面交互  
**WHEN** 触发任何操作  
**THEN** 系统提供清晰的视觉反馈：
- 按钮悬停：提升阴影、轻微上移
- 卡片选中：橙色边框高亮
- 禁用状态：灰色显示
- 动作完成：彩色庆祝文字

---

## 测试覆盖总结

| 功能模块 | AC 数量 | 优先级 |
|---------|---------|--------|
| 游戏入口与导航 | 2 | P0 |
| 游戏界面布局 | 3 | P0 |
| 首次引导系统 | 9 | P1 |
| 摄像头与姿态检测 | 4 | P0 |
| 动作系统 | 4 | P0 |
| 手势控制 | 3 | P1 |
| Practice 模式 | 3 | P0 |
| Play 模式 | 5 | P0 |
| 火柴人动画系统 | 3 | P1 |
| 音频系统 | 3 | P1 |
| 性能与优化 | 3 | P2 |
| 数据持久化 | 2 | P2 |
| 响应式设计 | 2 | P1 |
| 错误处理 | 3 | P1 |
| 可访问性 | 2 | P2 |
| **总计** | **51** | - |

---

## 附录：动作评估算法说明

每个动作使用独特的评估算法，基于以下维度：

1. **Overhead Reach**：手腕高于肩膀的程度
2. **T Pose**：双臂水平伸展的角度和对称性
3. **Y Pose**：双臂斜向上45度的角度
4. **High Knee Hold**：抬腿高度（大腿近水平）、支撑腿稳定性
5. **Hamstring Hinge**：躯干前倾角度（约60度）、膝盖微弯程度

所有算法输出0-100的分数，≥90分视为成功。

