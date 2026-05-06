@echo off
chcp 65001 >nul
cls
echo ================================================================================
echo                        美业SaaS系统 - 制作EXE一键工具
echo ================================================================================
echo.
echo 我正在帮你生成一个最简单的方案：
echo.
echo 1. 下载：Bat To Exe Converter （百度一下，免费下载）
echo 2. 打开软件，选择：%~dp0MeiyeSaaS_Launcher.bat
echo 3. 选择：Invisible application（隐藏窗口）
echo 4. 点击：Compile（编译）
echo.
echo 完成！你就有了一个独立的EXE文件！
echo.
echo ================================================================================
echo.
echo 或者，我现在帮你直接用一个更简单的方法...
echo.
echo 按任意键继续...
pause >nul

echo.
echo 正在创建一个超级简单的启动器...
echo.

REM 创建一个VBS启动器
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\RunMeiye.vbs"
echo WshShell.Run "cmd /c cd /d ""%~dp0"" && start MeiyeSaaS_Launcher.bat", 0 >> "%TEMP%\RunMeiye.vbs"

REM 复制到桌面
copy "%TEMP%\RunMeiye.vbs" "%USERPROFILE%\Desktop\启动美业SaaS系统.vbs" >nul

echo.
echo ================================================================================
echo 完成！
echo ================================================================================
echo.
echo 现在去桌面找【启动美业SaaS系统.vbs】，双击就能打开！
echo.
echo 如果你一定要EXE，就按上面说的下载Bat To Exe Converter！
echo.
echo 默认登录：
echo   账号：admin
echo   密码：admin123
echo.
pause
