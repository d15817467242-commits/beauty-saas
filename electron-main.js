const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const os = require('os')

let mainWindow
let backendProcess
let frontendProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: '美业SaaS系统',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadURL('http://localhost:5173')
  mainWindow.on('closed', () => mainWindow = null)
}

function startBackend() {
  const backendPath = path.join(__dirname, 'backend', 'dist', 'main.js')
  backendProcess = spawn('node', [backendPath], {
    cwd: path.join(__dirname, 'backend'),
    detached: false,
    stdio: 'ignore'
  })
}

function startFrontend() {
  const frontendPath = path.join(__dirname, 'frontend')
  frontendProcess = spawn('cmd.exe', ['/c', 'cd /d "' + frontendPath + '" && npm run dev'], {
    detached: false,
    stdio: 'ignore'
  })
}

app.whenReady().then(() => {
  // 启动服务
  startBackend()
  
  setTimeout(() => {
    startFrontend()
  }, 3000)
  
  setTimeout(() => {
    createWindow()
  }, 8000)
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) backendProcess.kill()
    if (frontendProcess) frontendProcess.kill()
    app.quit()
  }
})

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill()
  if (frontendProcess) frontendProcess.kill()
})
