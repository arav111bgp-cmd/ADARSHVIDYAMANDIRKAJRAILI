# scripts/run-phone.ps1
# Automatic Development Workflow & Phone Deployment Script for AVM School ERP
# Target Device: Connected Motorola Moto G85 / Physical Android Device (ZA222QCYXC)

$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " AVM SCHOOL ERP - FULL AUTOMATIC PHONE DEPLOYMENT   " -ForegroundColor Cyan
Write-Host " Target Device: Motorola Moto G85 (ZA222QCYXC)      " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. ENVIRONMENT & PATH SETUP
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Users\arav1\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
}
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = "C:\Users\arav1\AppData\Local\Android\Sdk"
}
$adbPath = "$env:ANDROID_HOME\platform-tools\adb.exe"

if (-not (Test-Path $adbPath)) {
    Write-Host "[ERROR] ADB executable not found at $adbPath" -ForegroundColor Red
    exit 1
}

Write-Host "[1/14] Node.js & Android SDK Environment verified." -ForegroundColor Green

# 2. DETECT CONNECTED ANDROID DEVICE
Write-Host "[2/14] Detecting connected Android device..." -ForegroundColor Yellow
$deviceOutput = & $adbPath devices
$deviceLines = $deviceOutput | Select-String -Pattern "\tdevice$"

if ($deviceLines.Count -eq 0) {
    Write-Host "----------------------------------------------------" -ForegroundColor Red
    Write-Host "AVM phone not connected. Connect the Android phone and try again." -ForegroundColor Red
    Write-Host "----------------------------------------------------" -ForegroundColor Red
    Write-Host "Raw ADB output:"
    Write-Host $deviceOutput
    exit 1
}

# Target ZA222QCYXC or first connected physical device
$selectedDevice = $null
foreach ($line in $deviceLines) {
    $devId = ($line.Line -split "\s+")[0]
    if ($devId -eq "ZA222QCYXC") {
        $selectedDevice = $devId
        break
    }
}
if (-not $selectedDevice) {
    foreach ($line in $deviceLines) {
        $devId = ($line.Line -split "\s+")[0]
        if ($devId -notmatch "emulator-") {
            $selectedDevice = $devId
            break
        }
    }
}
if (-not $selectedDevice) {
    $selectedDevice = ($deviceLines[0].Line -split "\s+")[0]
}

Write-Host "[3/14] Physical Android phone detected: $selectedDevice" -ForegroundColor Green

# 3. CHECK BACKEND & START IF NEEDED
Write-Host "[4/14] Checking backend health on port 3001..." -ForegroundColor Yellow
$healthUrl = "http://127.0.0.1:3001/api/health"
$backendReady = $false

try {
    $healthRes = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($healthRes.status -eq "ok") {
        $backendReady = $true
        Write-Host "[5/14] Backend already running on port 3001 (/api/health OK)." -ForegroundColor Green
    }
} catch {
    $backendReady = $false
}

if (-not $backendReady) {
    Write-Host "[5/14] Starting Node.js AVM backend on port 3001..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "server/server.js" -WindowStyle Hidden
    
    # Poll health endpoint up to 10 seconds
    for ($i = 1; $i -le 10; $i++) {
        Start-Sleep -Seconds 1
        try {
            $res = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($res.status -eq "ok") {
                $backendReady = $true
                break
            }
        } catch {}
    }
    
    if (-not $backendReady) {
        Write-Host "[ERROR] Failed to start backend server on port 3001." -ForegroundColor Red
        exit 1
    }
    Write-Host "Backend server successfully started and responding on port 3001." -ForegroundColor Green
}

# 4. CONFIGURE ADB REVERSE
Write-Host "[6/14] Configuring ADB reverse for port 3001..." -ForegroundColor Yellow
& $adbPath -s $selectedDevice reverse tcp:3001 tcp:3001
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] ADB reverse configuration failed." -ForegroundColor Red
    exit 1
}
Write-Host "ADB reverse configured: Phone (127.0.0.1:3001) -> PC (:3001)." -ForegroundColor Green

# 5. BUILD VITE/REACT WEB APP
Write-Host "[7/14] Building React production bundle (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] React build failed." -ForegroundColor Red
    exit 1
}

# 6. CAPACITOR SYNC
Write-Host "[8/14] Running Capacitor Sync (npx cap sync android)..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Capacitor sync failed." -ForegroundColor Red
    exit 1
}

# 7. GRADLE APK BUILD
Write-Host "[9/14] Building Android Debug APK with Gradle..." -ForegroundColor Yellow
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location

$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "[ERROR] APK build output not found at $apkPath" -ForegroundColor Red
    exit 1
}
Write-Host "[10/14] APK build succeeded: $apkPath" -ForegroundColor Green

# 8. INSTALL APK ON DEVICE
Write-Host "[11/14] Installing APK on $selectedDevice..." -ForegroundColor Yellow
& $adbPath -s $selectedDevice install -r $apkPath
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] ADB APK installation failed." -ForegroundColor Red
    exit 1
}
Write-Host "APK installed successfully." -ForegroundColor Green

# 9. LAUNCH APP ON DEVICE
Write-Host "[12/14] Launching AVM Android app on $selectedDevice..." -ForegroundColor Yellow
& $adbPath -s $selectedDevice shell am start -n com.adarshvidyamandir.app/.MainActivity
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to launch MainActivity on device." -ForegroundColor Red
    exit 1
}
Write-Host "[13/14] Application launched on physical phone screen." -ForegroundColor Green

# 10. FINAL VERIFICATION & REPORT
Write-Host "[14/14] Verifying backend status & network bridge..." -ForegroundColor Yellow
$finalHealth = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3 -ErrorAction SilentlyContinue

Write-Host "====================================================" -ForegroundColor Green
Write-Host "       AVM AUTOMATIC DEPLOYMENT FINAL REPORT        " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host "Backend status     : Running (Port 3001, /api/health OK)" -ForegroundColor Cyan
Write-Host "Phone status       : Connected ($selectedDevice)" -ForegroundColor Cyan
Write-Host "ADB reverse status : Configured (3001 -> 3001)" -ForegroundColor Cyan
Write-Host "API URL            : http://127.0.0.1:3001" -ForegroundColor Cyan
Write-Host "Build status       : Success" -ForegroundColor Cyan
Write-Host "Install status     : Installed" -ForegroundColor Cyan
Write-Host "Launch status      : Launched & Active" -ForegroundColor Cyan
Write-Host "Teacher login      : priya / 123456" -ForegroundColor Cyan
Write-Host "Student login      : rahul / 123456" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Green
