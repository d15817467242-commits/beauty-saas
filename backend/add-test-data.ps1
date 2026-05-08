# 美业SaaS测试数据添加脚本
$baseUrl = "http://localhost:3000/api"

# 1. 登录获取token
Write-Host "=== 登录获取token ===" -ForegroundColor Green
$loginBody = @{username="admin";password="admin123"} | ConvertTo-Json
$loginResult = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResult.access_token
$headers = @{Authorization="Bearer $token"}
Write-Host "登录成功！token已获取" -ForegroundColor Yellow

# 2. 添加服务分类
Write-Host "`n=== 添加服务分类 ===" -ForegroundColor Green

$categories = @(
    @{name="美发服务"; code="hair"; sort=1; isActive=$true},
    @{name="美容护肤"; code="beauty"; sort=2; isActive=$true},
    @{name="美甲美睫"; code="nail"; sort=3; isActive=$true},
    @{name="其他服务"; code="other"; sort=4; isActive=$true}
)

$categoryIds = @{}
foreach ($cat in $categories) {
    try {
        $body = $cat | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "$baseUrl/service-categories" -Method Post -ContentType "application/json" -Body $body -Headers $headers
        $categoryIds[$cat.code] = $result.id
        Write-Host "  添加分类: $($cat.name) -> ID: $($result.id)" -ForegroundColor Cyan
    } catch {
        Write-Host "  分类 $($cat.name) 添加失败: $_" -ForegroundColor Red
    }
}

# 3. 添加服务项目
Write-Host "`n=== 添加服务项目 ===" -ForegroundColor Green

$services = @(
    # 美发服务
    @{name="男士精剪"; code="MF001"; category="hair"; categoryId=$categoryIds["hair"]; price=68; memberPrice=58; duration=30; commissionRate=30; description="专业男士发型设计修剪"; isActive=$true; sort=1},
    @{name="女士剪发"; code="MF002"; category="hair"; categoryId=$categoryIds["hair"]; price=98; memberPrice=78; duration=45; commissionRate=30; description="女士时尚发型修剪"; isActive=$true; sort=2},
    @{name="烫发（冷烫）"; code="MF003"; category="hair"; categoryId=$categoryIds["hair"]; price=268; memberPrice=228; duration=120; commissionRate=25; description="时尚冷烫造型"; isActive=$true; sort=3},
    @{name="烫发（热烫）"; code="MF004"; category="hair"; categoryId=$categoryIds["hair"]; price=368; memberPrice=318; duration=150; commissionRate=25; description="韩式热烫造型"; isActive=$true; sort=4},
    @{name="染发（短发）"; code="MF005"; category="hair"; categoryId=$categoryIds["hair"]; price=198; memberPrice=168; duration=90; commissionRate=25; description="短发染发服务"; isActive=$true; sort=5},
    @{name="染发（长发）"; code="MF006"; category="hair"; categoryId=$categoryIds["hair"]; price=298; memberPrice=258; duration=120; commissionRate=25; description="长发染发服务"; isActive=$true; sort=6},
    @{name="洗吹造型"; code="MF007"; category="hair"; categoryId=$categoryIds["hair"]; price=58; memberPrice=48; duration=30; commissionRate=30; description="洗发吹风造型"; isActive=$true; sort=7},
    @{name="头皮护理"; code="MF008"; category="hair"; categoryId=$categoryIds["hair"]; price=128; memberPrice=98; duration=60; commissionRate=30; description="深层头皮清洁护理"; isActive=$true; sort=8},

    # 美容护肤
    @{name="基础面部护理"; code="MR001"; category="beauty"; categoryId=$categoryIds["beauty"]; price=168; memberPrice=138; duration=60; commissionRate=30; description="清洁补水基础护理"; isActive=$true; sort=1},
    @{name="深层清洁护理"; code="MR002"; category="beauty"; categoryId=$categoryIds["beauty"]; price=238; memberPrice=198; duration=75; commissionRate=30; description="毛孔深层清洁"; isActive=$true; sort=2},
    @{name="美白焕肤"; code="MR003"; category="beauty"; categoryId=$categoryIds["beauty"]; price=328; memberPrice=278; duration=90; commissionRate=25; description="美白精华导入焕肤"; isActive=$true; sort=3},
    @{name="抗衰老护理"; code="MR004"; category="beauty"; categoryId=$categoryIds["beauty"]; price=468; memberPrice=398; duration=90; commissionRate=25; description="胶原蛋白抗衰护理"; isActive=$true; sort=4},
    @{name="肩颈按摩"; code="MR005"; category="beauty"; categoryId=$categoryIds["beauty"]; price=128; memberPrice=98; duration=45; commissionRate=30; description="肩颈放松按摩"; isActive=$true; sort=5},
    @{name="全身精油SPA"; code="MR006"; category="beauty"; categoryId=$categoryIds["beauty"]; price=398; memberPrice=338; duration=90; commissionRate=25; description="精油全身放松SPA"; isActive=$true; sort=6},

    # 美甲美睫
    @{name="基础美甲"; code="MJ001"; category="nail"; categoryId=$categoryIds["nail"]; price=88; memberPrice=68; duration=60; commissionRate=35; description="修甲+单色涂甲油"; isActive=$true; sort=1},
    @{name="法式美甲"; code="MJ002"; category="nail"; categoryId=$categoryIds["nail"]; price=128; memberPrice=98; duration=75; commissionRate=35; description="优雅法式美甲"; isActive=$true; sort=2},
    @{name="光疗甲"; code="MJ003"; category="nail"; categoryId=$categoryIds["nail"]; price=168; memberPrice=138; duration=90; commissionRate=35; description="光疗凝胶美甲"; isActive=$true; sort=3},
    @{name="美甲彩绘"; code="MJ004"; category="nail"; categoryId=$categoryIds["nail"]; price=198; memberPrice=168; duration=90; commissionRate=35; description="手绘图案美甲"; isActive=$true; sort=4},
    @{name="嫁接睫毛（自然款）"; code="MJ005"; category="nail"; categoryId=$categoryIds["nail"]; price=168; memberPrice=138; duration=60; commissionRate=35; description="自然款睫毛嫁接"; isActive=$true; sort=5},
    @{name="嫁接睫毛（浓密款）"; code="MJ006"; category="nail"; categoryId=$categoryIds["nail"]; price=238; memberPrice=198; duration=75; commissionRate=35; description="浓密款睫毛嫁接"; isActive=$true; sort=6}
)

