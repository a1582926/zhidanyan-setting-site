#!/usr/bin/env bash
# 《致：黯淡星》官方设定站 —— 一键部署脚本（GitHub Pages）
# 前置：git 已配置 user.name/email，GitHub 账号已登录（见 README 部署说明）
set -e
cd "$(dirname "$0")"

REPO_NAME="zhidanyan-setting-site"
BRANCH="main"

echo "=== 1/4 检查 git 状态 ==="
if [ ! -d .git ]; then
  git init -b "$BRANCH"
  echo "git 仓库已初始化"
fi
git config user.name  >/dev/null 2>&1 || git config user.name "zhidanyan-studio"
git config user.email >/dev/null 2>&1 || git config user.email "zhidanyan@users.noreply.github.com"

echo "=== 2/4 提交更新 ==="
git add -A
git commit -m "设定更新 $(date +%Y-%m-%d_%H:%M)" 2>/dev/null || echo "(无新改动)"

echo "=== 3/4 检查远程仓库 ==="
if ! git remote | grep -q origin; then
  echo "需要创建 GitHub 仓库（公开，Pages 免费）……"
  read -p "GitHub 用户名: " GH_USER
  if command -v gh >/dev/null 2>&1; then
    gh repo create "$GH_USER/$REPO_NAME" --public --source . --push
  else
    git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
    echo "请先在 GitHub 网页创建仓库 $REPO_NAME（Public），然后重新运行本脚本"
    exit 1
  fi
fi

echo "=== 4/4 推送 ==="
git push -u origin "$BRANCH" 2>/dev/null || git push origin "$BRANCH"

echo ""
echo "✅ 推送完成！站点地址："
echo "   https://$(git remote get-url origin | sed -E 's#https://github.com/([^/]+)/.*#\1#').github.io/$REPO_NAME/"
echo ""
echo "首次部署需在 GitHub 仓库 Settings → Pages → Source 选 $BRANCH 分支（根目录），"
echo "或运行：gh api -X POST repos/{owner}/$REPO_NAME/pages -f 'source[branch]='$BRANCH -f 'source[path]=/'"
