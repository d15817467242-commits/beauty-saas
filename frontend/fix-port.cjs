
const fs = require('fs')
const path = require('path')

const srcDir = path.join(__dirname, 'src')

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let newContent = content.replace(/http:\/\/localhost:3001/g, 'http://localhost:3000')
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8')
    console.log('✓ Fixed:', filePath)
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      scanDir(fullPath)
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js')) {
      fixFile(fullPath)
    }
  }
}

console.log('开始扫描前端代码，替换 3001 → 3000 ...\n')
scanDir(srcDir)
console.log('\n✅ 全部完成！')
