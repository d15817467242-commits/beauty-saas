$ErrorActionPreference = "Continue"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================"
Write-Host "美业SaaS系统 - 启动中..."
Write-Host "========================================"

# 启动后端（隐藏窗口）
$BackendProcess = Start-Process -FilePath "node" -ArgumentList "--trace-warnings", "$ScriptPath\backend\dist\main.js" -WorkingDirectory "$ScriptPath\backend" -WindowStyle Hidden -PassThru

# 等待后端启动
Start-Sleep -Seconds 5

# 启动前端（隐藏窗口）
$FrontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$ScriptPath\frontend`" && npm run dev" -WindowStyle Hidden -PassThru

# 等待前端启动
Start-Sleep -Seconds 5

# 打开浏览器
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================"
Write-Host "启动成功！"
Write-Host "========================================"
Write-Host ""
Write-Host "后端地址: http://localhost:3000/api"
Write-Host "前端地址: http://localhost:5173"
Write-Host "默认账号: admin"
Write-Host "默认密码: admin123"
Write-Host ""
Write-Host "按 Ctrl+C 停止服务并退出..."

# 保持脚本运行
while ($true) {
    Start-Sleep -Seconds 1
}

# 清理进程
$BackendProcess | Stop-Process -Force -ErrorAction SilentlyContinue
$FrontendProcess | Stop-Process -Force -ErrorAction SilentlyContinue
