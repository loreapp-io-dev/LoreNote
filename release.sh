#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version number required"
  echo "Usage: ./release.sh v0.2.0"
  exit 1
fi

# 检查版本号格式
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Error: Invalid version format. Use format: v0.2.0"
  exit 1
fi

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
  echo "⚠️  Warning: You have uncommitted changes"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 检查标签是否已存在
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "❌ Error: Tag $VERSION already exists"
  echo "To delete it: git tag -d $VERSION && git push origin :refs/tags/$VERSION"
  exit 1
fi

echo "🚀 Creating release $VERSION..."

# 创建标签
git tag $VERSION

# 推送标签
git push origin $VERSION

echo "✅ Release $VERSION triggered!"
echo "📦 GitHub Actions is now building for macOS, Linux, and Windows"
echo "🔗 Check progress: https://github.com/loreapp-io-dev/LoreNote/actions"