$serviceCount = 0
foreach ($svc in $services) {
    try {
        $body = $svc | ConvertTo-Json -Depth 3
        $result = Invoke-RestMethod -Uri "$baseUrl/services" -Method Post -ContentType "application/json" -Body $body -Headers $headers
        $serviceCount++
        Write-Host "  添加服务: $($svc.name) (¥$($svc.price))" -ForegroundColor Cyan
    } catch {
        Write-Host "  服务 $($svc.name) 添加失败: $_" -ForegroundColor Red
    }
}
Write-Host "  共添加 $serviceCount 个服务项目" -ForegroundColor Yellow

# 4. 添加员工
Write-Host "`n=== 添加员工 ===" -ForegroundColor Green

$employees = @(
    @{name="张美发"; employeeNo="E001"; phone="13800001001"; position="美发总监"; hireDate="2023-03-15"; commissionType="percent"; baseCommissionRate=35},
    @{name="李造型"; employeeNo="E002"; phone="13800001002"; position="高级美发师"; hireDate="2023-06-01"; commissionType="percent"; baseCommissionRate=30},
    @{name="王剪发"; employeeNo="E003"; phone="13800001003"; position="美发师"; hireDate="2024-01-10"; commissionType="percent"; baseCommissionRate=25},
    @{name="赵美容"; employeeNo="E004"; phone="13800001004"; position="美容总监"; hireDate="2023-04-20"; commissionType="percent"; baseCommissionRate=35},
    @{name="孙护肤"; employeeNo="E005"; phone="13800001005"; position="高级美容师"; hireDate="2023-08-15"; commissionType="percent"; baseCommissionRate=30},
    @{name="周美甲"; employeeNo="E006"; phone="13800001006"; position="美甲师"; hireDate="2024-02-01"; commissionType="percent"; baseCommissionRate=35},
    @{name="吴睫毛"; employeeNo="E007"; phone="13800001007"; position="美睫师"; hireDate="2024-03-10"; commissionType="percent"; baseCommissionRate=35},
    @{name="陈前台"; employeeNo="E008"; phone="13800001008"; position="前台接待"; hireDate="2024-01-05"; commissionType="fixed"; commissionValue=2000}
)

$employeeCount = 0
foreach ($emp in $employees) {
    try {
        $body = $emp | ConvertTo-Json -Depth 3
        $result = Invoke-RestMethod -Uri "$baseUrl/employees" -Method Post -ContentType "application/json" -Body $body -Headers $headers
        $employeeCount++
        Write-Host "  添加员工: $($emp.name) ($($emp.position))" -ForegroundColor Cyan
    } catch {
        Write-Host "  员工 $($emp.name) 添加失败: $_" -ForegroundColor Red
    }
}
Write-Host "  共添加 $employeeCount 名员工" -ForegroundColor Yellow

# 5. 添加会员
Write-Host "`n=== 添加会员 ===" -ForegroundColor Green

