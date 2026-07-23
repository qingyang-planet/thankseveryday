# 每日夸夸

一个温暖治愈的家庭 PWA 小应用 —— 用每日赞美、治愈语句和轻量任务，帮助家人慢慢走出自我批判的循环，重拾对生活的信心。

## 功能（MVP）

- **赞美区**：顶部显示每日任务进度（三人全部完成后自动消失），下方发布与浏览赞美
- **每日感恩**：顶部每日一句治愈语，下方填写 1–3 件值得感谢的小事
- **回忆日历**：点击日期查看历史感恩与赞美
- 初始用户：清扬 / 颖 / 刚，每人每天需在赞美区发布 3 条赞美

## 线上地址

- **Vercel**：https://thankseveryday.vercel.app
- **GitHub**：https://github.com/qingyang-planet/thankseveryday

当前默认**演示模式**（数据保存在浏览器 localStorage）。接入腾讯云 CloudBase 后，国内可正常访问并跨设备同步。

## 部署状态

| 步骤 | 状态 |
|------|------|
| 本地 Git 仓库 | ✅ |
| GitHub 仓库 | ⏳ https://github.com/qingyang-planet/thankseveryday |
| 后端数据库 | ⏳ 腾讯云 CloudBase（国内可用） |
| Vercel 前端 | ✅ |

## 接入腾讯云 CloudBase（推荐，国内可用）

1. 打开 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb) 创建**免费体验环境**
2. **身份认证** → 登录方式 → 开启 **邮箱密码登录**
3. **云数据库** → 创建集合 `praises`、`gratitudes`
4. **数据库权限** → 设置为「仅登录用户可读写」
5. **安全配置** → 添加 Web 安全域名（`localhost:5173`、Vercel 域名、静态托管域名）
6. 复制**环境 ID** 到 `.env`：

```bash
VITE_CLOUDBASE_ENV_ID=你的环境ID
VITE_CLOUDBASE_REGION=ap-shanghai
VITE_DEMO_MODE=false
```

7. 重新构建部署：

```bash
npm run build
# CloudBase 静态托管（国内更快）
npx @cloudbase/cli hosting deploy dist -e 你的环境ID
```

也可运行：`bash scripts/setup-cloudbase.sh`

## 推送到 GitHub

```bash
cd /Users/yiqikanxingxingma/Desktop/praise

# 先登录 GitHub（只需一次）
~/anaconda3/bin/gh auth login

# 确认远程地址
git remote -v
# 应显示 origin → https://github.com/qingyang-planet/thankseveryday.git

# 推送（分支名必须是 main）
git push -u origin main
```

如果 HTTPS 推送失败，改用 SSH：

```bash
git remote set-url origin git@github.com:qingyang-planet/thankseveryday.git
git push -u origin main
```

## 本地预览

演示模式（`.env` 中 `VITE_DEMO_MODE=true`），无需 CloudBase：

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173 ，用户名：`清扬` / `颖` / `刚`，密码自行设置（至少 4 位）。

## 技术栈

- Vite + React + TypeScript
- 腾讯云 CloudBase（Auth + 云数据库）
- vite-plugin-pwa（PWA 支持）
- Vercel / CloudBase 静态托管

## 设计

治愈、简约、温暖风格 —— 暖奶油色背景、柔和珊瑚粉主色、圆角卡片、移动端优先布局。
