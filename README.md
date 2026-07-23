# 每日夸夸

一个温暖治愈的家庭 PWA 小应用 —— 用每日赞美、治愈语句和轻量任务，帮助家人慢慢走出自我批判的循环，重拾对生活的信心。

## 功能（MVP）

- **赞美区**：顶部显示每日任务进度（三人全部完成后自动消失），下方发布与浏览赞美
- **每日感恩**：顶部每日一句治愈语，下方填写 1–3 件值得感谢的小事
- **回忆日历**：点击日期查看历史感恩与赞美
- 初始用户：清扬 / 颖 / 刚，每人每天需在赞美区发布 3 条赞美

## 本地预览

当前默认开启**演示模式**（`.env` 中 `VITE_DEMO_MODE=true`），数据保存在浏览器 localStorage，无需 Firebase 即可预览 UI 和功能。

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

首次登录可用用户名：`清扬` / `颖` / `刚`，密码自行设置（至少 4 位）。

## 接入 Firebase（上线前）

1. 在 [Firebase Console](https://console.firebase.google.com/) 创建项目
2. 启用 **Authentication → Email/Password**
3. 创建 **Firestore Database**
4. 添加 Web 应用，复制配置到 `.env`（参考 `.env.example`）
5. 将 `VITE_DEMO_MODE` 设为 `false`
6. 部署安全规则：`npx firebase deploy --only firestore:rules`

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量（与 `.env` 相同）
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. 在 Firebase Console → Authentication → Settings → Authorized domains 中添加 Vercel 域名

## 技术栈

- Vite + React + TypeScript
- Firebase Auth + Firestore
- vite-plugin-pwa（PWA 支持）
- Vercel 部署

## 设计

治愈、简约、温暖风格 —— 暖奶油色背景、柔和珊瑚粉主色、圆角卡片、移动端优先布局。
