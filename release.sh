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

# 去掉 v 前缀得到纯数字版本号
VERSION_NUMBER=${VERSION#v}

echo "🔄 Updating version numbers to $VERSION_NUMBER..."

# 更新 package.json
if [ -f "package.json" ]; then
  sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION_NUMBER\"/" package.json
  rm package.json.bak
  echo "✅ Updated package.json"
fi

# 更新 src-tauri/Cargo.toml
if [ -f "src-tauri/Cargo.toml" ]; then
  sed -i.bak "s/^version = \"[^\"]*\"/version = \"$VERSION_NUMBER\"/" src-tauri/Cargo.toml
  rm src-tauri/Cargo.toml.bak
  echo "✅ Updated src-tauri/Cargo.toml"
fi

# 更新 src-tauri/tauri.conf.json
if [ -f "src-tauri/tauri.conf.json" ]; then
  sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION_NUMBER\"/" src-tauri/tauri.conf.json
  rm src-tauri/tauri.conf.json.bak
  echo "✅ Updated src-tauri/tauri.conf.json"
fi

# 检查是否有更改
if [[ -n $(git status -s) ]]; then
  echo ""
  echo "📝 Version numbers updated. Committing changes..."
  git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
  git commit -m "chore: Bump version to $VERSION_NUMBER"
  git push origin main
  echo "✅ Changes committed and pushed"
else
  echo "ℹ️  No version changes needed"
fi

# 检查标签是否已存在
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "❌ Error: Tag $VERSION already exists"
  echo "To delete it: git tag -d $VERSION && git push origin :refs/tags/$VERSION"
  exit 1
fi

echo ""
echo "🚀 Creating release $VERSION..."

# 创建标签
git tag $VERSION

# 推送标签
git push origin $VERSION

echo "✅ Release $VERSION triggered!"
echo "📦 GitHub Actions is now building for macOS, Linux, and Windows"
echo "🔗 Check progress: https://github.com/loreapp-io-dev/LoreNote/actions"
