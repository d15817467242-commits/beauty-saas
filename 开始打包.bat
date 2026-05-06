@echo off
chcp 65001 >nul
echo ========================================
echo 美业SaaS系统 - EXE打包脚本
echo ========================================
echo.

REM 检查是否有node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未检测到 Node.js！
    echo 请先下载安装：https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/5] 检查Node.js... OK
node -v
npm -v
echo.

REM 安装electron相关依赖
echo [2/5] 正在安装打包依赖...
if not exist "node_modules" (
    npm install electron electron-builder --save-dev
)

echo.
echo [3/5] 开始打包...
echo.

REM 复制package.json
copy /Y electron-package.json package.json >nul

REM 执行打包
npm run build

echo.
echo ========================================
echo 打包完成！
echo ========================================
echo.
echo EXE文件位置: dist-exe\
echo.
pause
