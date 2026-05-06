@echo off
chcp 65001 >nul
echo ========================================
echo 美业SaaS系统 - 完整打包EXE
echo ========================================
echo.

REM 检查node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：需要先安装 Node.js！
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] 正在安装 nexe...
npm install -g nexe

echo.
echo [2/4] 正在编译后端...
cd backend
call npm run build
cd ..

echo.
echo [3/4] 正在打包后端为EXE...
copy /Y backend\dist\main.js backend\server.tmp.js >nul
cd backend
nexe -i server.tmp.js -o meiye-backend.exe -t windows-x64-18.17.1
del server.tmp.js
cd ..

echo.
echo [4/4] 正在创建启动器...
(
echo @echo off
echo title 美业SaaS系统
echo cd /d "%%~dp0"
echo start /B "" "meiye-backend.exe"
echo timeout /t 5 /nobreak ^>nul
echo start /B "" cmd /c "cd frontend ^&^& npm run dev"
echo timeout /t 8 /nobreak ^>nul
echo start http://localhost:5173
echo echo.
echo echo ========================================
echo echo 美业SaaS系统启动成功！
echo echo ========================================
echo echo.
echo echo 前端地址: http://localhost:5173
echo echo 默认账号: admin
echo echo 默认密码: admin123
echo echo.
echo echo 请勿关闭此窗口，否则服务会停止！
echo echo.
echo pause
) > "启动美业SaaS系统.bat"

echo.
echo ========================================
echo 打包完成！
echo ========================================
echo.
echo 文件说明：
echo   backend\meiye-backend.exe - 后端服务
echo   启动美业SaaS系统.bat   - 一键启动
echo.
echo 下一步：
echo   1. 把整个文件夹复制到任何位置
echo   2. 双击"启动美业SaaS系统.bat"即可使用
echo.
echo 注意：需要Node.js环境运行前端
echo.
pause
