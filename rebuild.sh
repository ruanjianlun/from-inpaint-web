#!/bin/bash
# Eraserly 应用重新构建和部署脚本
# 用于更新代码后重新部署应用

set -e  # 遇到错误立即退出

echo "======================================"
echo "  Eraserly 重新构建部署脚本"
echo "======================================"
echo ""

# 1. 拉取最新代码
echo ">>> 步骤 1: 拉取最新代码..."
git pull
echo ""

# 2. 显示最新提交信息
echo ">>> 最新提交信息:"
git log --oneline -1
echo ""

# 3. 停止容器
echo ">>> 步骤 2: 停止运行中的容器..."
docker compose -f docker-compose.1panel.yml down
echo "容器已停止"
echo ""

# 4. 删除旧镜像
echo ">>> 步骤 3: 删除旧的 Docker 镜像..."
OLD_IMAGES=$(docker images | grep from-inpaint-web | awk '{print $3}')
if [ -n "$OLD_IMAGES" ]; then
    echo "$OLD_IMAGES" | xargs docker rmi
    echo "旧镜像已删除"
else
    echo "没有找到旧镜像"
fi
echo ""

# 5. 重新构建（无缓存）
echo ">>> 步骤 4: 重新构建镜像（无缓存）..."
echo "这可能需要几分钟，请耐心等待..."
docker compose -f docker-compose.1panel.yml build --no-cache --progress=plain
echo ""

# 6. 启动容器
echo ">>> 步骤 5: 启动容器..."
docker compose -f docker-compose.1panel.yml up -d
echo ""

# 7. 等待服务启动
echo ">>> 等待服务启动..."
sleep 3
echo ""

# 8. 显示容器状态
echo ">>> 容器状态:"
docker compose -f docker-compose.1panel.yml ps
echo ""

# 9. 显示生成的 JS 文件名
echo ">>> 验证构建产物:"
docker exec eraserly-app cat /usr/share/nginx/html/index.html | grep 'src="/assets/'
echo ""

# 10. 显示最近的日志
echo ">>> 最近的日志:"
docker compose -f docker-compose.1panel.yml logs --tail=20
echo ""

echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "访问地址:"
echo "  - http://你的服务器IP:3000"
echo "  - https://eraserly.qzz.io"
echo ""
echo "查看日志: docker compose -f docker-compose.1panel.yml logs -f"
echo ""
