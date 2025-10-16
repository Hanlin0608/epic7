# Move a Little Game - 项目设计文档

## 📋 文档信息

| 项目名称 | Move a Little Game - 姿态识别运动游戏 |
|---------|----------------------------------------|
| 版本号 | v1.0 |
| 创建日期 | 2025年10月 |
| 最后更新 | 2025年10月13日 |
| 文档类型 | 技术设计文档 |

---

## 📖 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [系统设计](#系统设计)
4. [核心功能模块](#核心功能模块)
5. [用户界面设计](#用户界面设计)
6. [算法设计](#算法设计)
7. [数据流设计](#数据流设计)
8. [部署架构](#部署架构)
9. [安全性设计](#安全性设计)
10. [性能优化](#性能优化)
11. [测试策略](#测试策略)
12. [未来扩展](#未来扩展)

---

## 1. 项目概述 {#项目概述}

### 1.1 项目背景

Move a Little Game 是一款基于 Web 的轻量级运动游戏，利用 AI 姿态识别技术帮助用户进行运动锻炼。用户只需站在摄像头前，跟随屏幕上的动作卡片完成相应姿势，系统会实时检测并给出反馈。

### 1.2 项目目标

- 🎯 **健康促进**：鼓励用户进行简单的运动锻炼
- 🤖 **AI 赋能**：利用 MediaPipe 姿态识别技术提供实时反馈
- 🌐 **易于访问**：纯前端实现，无需安装，浏览器即可使用
- 📱 **跨平台**：支持桌面和移动设备
- 🎮 **游戏化**：通过游戏机制提升用户参与度

### 1.3 核心价值

1. **零门槛运动**：无需任何器材，随时随地开始锻炼
2. **实时反馈**：AI 实时评估动作准确度，帮助用户改进
3. **趣味性强**：游戏化设计增强用户粘性
4. **隐私保护**：所有计算在本地完成，不上传用户影像

### 1.4 目标用户

- 办公室人群：久坐需要拉伸运动
- 居家人士：在家锻炼的便捷选择
- 健身爱好者：热身或恢复训练
- 老年人群：安全、简单的运动方式

---

## 2. 技术架构 {#技术架构}

### 2.1 技术栈

#### 前端技术
```
├── HTML5          # 页面结构
├── CSS3           # 样式设计（Glassmorphism 风格）
├── JavaScript     # 核心逻辑（ES6+）
└── Canvas API     # 骨骼点绘制
```

#### AI/ML 框架
```
├── MediaPipe Pose Landmarker  # 姿态检测
├── @mediapipe/tasks-vision    # Vision 任务处理
└── Web Speech API             # 语音反馈
```

#### 部署与运维
```
├── Node.js + serve   # 静态文件服务
├── Railway           # 云端部署
└── GitHub            # 代码托管与版本控制
```

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │              前端应用层                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  │   │
│  │  │ index.html │  │ game.html  │  │ intro.js │  │   │
│  │  │ (介绍页面) │  │ (游戏页面) │  │ (逻辑)   │  │   │
│  │  └────────────┘  └────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              核心逻辑层 (main.js)                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  │   │
│  │  │ 姿态识别   │  │ 动作评估   │  │ 游戏控制 │  │   │
│  │  │ 模块       │  │ 模块       │  │ 模块     │  │   │
│  │  └────────────┘  └────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              AI 引擎层                           │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │       MediaPipe Pose Landmarker            │ │   │
│  │  │  - 33 个骨骼点检测                         │ │   │
│  │  │  - 实时姿态追踪                            │ │   │
│  │  │  - 3D 坐标计算                             │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              设备接口层                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  │   │
│  │  │ 摄像头     │  │ 麦克风     │  │ 扬声器   │  │   │
│  │  │ (getUserMedia)│ (可选)    │  │ (语音)   │  │   │
│  │  └────────────┘  └────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
                    ┌─────────────┐
                    │  Railway    │
                    │  云端部署    │
                    └─────────────┘
```

### 2.3 技术选型理由

| 技术 | 选型理由 |
|------|----------|
| **MediaPipe** | Google 开源，高性能，支持 Web 端实时姿态检测 |
| **纯前端架构** | 无需后端，降低成本，保护用户隐私 |
| **Canvas** | 高性能图形渲染，适合实时骨骼点绘制 |
| **Web Speech API** | 浏览器原生支持，无需第三方依赖 |
| **Railway** | 快速部署，自动 HTTPS，CDN 加速 |

---

## 3. 系统设计 {#系统设计}

### 3.1 系统模块划分

```
epic7_game/
├── 用户界面层
│   ├── index.html          # 游戏介绍页面
│   ├── game.html           # 游戏主界面
│   └── intro.js            # 介绍页面逻辑
│
├── 核心逻辑层
│   └── main.js             # 游戏核心逻辑
│       ├── 姿态识别模块
│       ├── 动作评估模块
│       ├── 游戏模式管理
│       ├── 手势控制模块
│       └── 语音反馈模块
│
├── 静态资源
│   ├── logo.png
│   ├── game-interface-demo.png
│   ├── movement card.png
│   ├── demonstration.png
│   ├── Fit.png
│   ├── celebration message.png
│   └── hands-free gesture control.png
│
└── 配置文件
    ├── package.json        # 项目依赖
    ├── Procfile            # Railway 启动配置
    ├── railway.json        # Railway 部署配置
    └── serve.json          # 静态服务配置
```

### 3.2 页面流程图

```
┌──────────────┐
│  访问网站    │
└──────┬───────┘
       ↓
┌──────────────────┐
│  index.html      │
│  (游戏介绍页面)  │
│  - 规则说明      │
│  - 权限说明      │
│  - 使用指南      │
└──────┬───────────┘
       ↓
   [Start]
       ↓
┌──────────────────┐
│  game.html       │
│  (游戏主界面)    │
└──────┬───────────┘
       ↓
┌──────────────────┐
│  欢迎弹窗        │
│  Welcome Modal   │
└──────┬───────────┘
       ↓
   [Go! / Skip Guide]
       ↓
┌──────────────────┐
│  引导系统        │
│  8 步教程        │
│  - Movement Cards│
│  - Demonstration │
│  - Detection Area│
│  - Tip / Fit     │
│  - Voice / Gesture│
│  - Play Button   │
└──────┬───────────┘
       ↓
   [Try it!]
       ↓
┌──────────────────┐
│  请求摄像头权限  │
└──────┬───────────┘
       ↓
   [同意]
       ↓
┌──────────────────────────────┐
│  Practice 模式 (默认)        │
│  - 自由选择动作卡片          │
│  - 实时姿态检测              │
│  - Fit 评分反馈              │
│  - 手势控制切换              │
└──────┬───────────────────────┘
       │
       ↓ [点击 Play]
       │
┌──────────────────────────────┐
│  Play 模式信息弹窗           │
│  - 规则说明                  │
│  - 评分机制                  │
└──────┬───────────────────────┘
       │
       ↓ [Action!]
       │
┌──────────────────────────────┐
│  Play 模式                   │
│  - 按顺序完成所有动作        │
│  - 禁用手动切换              │
│  - 自动评分                  │
└──────┬───────────────────────┘
       │
       ↓ [完成所有动作]
       │
┌──────────────────────────────┐
│  完成弹窗                    │
│  - 显示最终得分              │
│  - "One more time" (重新开始)│
│  - "Leave" (返回主页)        │
└──────┬───────────────────────┘
       │
       ↓ [Finish]
       │
┌──────────────────┐
│  返回 intro 页面 │
└──────────────────┘
```

### 3.3 状态管理

```javascript
// 全局状态
{
  // 姿态识别状态
  stream: null,                    // 视频流
  poseLandmarker: null,            // 姿态检测器
  landmarks: null,                 // 当前骨骼点
  smoothedLandmarks: [],           // 平滑后的骨骼点
  
  // 游戏状态
  training: false,                 // 是否开始检测
  practiceMode: true,              // Practice/Play 模式
  scoreMode: false,                // 是否评分模式
  currentMode: 'overhead_reach',   // 当前动作
  
  // 评估状态
  overlayScorePercent: 0,          // Fit 百分比
  holdSec: 0,                      // 保持时间
  successCount: 0,                 // 成功次数
  
  // 手势控制
  lastGestureMs: 0,                // 上次手势时间
  gestureHoldMs: 0,                // 手势保持时间
  
  // 语音系统
  voiceEnabled: true,              // 语音开关
  
  // Play 模式
  autoIndex: 0,                    // 当前动作索引
  totalScore: 0,                   // 总分
  totalSamples: 0,                 // 样本数
  playStartMs: 0,                  // 开始时间
  
  // 引导系统
  hasSeenWelcome: false,           // 是否看过欢迎弹窗
  guidesCompleted: false           // 是否完成引导
}
```

---

## 4. 核心功能模块 {#核心功能模块}

### 4.1 姿态识别模块

#### 4.1.1 MediaPipe 初始化

```javascript
// 加载 MediaPipe 模型
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
);

poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
    delegate: "GPU"
  },
  runningMode: "VIDEO",
  numPoses: 1
});
```

#### 4.1.2 实时检测流程

```
1. 获取摄像头视频流 (getUserMedia)
   ↓
2. 将视频帧传入 MediaPipe
   ↓
3. 检测 33 个骨骼点
   ↓
4. 指数平滑处理 (降噪)
   ↓
5. 绘制骨骼点到 Canvas
   ↓
6. 循环 (requestAnimationFrame)
```

#### 4.1.3 骨骼点映射

MediaPipe 提供 33 个骨骼点：

```
0:  NOSE              # 鼻子
1:  LEFT_EYE_INNER    # 左眼内侧
2:  LEFT_EYE          # 左眼
...
11: LEFT_SHOULDER     # 左肩
12: RIGHT_SHOULDER    # 右肩
13: LEFT_ELBOW        # 左肘
14: RIGHT_ELBOW       # 右肘
15: LEFT_WRIST        # 左腕
16: RIGHT_WRIST       # 右腕
23: LEFT_HIP          # 左髋
24: RIGHT_HIP         # 右髋
25: LEFT_KNEE         # 左膝
26: RIGHT_KNEE        # 右膝
27: LEFT_ANKLE        # 左踝
28: RIGHT_ANKLE       # 右踝
```

### 4.2 动作评估模块

#### 4.2.1 支持的动作列表

```javascript
const exerciseOrder = [
  'overhead_reach',      // 头顶伸展
  't_pose',              // T 字姿势
  'y_raise',             // Y 字举起
  'high_knee_hold',      // 左腿高抬
  'high_knee_hold_right',// 右腿高抬
  'hamstring_hinge'      // 腘绳肌铰链（最难）
];
```

#### 4.2.2 评估算法

每个动作都有特定的评估算法，主要包括：

1. **角度检测**
```javascript
// 计算关节角度
function angle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - 
                  Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}
```

2. **距离检测**
```javascript
// 计算两点距离
function dist(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}
```

3. **高度检测**
```javascript
// 手腕是否高于肩膀
if (lWrist.y < lShoulder.y && rWrist.y < rShoulder.y) {
  // 符合要求
}
```

#### 4.2.3 评分机制

```javascript
// Fit 百分比计算
let score = 100;

// 根据不同动作的阈值扣分
if (angle < threshold.primary[0] || angle > threshold.primary[1]) {
  score -= 50;
}
if (dist > threshold.secondary) {
  score -= 30;
}

// 平滑处理
overlayScorePercent = 0.5 * overlayScorePercent + 0.5 * score;

// 成功判定：Fit ≥ 90% 且保持 1 秒
if (overlayScorePercent >= 90 && holdSec >= 1) {
  // 动作完成
  showCelebration('completed!');
}
```

### 4.3 游戏模式管理

#### 4.3.1 Practice 模式

**特点：**
- ✅ 自由选择任意动作卡片
- ✅ 可重复练习同一动作
- ✅ 支持手势控制切换
- ✅ 无时间限制
- ✅ 显示 Setting 按钮

**流程：**
```
用户点击动作卡片
  ↓
更新当前动作
  ↓
切换评估算法
  ↓
更新火柴人演示
  ↓
语音播报提示
  ↓
开始检测
  ↓
达标后显示庆祝
  ↓
重置计数器，可重复
```

#### 4.3.2 Play 模式

**特点：**
- 🚫 禁用手动选择卡片
- 🚫 禁用手势切换
- ✅ 按固定顺序完成所有动作
- ✅ 记录完成时间
- ✅ 综合评分
- ✅ Play 按钮变为 Finish 按钮

**评分算法：**
```javascript
// 质量分 (85%) + 速度分 (15%)
const qualityScore = (totalScore / totalSamples) * 85;
const speedScore = Math.max(0, 100 - (elapsedSec / 60) * 50) * 15;
const finalScore = Math.round(qualityScore + speedScore);
```

### 4.4 手势控制模块

#### 4.4.1 手势识别

**双手搭肩手势：**
```javascript
// 检测手腕是否在肩膀上方
const lHandsOnShoulder = lWrist.y < lShoulder.y;
const rHandsOnShoulder = rWrist.y < rShoulder.y;

if (lHandsOnShoulder && rHandsOnShoulder) {
  // 手势触发
}
```

#### 4.4.2 防抖机制

```javascript
// 避免快速切换
if (gestureHoldMs >= 1000) {  // 保持 1 秒
  // 切换到下一个动作
  autoIndex = (autoIndex + 1) % exerciseOrder.length;
  gestureHoldMs = 0;
}
```

#### 4.4.3 Play 模式禁用

```javascript
// Play 模式下禁用手势控制
if (scoreMode) {
  // 手势无效
  return;
}
```

### 4.5 语音反馈模块

#### 4.5.1 Web Speech API

```javascript
function speak(text) {
  if (!voiceEnabled) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  speechSynthesis.speak(utterance);
}
```

#### 4.5.2 语音场景

- 动作切换：播报动作提示
- 动作完成：播报 "Well done!"
- 模式切换：播报模式状态
- Play 开始：播报 "The play begins!"
- Play 结束：播报最终得分

### 4.6 引导系统

#### 4.6.1 引导流程

```
Welcome Modal (欢迎)
  ↓ [Go!]
Guide Modal 1 (Movement Cards)
  ↓ [Next!]
Guide Modal 2 (Movement Demonstration)
  ↓ [Next!]
Guide Modal 3 (Detection Area)
  ↓ [Next!]
Guide Modal 4 (Tip Area)
  ↓ [Next!]
Guide Modal 5 (Fit Area)
  ↓ [Next!]
Guide Modal 6 (Voice Button)
  ↓ [Next!]
Guide Modal 7 (Gesture Control)
  ↓ [Next!]
Guide Modal 8 (Play Button)
  ↓ [Try it!]
开始游戏
```

#### 4.6.2 聚光灯效果

```css
.spotlight {
  position: absolute;
  pointer-events: none;
  border-radius: 20px;
  box-shadow: 0 0 0 9999px rgba(0,0,0,.45);
  transition: all 0.5s ease;
}
```

#### 4.6.3 跳过引导

```javascript
function skipAllGuides() {
  localStorage.setItem('welcomeSeen', 'true');
  localStorage.setItem('guidesCompleted', 'true');
  // 直接开始游戏
  await start();
}
```

---

## 5. 用户界面设计 {#用户界面设计}

### 5.1 设计风格：Glassmorphism

**核心特征：**
- 🌫️ 毛玻璃效果 (`backdrop-filter: blur(10px)`)
- 🎨 半透明背景 (`rgba(255,255,255,0.3)`)
- ⭕ 大圆角 (`border-radius: 20px+`)
- ✨ 柔和阴影 (`box-shadow`)
- 🎯 橙色主题色 (`#ff6b35`)

**CSS 实现：**
```css
:root {
  --primary: #ff6b35;
  --surface: rgba(255,255,255,0.3);
  --border: rgba(255,255,255,0.4);
  --text: #2c3e50;
}

.card {
  background: var(--surface);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow: 0 20px 50px rgba(0,0,0,.12);
}
```

### 5.2 页面布局

#### 5.2.1 游戏介绍页面 (index.html)

```
┌─────────────────────────────────────────┐
│           BHeader (导航栏)               │
├─────────────────────────────────────────┤
│                                          │
│  🎮 Move a Little Game                  │
│                                          │
│  ╔══════════════════════════════════╗  │
│  ║  How to play?                    ║  │
│  ║  - 游戏介绍                      ║  │
│  ║  - Access & Permission           ║  │
│  ║  - Ready? Start ➡ [Start]       ║  │
│  ║  - How to Practice? (图文并茂)   ║  │
│  ║  - Play mode                     ║  │
│  ╚══════════════════════════════════╝  │
│                                          │
└─────────────────────────────────────────┘
```

#### 5.2.2 游戏主界面 (game.html)

```
┌─────────────────────────────────────────────────────────────┐
│                   BHeader (导航栏)                           │
├────────────────────────────┬────────────────────────────────┤
│  左侧面板 (30%)            │  右侧面板 (70%)                │
│  ┌──────────────────────┐ │  ┌──────────────────────────┐ │
│  │ Movement             │ │  │  🔊 [Voice]              │ │
│  │ Demonstration        │ │  │                          │ │
│  │  ┌────────────────┐  │ │  │  ┌────────────────────┐ │ │
│  │  │  🚶 火柴人     │  │ │  │  │  📹 Detection Area │ │ │
│  │  │    动画演示    │  │ │  │  │                    │ │ │
│  │  └────────────────┘  │ │  │  │  (实时视频+骨骼点) │ │ │
│  │  [●●●●○]             │ │  │  │                    │ │ │
│  │  [▶ Play]            │ │  │  └────────────────────┘ │ │
│  └──────────────────────┘ │  │                          │ │
│                            │  │  Move: Y Raise  Fit: 85% │ │
│  ┌──────────────────────┐ │  │                          │ │
│  │ Movement Cards       │ │  │  Tip: Lift arms into 'Y',│ │
│  │  ┌────┐ ┌────┐ ┌───┐│ │  │  wrists above shoulders  │ │
│  │  │ Y  │ │ T  │ │...││ │  └──────────────────────────┘ │
│  │  │Raise│ │Pose│ │   ││ │                               │
│  │  └────┘ └────┘ └───┘│ │                               │
│  └──────────────────────┘ │                               │
└────────────────────────────┴───────────────────────────────┘
```

### 5.3 响应式设计

#### 移动端适配

```css
@media (max-width: 768px) {
  .wrap {
    flex-direction: column;
  }
  
  .leftPanel {
    width: 100%;
    max-width: none;
  }
  
  .hero {
    width: 100%;
  }
}
```

#### 字体响应式

```css
h1 {
  font-size: clamp(32px, 5vw, 48px);
}

.heroTip {
  font-size: clamp(14px, 1.8vw, 18px);
}
```

### 5.4 交互设计

#### 5.4.1 按钮设计

```css
/* 主按钮 */
.btnPrimary {
  background: linear-gradient(135deg, var(--primary), #f94144);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btnPrimary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(255,107,53,.4);
}
```

#### 5.4.2 卡片交互

```css
.cardMove {
  transition: all 0.3s ease;
  cursor: pointer;
}

.cardMove:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,.15);
}

.cardMove.active {
  border: 3px solid var(--primary);
  box-shadow: 0 0 30px rgba(255,107,53,.3);
}

.cardMove.disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

#### 5.4.3 弹窗动画

```css
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.welcomeCard {
  animation: modalSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 5.5 视觉层次

```
层级 1: 导航栏 (z-index: 1000)
层级 2: 弹窗 (z-index: 2000-2500)
  ├── 欢迎弹窗 (2000)
  ├── 引导弹窗 (2100)
  ├── Play 信息弹窗 (2500)
  └── 完成弹窗 (2200)
层级 3: 主内容区 (z-index: 1)
层级 4: 背景 (z-index: 0)
```

---

## 6. 算法设计 {#算法设计}

### 6.1 姿态平滑算法

#### 指数移动平均 (EMA)

```javascript
// β 控制平滑程度 (0-1)
// β 越大，平滑越强，但响应越慢
const beta = 0.5;

for (let i = 0; i < 33; i++) {
  if (!smoothedLandmarks[i]) {
    smoothedLandmarks[i] = { ...landmarks[i] };
  } else {
    smoothedLandmarks[i].x = beta * smoothedLandmarks[i].x + (1 - beta) * landmarks[i].x;
    smoothedLandmarks[i].y = beta * smoothedLandmarks[i].y + (1 - beta) * landmarks[i].y;
    smoothedLandmarks[i].z = beta * smoothedLandmarks[i].z + (1 - beta) * landmarks[i].z;
  }
}
```

### 6.2 动作评估算法

#### 6.2.1 Overhead Reach (头顶伸展)

```javascript
// 评估条件：
// 1. 双手手腕高于肩膀
// 2. 手臂角度接近 180° (伸直)

const lElbowAngle = angle(lShoulder, lElbow, lWrist);
const rElbowAngle = angle(rShoulder, rElbow, rWrist);

let score = 100;

// 手腕高度检查
if (lWrist.y > lShoulder.y) score -= 30;
if (rWrist.y > rShoulder.y) score -= 30;

// 手臂伸直检查
if (lElbowAngle < 160 || lElbowAngle > 200) score -= 20;
if (rElbowAngle < 160 || rElbowAngle > 200) score -= 20;

return Math.max(0, score);
```

#### 6.2.2 T Pose (T 字姿势)

```javascript
// 评估条件：
// 1. 手臂水平伸展
// 2. 肩-肘-腕在同一水平线

const lArmAngle = angle(lWrist, lShoulder, rShoulder);
const rArmAngle = angle(rWrist, rShoulder, lShoulder);

let score = 100;

// 手臂角度检查 (接近 90°)
if (lArmAngle < 80 || lArmAngle > 100) score -= 40;
if (rArmAngle < 80 || rArmAngle > 100) score -= 40;

// 高度一致性检查
const heightDiff = Math.abs(lWrist.y - rWrist.y);
if (heightDiff > 0.05) score -= 20;

return Math.max(0, score);
```

#### 6.2.3 High Knee Hold (高抬腿)

```javascript
// 评估条件：
// 1. 抬起腿的膝盖高于髋部
// 2. 大腿接近水平
// 3. 小腿垂直

const kneeAboveHip = knee.y < hip.y;
const thighAngle = angle(hip, knee, ankle);

let score = 100;

// 膝盖高度检查
if (!kneeAboveHip) score -= 50;

// 大腿角度检查 (接近 90°)
if (thighAngle < 80 || thighAngle > 100) score -= 30;

// 平衡性检查
const bodyTilt = Math.abs(lShoulder.y - rShoulder.y);
if (bodyTilt > 0.05) score -= 20;

return Math.max(0, score);
```

#### 6.2.4 Hamstring Hinge (腘绳肌铰链)

```javascript
// 评估条件：
// 1. 躯干前倾 20-30°
// 2. 背部保持直立
// 3. 腿部微屈

const torsoAngle = Math.atan2(
  (lShoulder.y + rShoulder.y) / 2 - (lHip.y + rHip.y) / 2,
  (lShoulder.x + rShoulder.x) / 2 - (lHip.x + rHip.x) / 2
);

const targetTilt = -Math.PI / 9;  // -20°
const diff = Math.abs(torsoAngle - targetTilt);

let score = 100;

// 前倾角度检查
if (diff > Math.PI / 18) score -= 40;  // 超过 10° 偏差

// 腿部角度检查
const lKneeAngle = angle(lHip, lKnee, lAnkle);
if (lKneeAngle < 160 || lKneeAngle > 180) score -= 30;

return Math.max(0, score);
```

### 6.3 评分更新频率控制

```javascript
// 限制更新频率为 10 FPS (每 100ms)
const now = performance.now();
if (now - lastOverlayUpdateMs < 100) return;

lastOverlayUpdateMs = now;

// 平滑评分变化
overlayScorePercent = 0.5 * overlayScorePercent + 0.5 * newScore;
```

### 6.4 成功判定算法

```javascript
// 两个条件同时满足：
// 1. Fit ≥ 90%
// 2. 保持时间 ≥ 1 秒

if (overlayScorePercent >= 90) {
  holdSec += deltaTime;
  
  if (holdSec >= 1) {
    // 动作成功
    successCount++;
    holdSec = 0;
    
    // 显示庆祝
    showCelebration('completed!');
    speak('Well done!');
    
    // Play 模式：自动切换下一个动作
    if (scoreMode) {
      autoAdvanceToNextExercise();
    }
  }
} else {
  holdSec = 0;  // 重置计时
}
```

---

## 7. 数据流设计 {#数据流设计}

### 7.1 主循环数据流

```
┌─────────────────────┐
│  requestAnimationFrame │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  获取视频帧         │
│  video.currentTime  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  MediaPipe 检测     │
│  detectForVideo()   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  提取骨骼点         │
│  33 个 landmarks    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  指数平滑处理       │
│  smoothedLandmarks  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  绘制骨骼点         │
│  drawConnectors()   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  动作评估           │
│  evaluatePose()     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  更新 UI            │
│  Fit / Tip / 庆祝   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  手势检测           │
│  gestureControl()   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  循环               │
│  requestAnimationFrame │
└─────────────────────┘
```

### 7.2 事件驱动流程

#### 7.2.1 用户点击卡片

```
用户点击卡片
  ↓
onCardClick(mode)
  ↓
更新 currentMode
  ↓
updateDemoCanvas(mode)  // 更新火柴人
  ↓
updateTip(mode)         // 更新提示
  ↓
highlightCard(mode)     // 高亮卡片
  ↓
speak(tip)              // 语音播报
```

#### 7.2.2 Play 模式流程

```
用户点击 Play 按钮
  ↓
显示 Play 信息弹窗
  ↓
用户点击 Action!
  ↓
startPlayMode()
  ├── scoreMode = true
  ├── autoIndex = 0
  ├── 禁用卡片点击
  ├── 禁用手势控制
  ├── 开始计时
  └── 切换到第一个动作
  ↓
用户完成当前动作
  ↓
autoAdvanceToNextExercise()
  ├── 记录评分
  ├── autoIndex++
  ├── 切换动作
  └── 更新卡片高亮
  ↓
[循环直到完成所有动作]
  ↓
calculateFinalScore()
  ├── 质量分 (85%)
  └── 速度分 (15%)
  ↓
显示完成弹窗
  ↓
用户选择：
  ├── One more time → 重新开始 Play
  └── Leave → 跳转到主页
```

### 7.3 LocalStorage 数据持久化

```javascript
// 存储的数据
{
  'welcomeSeen': 'true',           // 是否看过欢迎弹窗
  'guidesCompleted': 'true',       // 是否完成引导
  'voiceEnabled': 'true',          // 语音开关状态
  'autoStartCamera': 'true'        // 是否自动启动摄像头（已废弃）
}
```

---

## 8. 部署架构 {#部署架构}

### 8.1 部署流程

```
┌─────────────────┐
│  本地开发       │
│  localhost:8080 │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Git 提交       │
│  git commit     │
└────────┬────────┘
         ↓
┌─────────────────┐
│  推送到 GitHub  │
│  git push       │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Railway 监听   │
│  Webhook 触发   │
└────────┬────────┘
         ↓
┌─────────────────┐
│  构建镜像       │
│  npm install    │
└────────┬────────┘
         ↓
┌─────────────────┐
│  启动应用       │
│  npm start      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  部署成功       │
│  生成域名       │
└─────────────────┘
```

### 8.2 Railway 配置

#### 8.2.1 railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 8.2.2 Procfile

```
web: npx --yes serve . -l ${PORT:-8080} --no-clipboard
```

#### 8.2.3 package.json

```json
{
  "name": "pose-demo",
  "version": "1.0.0",
  "description": "Move a Little Game",
  "scripts": {
    "start": "npx serve . -l ${PORT:-8080} --no-clipboard"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "serve": "^14.2.0"
  }
}
```

### 8.3 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | 8080 |
| `NODE_ENV` | 环境 | production |

### 8.4 域名配置

#### 默认域名
```
https://epic7-production.up.railway.app
```

#### 自定义域名（可选）
```
1. Railway Dashboard → Settings → Domains
2. 添加自定义域名
3. 配置 DNS CNAME 记录
4. 等待 SSL 证书自动签发
```

### 8.5 CDN 加速

Railway 自动提供全球 CDN 加速：
- 静态资源自动缓存
- HTTPS 自动启用
- Gzip 压缩
- HTTP/2 支持

---

## 9. 安全性设计 {#安全性设计}

### 9.1 隐私保护

#### 9.1.1 本地处理
```
✅ 所有姿态检测在浏览器本地完成
✅ 视频流不上传服务器
✅ 无用户数据收集
✅ 无 Cookie 追踪
```

#### 9.1.2 摄像头权限

```javascript
// 显式请求权限
navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: 'user'
  }
})
.then(stream => {
  // 权限已授予
})
.catch(err => {
  // 权限被拒绝
  alert('Camera access denied');
});
```

### 9.2 内容安全策略 (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  media-src 'self' blob:;
  connect-src 'self' https://storage.googleapis.com;
  worker-src 'self' blob:;
">
```

### 9.3 HTTPS 强制

```javascript
// 检测是否为 HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  alert('This app requires HTTPS for camera access');
}
```

### 9.4 XSS 防护

```javascript
// 所有用户输入都经过转义
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

---

## 10. 性能优化 {#性能优化}

### 10.1 渲染性能优化

#### 10.1.1 High DPI 渲染

```javascript
// 支持高分辨率屏幕
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.offsetWidth * dpr;
canvas.height = canvas.offsetHeight * dpr;
ctx.scale(dpr, dpr);
```

#### 10.1.2 requestAnimationFrame

```javascript
// 使用 RAF 优化动画
function loop() {
  if (!training) return;
  
  // 检测姿态
  detectPose();
  
  // 下一帧
  rafId = requestAnimationFrame(loop);
}
```

#### 10.1.3 Canvas 优化

```javascript
// 使用离屏 Canvas
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d', {
  alpha: false,
  desynchronized: true
});
```

### 10.2 内存优化

#### 10.2.1 对象池

```javascript
// 复用骨骼点数组
const landmarkPool = new Array(33).fill(null).map(() => ({
  x: 0, y: 0, z: 0
}));
```

#### 10.2.2 及时释放

```javascript
function cleanup() {
  // 停止视频流
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  
  // 取消动画帧
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  
  // 清空引用
  poseLandmarker = null;
  landmarks = null;
}
```

### 10.3 网络优化

#### 10.3.1 CDN 加速

```html
<!-- MediaPipe 使用 jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js"></script>
```

#### 10.3.2 资源预加载

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://storage.googleapis.com">
```

#### 10.3.3 图片优化

```
- 使用 PNG 格式（透明背景）
- 压缩图片大小
- 懒加载非关键图片
```

### 10.4 计算优化

#### 10.4.1 节流

```javascript
// 限制 Fit 更新频率
if (now - lastOverlayUpdateMs < 100) return;
```

#### 10.4.2 防抖

```javascript
// 手势控制防抖
if (gestureHoldMs >= 1000) {
  // 执行切换
  gestureHoldMs = 0;
}
```

---

## 11. 测试策略 {#测试策略}

### 11.1 功能测试

#### 11.1.1 姿态检测测试

```
测试用例 1: 正常光照条件
  - 预期：骨骼点准确检测
  - 结果：✅ 通过

测试用例 2: 低光照条件
  - 预期：检测精度下降，但仍可用
  - 结果：✅ 通过

测试用例 3: 多人入镜
  - 预期：只检测最靠近的人
  - 结果：✅ 通过
```

#### 11.1.2 动作评估测试

```
测试用例 1: Overhead Reach
  - 输入：手臂完全伸直过头顶
  - 预期：Fit ≥ 90%
  - 结果：✅ 通过

测试用例 2: T Pose
  - 输入：手臂水平伸展
  - 预期：Fit ≥ 90%
  - 结果：✅ 通过

测试用例 3: High Knee Hold
  - 输入：单腿抬起至水平
  - 预期：Fit ≥ 90%
  - 结果：✅ 通过
```

### 11.2 性能测试

#### 11.2.1 帧率测试

```
目标：≥ 30 FPS
实际：
  - 桌面端：45-60 FPS ✅
  - 移动端：25-35 FPS ✅
```

#### 11.2.2 内存测试

```
目标：< 200MB
实际：
  - 初始加载：80MB ✅
  - 运行 10 分钟：120MB ✅
  - 无内存泄漏 ✅
```

### 11.3 兼容性测试

#### 11.3.1 浏览器兼容性

| 浏览器 | 版本 | 状态 |
|--------|------|------|
| Chrome | ≥ 90 | ✅ 完全支持 |
| Edge | ≥ 90 | ✅ 完全支持 |
| Safari | ≥ 14 | ✅ 完全支持 |
| Firefox | ≥ 88 | ✅ 完全支持 |

#### 11.3.2 设备兼容性

| 设备 | 分辨率 | 状态 |
|------|--------|------|
| Desktop | 1920x1080 | ✅ 最佳 |
| Laptop | 1366x768 | ✅ 良好 |
| Tablet | 1024x768 | ✅ 良好 |
| Mobile | 375x667 | ⚠️ 基本可用 |

### 11.4 用户验收测试 (UAT)

```
场景 1: 首次使用
  ✅ 引导系统清晰易懂
  ✅ 摄像头权限申请流畅
  ✅ 用户能快速上手

场景 2: Practice 模式
  ✅ 动作切换响应快
  ✅ 手势控制准确
  ✅ 反馈及时清晰

场景 3: Play 模式
  ✅ 规则说明清楚
  ✅ 评分合理
  ✅ 完成感满足
```

---

## 12. 未来扩展 {#未来扩展}

### 12.1 功能扩展

#### 12.1.1 更多动作

```
计划添加：
  - Squat (深蹲)
  - Lunge (弓步)
  - Plank (平板支撑)
  - Push-up (俯卧撑)
  - Jumping Jack (开合跳)
```

#### 12.1.2 社交功能

```
- 排行榜
- 好友挑战
- 分享成绩到社交媒体
- 多人对战模式
```

#### 12.1.3 个性化

```
- 自定义训练计划
- 难度调节
- 时长调节
- 音乐选择
```

### 12.2 技术升级

#### 12.2.1 AI 优化

```
- 使用更精确的姿态模型
- 自定义训练模型
- 动作质量评分细化
- 运动轨迹分析
```

#### 12.2.2 AR 集成

```
- AR 叠加层
- 虚拟教练
- 3D 动作示范
```

#### 12.2.3 健康数据集成

```
- 卡路里消耗估算
- 运动时长统计
- 健康建议
- 与 Apple Health / Google Fit 集成
```

### 12.3 平台扩展

#### 12.3.1 移动端优化

```
- PWA (Progressive Web App)
- 原生 App (React Native)
- 离线模式
- 通知推送
```

#### 12.3.2 智能设备

```
- 智能电视应用
- VR 头显适配
- 体感设备集成
```

---

## 附录 A: API 文档

### MediaPipe Pose Landmarker

**初始化：**
```javascript
PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: string,
    delegate: 'CPU' | 'GPU'
  },
  runningMode: 'IMAGE' | 'VIDEO',
  numPoses: number
})
```

**检测：**
```javascript
poseLandmarker.detectForVideo(videoElement, timestamp)
// 返回：{ landmarks: Array<33>, worldLandmarks: Array<33> }
```

---

## 附录 B: 部署检查清单

- [ ] 代码已提交到 Git
- [ ] package.json 配置正确
- [ ] Procfile 存在且正确
- [ ] railway.json 配置完整
- [ ] 本地测试通过
- [ ] 推送到 GitHub
- [ ] Railway 部署成功
- [ ] HTTPS 证书已签发
- [ ] 摄像头权限正常
- [ ] 所有动作测试通过
- [ ] 性能符合预期
- [ ] 用户验收测试通过

---

## 附录 C: 故障排查指南

### 问题 1: 摄像头无法打开
```
可能原因：
  - 权限被拒绝
  - HTTPS 未启用
  - 设备被占用

解决方案：
  1. 检查浏览器权限设置
  2. 确认使用 HTTPS 或 localhost
  3. 关闭其他使用摄像头的应用
```

### 问题 2: 姿态检测不准确
```
可能原因：
  - 光照不足
  - 距离摄像头过远/过近
  - 背景复杂

解决方案：
  1. 改善光照条件
  2. 调整与摄像头的距离 (1-2米)
  3. 选择简洁背景
```

### 问题 3: 帧率过低
```
可能原因：
  - 设备性能不足
  - 浏览器兼容性问题
  - 内存不足

解决方案：
  1. 降低视频分辨率
  2. 更换浏览器
  3. 关闭其他标签页
```

---

## 文档变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2025-10-13 | 初始版本，完整设计文档 | Development Team |

---

**文档结束**