$members = @(
    @{name="刘小美"; phone="13900001001"; gender="女"; birthday="1990-05-15"; level="gold"; balance=5000; remark="VIP客户"},
    @{name="张大帅"; phone="13900001002"; gender="男"; birthday="1985-08-20"; level="silver"; balance=2000; remark="常客"},
    @{name="王丽丽"; phone="13900001003"; gender="女"; birthday="1992-12-03"; level="diamond"; balance=10000; remark="超级VIP"},
    @{name="赵小明"; phone="13900001004"; gender="男"; birthday="1988-03-28"; level="normal"; balance=500; remark="新客户"},
    @{name="李芳芳"; phone="13900001005"; gender="女"; birthday="1995-07-11"; level="gold"; balance=3000; remark="推荐客户"},
    @{name="陈美美"; phone="13900001006"; gender="女"; birthday="1993-09-25"; level="silver"; balance=1500; remark=""},
    @{name="周杰"; phone="13900001007"; gender="男"; birthday="1987-01-14"; level="normal"; balance=200; remark="首次到店"},
    @{name="吴佳佳"; phone="13900001008"; gender="女"; birthday="1996-11-08"; level="gold"; balance=4500; remark="老客户"},
    @{name="孙丽"; phone="13900001009"; gender="女"; birthday="1991-04-22"; level="silver"; balance=1800; remark=""},
    @{name="郑美玲"; phone="13900001010"; gender="女"; birthday="1994-06-30"; level="normal"; balance=300; remark="新会员"}
)

$memberCount = 0
foreach ($mem in $members) {
    try {
        $body = $mem | ConvertTo-Json -Depth 3
        $result = Invoke-RestMethod -Uri "$baseUrl/members" -Method Post -ContentType "application/json" -Body $body -Headers $headers
        $memberCount++
        Write-Host "  添加会员: $($mem.name) ($($mem.level))" -ForegroundColor Cyan
    } catch {
        Write-Host "  会员 $($mem.name) 添加失败: $_" -ForegroundColor Red
    }
}
Write-Host "  共添加 $memberCount 名会员" -ForegroundColor Yellow

# 6. 添加房间
Write-Host "`n=== 添加房间 ===" -ForegroundColor Green

$rooms = @(
    @{name="美发1号位"; code="HF001"; type="chair"; capacity=1; status="available"; isActive=$true; sort=1; remark="靠窗位置"},
    @{name="美发2号位"; code="HF002"; type="chair"; capacity=1; status="available"; isActive=$true; sort=2; remark=""},
    @{name="美发3号位"; code="HF003"; type="chair"; capacity=1; status="available"; isActive=$true; sort=3; remark=""},
    @{name="美发4号位"; code="HF004"; type="chair"; capacity=1; status="available"; isActive=$true; sort=4; remark=""},
    @{name="美容VIP房"; code="MR001"; type="room"; capacity=1; status="available"; isActive=$true; sort=5; remark="独立VIP房间"; facilities=@("美容床","蒸汽机","音响")},
    @{name="美容2号房"; code="MR002"; type="room"; capacity=1; status="available"; isActive=$true; sort=6; remark=""; facilities=@("美容床","蒸汽机")},
    @{name="美容3号房"; code="MR003"; type="room"; capacity=1; status="available"; isActive=$true; sort=7; remark=""; facilities=@("美容床")},
    @{name="美甲区1号"; code="MJ001"; type="chair"; capacity=1; status="available"; isActive=$true; sort=8; remark="美甲专区"},
    @{name="美甲区2号"; code="MJ002"; type="chair"; capacity=1; status="available"; isActive=$true; sort=9; remark="美甲专区"},
    @{name="SPA套房"; code="SPA001"; type="room"; capacity=2; status="available"; isActive=$true; sort=10; remark="双人SPA套房"; facilities=@("SPA床","淋浴","音响","香薰")},
    @{name="洗头区1号"; code="XT001"; type="chair"; capacity=1; status="available"; isActive=$true; sort=11; remark="洗头区"},
    @{name="洗头区2号"; code="XT002"; type="chair"; capacity=1; status="available"; isActive=$true; sort=12; remark="洗头区"}
)

$roomCount = 0
foreach ($room in $rooms) {
    try {
        $body = $room | ConvertTo-Json -Depth 3
        $result = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method Post -ContentType "application/json" -Body $body -Headers $headers
        $roomCount++
        Write-Host "  添加房间: $($room.name) ($($room.type))" -ForegroundColor Cyan
    } catch {
        Write-Host "  房间 $($room.name) 添加失败: $_" -ForegroundColor Red
    }
}
Write-Host "  共添加 $roomCount 个房间/座位" -ForegroundColor Yellow

# 7. 验证数据
Write-Host "`n=== 验证数据 ===" -ForegroundColor Green

$servicesData = Invoke-RestMethod -Uri "$baseUrl/services" -Method Get -Headers $headers
Write-Host "  服务项目: $($servicesData.total) 条" -ForegroundColor Cyan

$membersData = Invoke-RestMethod -Uri "$baseUrl/members" -Method Get -Headers $headers
Write-Host "  会员: $($membersData.Count) 条" -ForegroundColor Cyan

$employeesData = Invoke-RestMethod -Uri "$baseUrl/employees" -Method Get -Headers $headers
Write-Host "  员工: $($employeesData.Count) 条" -ForegroundColor Cyan

$roomsData = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method Get -Headers $headers
Write-Host "  房间/座位: $($roomsData.Count) 条" -ForegroundColor Cyan

Write-Host "`n=== 测试数据添加完成！ ===" -ForegroundColor Green
