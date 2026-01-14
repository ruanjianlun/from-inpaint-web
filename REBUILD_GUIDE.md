# 部署脚本使用说明

## rebuild.sh - 快速重新部署

**用途**：当代码更新后，使用此脚本快速重新构建和部署应用。

### 使用方法

```bash
# 1. 进入项目目录
cd /root/inpaint-web

# 2. 给脚本添加执行权限（首次使用）
chmod +x rebuild.sh

# 3. 执行脚本
./rebuild.sh
```

### 脚本功能

脚本会自动执行以下步骤：

1. ✅ 拉取最新代码（git pull）
2. ✅ 显示最新提交信息
3. ✅ 停止运行中的容器
4. ✅ 删除旧的 Docker 镜像
5. ✅ 重新构建（无缓存）
6. ✅ 启动新容器
7. ✅ 显示容器状态
8. ✅ 验证构建产物
9. ✅ 显示最近的日志

### 注意事项

- ⚠️ 脚本会删除旧镜像并重新构建，整个过程可能需要 3-5 分钟
- ⚠️ 执行期间应用会短暂不可用（通常 < 1 分钟）
- ⚠️ 确保在 `/root/inpaint-web` 目录下执行

---

## 其他常用命令

### 查看日志

```bash
docker compose -f docker-compose.1panel.yml logs -f
```

### 重启服务

```bash
docker compose -f docker-compose.1panel.yml restart
```

### 停止服务

```bash
docker compose -f docker-compose.1panel.yml down
```

### 进入容器

```bash
docker exec -it eraserly-app sh
```

### 查看容器资源使用

```bash
docker stats eraserly-app
```
