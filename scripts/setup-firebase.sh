#!/bin/bash
# Firebase + Vercel 一键配置脚本（需先完成 Firebase 登录）
set -e
cd "$(dirname "$0")/.."

PROJECT_ID="thankseveryday"
VERCEL_URL="thankseveryday.vercel.app"

echo "==> 1. Firebase 登录"
npx -y firebase-tools@latest login

echo "==> 2. 创建/选择 Firebase 项目"
npx -y firebase-tools@latest use "$PROJECT_ID" 2>/dev/null || \
  npx -y firebase-tools@latest projects:create "$PROJECT_ID" --display-name "Thanks Every Day"

echo "==> 3. 初始化 Firestore + Auth"
npx -y firebase-tools@latest init firestore --project "$PROJECT_ID" --non-interactive 2>/dev/null || true

echo "==> 4. 创建 Web App 并获取配置"
# 需在 Firebase Console 创建 Web 应用，或使用 MCP firebase_create_app

echo "==> 5. 部署 Firestore 规则"
npx -y firebase-tools@latest deploy --only firestore:rules,auth --project "$PROJECT_ID"

echo "==> 6. 在 Firebase Console 添加授权域名: $VERCEL_URL"
echo "    Authentication > Settings > Authorized domains"

echo "==> 7. 配置 Vercel 环境变量（将 Firebase Web 配置填入）:"
echo "    npx vercel env add VITE_FIREBASE_API_KEY production"
echo "    npx vercel env add VITE_FIREBASE_AUTH_DOMAIN production"
echo "    npx vercel env add VITE_FIREBASE_PROJECT_ID production"
echo "    npx vercel env add VITE_FIREBASE_STORAGE_BUCKET production"
echo "    npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production"
echo "    npx vercel env add VITE_FIREBASE_APP_ID production"
echo "    npx vercel env add VITE_DEMO_MODE production  # 填 false"
echo "    npx vercel deploy --prod"

echo "完成！"
