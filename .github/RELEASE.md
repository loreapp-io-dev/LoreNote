# GitHub Actions 发布流程

## 自动发布新版本

### 方式 1：推送标签（推荐）

```bash
# 1. 确保所有更改已提交
git add .
git commit -m "feat: your changes"

# 2. 创建版本标签
git tag v0.2.0

# 3. 推送标签到 GitHub
git push origin v0.2.0
```

推送标签后，GitHub Actions 会自动：
- 在 macOS、Linux、Windows 三个平台上编译应用
- 创建 GitHub Release
- 上传编译好的安装包到 Release

### 方式 2：手动触发

1. 访问 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **Release** 工作流
4. 点击 **Run workflow** 按钮
5. 选择分支并运行

## 版本号规范

遵循语义化版本（Semantic Versioning）：

- `v0.2.0` - 主版本.次版本.修订号
- `v0.2.1` - 修复 bug
- `v0.3.0` - 新功能
- `v1.0.0` - 重大更新

## 发布产物

编译完成后，会在 GitHub Release 中生成以下文件：

### macOS
- `LoreNote_x.x.x_aarch64.dmg` (Apple Silicon)
- `LoreNote_x.x.x_x64.dmg` (Intel)

### Linux
- `lore-note_x.x.x_amd64.deb` (Debian/Ubuntu)
- `lore-note_x.x.x_amd64.AppImage` (通用)

### Windows
- `LoreNote_x.x.x_x64-setup.exe` (安装程序)
- `LoreNote_x.x.x_x64.msi` (MSI 安装包)

## 注意事项

1. **首次使用**：确保仓库设置中启用了 Actions
   - 访问 `Settings` → `Actions` → `General`
   - 选择 "Allow all actions and reusable workflows"

2. **权限设置**：工作流已配置 `contents: write` 权限，可以创建 Release

3. **编译时间**：完整编译三个平台大约需要 15-30 分钟

4. **删除标签**：如果需要重新发布
   ```bash
   # 删除本地标签
   git tag -d v0.2.0

   # 删除远程标签
   git push origin :refs/tags/v0.2.0
   ```

## 快速发布脚本

创建一个快捷脚本 `release.sh`：

```bash
#!/bin/bash
VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh v0.2.0"
  exit 1
fi

echo "Creating release $VERSION..."
git tag $VERSION
git push origin $VERSION
echo "Release triggered! Check GitHub Actions for progress."
```

使用方法：
```bash
chmod +x release.sh
./release.sh v0.2.0
```
