# Moraya Windows构建脚本 (PowerShell)
# 功能：自动解决编译依赖、打包运行依赖、支持指定构建目录

param(
    [string]$BuildDir = "C:\Temp\moraya-build",
    [switch]$Clean,
    [switch]$Keep,
    [switch]$SkipDeps,
    [string]$Target = "windows",
    [string]$Mode = "release",
    [string]$Package = "all",
    [switch]$Verbose,
    [switch]$Help
)

$SCRIPT_VERSION = "1.0.0"
$SCRIPT_NAME = "Moraya Builder (Windows)"

# 颜色输出函数
function Log-Info {
    Write-Host "[INFO] $args" -ForegroundColor Blue
}

function Log-Success {
    Write-Host "[SUCCESS] $args" -ForegroundColor Green
}

function Log-Warning {
    Write-Host "[WARNING] $args" -ForegroundColor Yellow
}

function Log-Error {
    Write-Host "[ERROR] $args" -ForegroundColor Red
}

# 显示帮助
if ($Help) {
    Write-Host @"
$SCRIPT_NAME v$SCRIPT_VERSION - Moraya统一构建脚本

用法:
    .\build.ps1 [选项]

选项:
    -BuildDir DIR        指定构建目录（默认: C:\Temp\moraya-build）
    -Clean               构建前清理构建目录
    -Keep                构建后保留构建目录（默认删除）
    -SkipDeps            跳过依赖安装（假设已安装）
    -Target PLATFORM     指定构建目标（默认: windows）
    -Mode MODE           构建模式（release/dev，默认: release）
    -Package TYPE        指定打包类型（msi/nsis/portable/all，默认: all）
    -Verbose             显示详细输出
    -Help                显示帮助信息

示例:
    # 默认构建
    .\build.ps1

    # 指定构建目录
    .\build.ps1 -BuildDir D:\Build\moraya

    # 清理后构建并保留
    .\build.ps1 -Clean -Keep

    # 只构建NSIS包
    .\build.ps1 -Package nsis

"@ -ForegroundColor Cyan
    exit 0
}

# ============================================
# 依赖检查
# ============================================

function Check-NodeJS {
    try {
        $nodeVersion = (node --version).Replace("v", "")
        $nodeMajor = [int]($nodeVersion.Split(".")[0])
        
        if ($nodeMajor -lt 18) {
            Log-Warning "Node.js版本过低: v$nodeVersion (需要 >= 18)"
            return $false
        }
        
        Log-Success "Node.js版本: v$nodeVersion"
        return $true
    } catch {
        Log-Warning "Node.js未安装"
        return $false
    }
}

function Install-NodeJS {
    Log-Info "安装Node.js..."
    Log-Warning "Windows平台请手动安装Node.js: https://nodejs.org/"
    Log-Info "推荐使用nvm-windows管理Node.js版本"
    exit 1
}

function Check-Pnpm {
    try {
        $pnpmVersion = (pnpm --version)
        $pnpmMajor = [int]($pnpmVersion.Split(".")[0])
        
        if ($pnpmMajor -lt 8) {
            Log-Warning "pnpm版本过低: v$pnpmVersion (需要 >= 8)"
            return $false
        }
        
        Log-Success "pnpm版本: v$pnpmVersion"
        return $true
    } catch {
        Log-Warning "pnpm未安装"
        return $false
    }
}

function Install-Pnpm {
    Log-Info "安装pnpm..."
    npm install -g pnpm
    Log-Success "pnpm安装完成"
}

function Check-Rust {
    try {
        $rustVersion = (rustc --version).Split(" ")[1]
        $rustMajor = [int]($rustVersion.Split(".")[0])
        $rustMinor = [int]($rustVersion.Split(".")[1])
        
        if ($rustMajor -lt 1 -or ($rustMajor -eq 1 -and $rustMinor -lt 70)) {
            Log-Warning "Rust版本过低: $rustVersion (需要 >= 1.70)"
            return $false
        }
        
        Log-Success "Rust版本: $rustVersion"
        return $true
    } catch {
        Log-Warning "Rust未安装"
        return $false
    }
}

function Install-Rust {
    Log-Info "安装Rust..."
    Log-Warning "Windows平台请手动安装Rust: https://rustup.rs/"
    Log-Info "或使用: winget install Rustlang.Rustup"
    exit 1
}

function Check-MSVC {
    # 检查MSVC Build Tools
    $vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    
    if (Test-Path $vsWhere) {
        $vsInstallations = & $vsWhere -latest -property installationPath
        if ($vsInstallations) {
            Log-Success "Visual Studio已安装: $vsInstallations"
            return $true
        }
    }
    
    Log-Warning "MSVC Build Tools未安装"
    return $false
}

function Install-MSVC {
    Log-Info "安装MSVC Build Tools..."
    Log-Warning "请手动安装Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
    Log-Info "选择: Desktop development with C++"
    exit 1
}

function Check-WebView2 {
    # WebView2通常已预装在Windows 10/11
    $webView2Path = "${env:ProgramFiles(x86)}\Microsoft\EdgeWebView\Application"
    
    if (Test-Path $webView2Path) {
        Log-Success "WebView2已安装"
        return $true
    }
    
    Log-Warning "WebView2未安装"
    return $false
}

function Install-WebView2 {
    Log-Info "安装WebView2..."
    Log-Warning "请手动安装WebView2 Runtime: https://developer.microsoft.com/en-us/microsoft-edge/webview2/"
    exit 1
}

function Check-All-Deps {
    Log-Info "检查所有依赖..."
    
    $depsOk = $true
    
    if (-not (Check-NodeJS)) { $depsOk = $false }
    if (-not (Check-Pnpm)) { $depsOk = $false }
    if (-not (Check-Rust)) { $depsOk = $false }
    if (-not (Check-MSVC)) { $depsOk = $false }
    if (-not (Check-WebView2)) { $depsOk = $false }
    
    if ($depsOk) {
        Log-Success "所有依赖检查通过"
        return $true
    } else {
        Log-Warning "部分依赖缺失"
        return $false
    }
}

function Install-All-Deps {
    Log-Info "安装所有缺失依赖..."
    
    if (-not (Check-NodeJS)) { Install-NodeJS }
    if (-not (Check-Pnpm)) { Install-Pnpm }
    if (-not (Check-Rust)) { Install-Rust }
    if (-not (Check-MSVC)) { Install-MSVC }
    if (-not (Check-WebView2)) { Install-WebView2 }
    
    Log-Success "所有依赖安装完成"
}

# ============================================
# 构建目录准备
# ============================================

function Prepare-Build-Dir {
    Log-Info "准备构建目录: $BuildDir"
    
    # 创建构建目录
    New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
    
    # 清理构建目录（如指定）
    if ($Clean) {
        Log-Info "清理构建目录..."
        Remove-Item -Recurse -Force "$BuildDir\*" -ErrorAction SilentlyContinue
    }
    
    # 获取源码目录
    $sourceDir = Split-Path -Parent $PSScriptRoot
    Log-Info "源码目录: $sourceDir"
    
    # 复制源码到构建目录
    Log-Info "复制源码到构建目录..."
    
    $excludeItems = @(
        "node_modules",
        ".git",
        "build",
        ".svelte-kit",
        "src-tauri\target",
        "tests\*\target"
    )
    
    robocopy $sourceDir $BuildDir /MIR /XD $excludeItems /NFL /NDL /NJH /NJS
    
    Log-Success "源码复制完成"
}

# ============================================
# 安装项目依赖
# ============================================

function Install-Project-Deps {
    Log-Info "安装项目依赖..."
    
    Push-Location $BuildDir
    
    # Node.js依赖
    Log-Info "安装Node.js依赖..."
    pnpm install --frozen-lockfile
    
    # Rust依赖
    Log-Info "检查Rust依赖..."
    Push-Location src-tauri
    cargo fetch
    Pop-Location
    
    Pop-Location
    
    Log-Success "项目依赖安装完成"
}

# ============================================
# 执行构建
# ============================================

function Run-Build {
    Log-Info "执行构建（模式: $Mode）..."
    
    Push-Location $BuildDir
    
    if ($Mode -eq "dev") {
        # 开发构建
        Log-Info "开发构建（仅前端）..."
        pnpm build
        
        Log-Success "开发构建完成"
        Log-Info "产物位置: $BuildDir\build\"
        
    } else {
        # 生产构建
        Log-Info "生产构建（完整打包）..."
        
        switch ($Package) {
            "msi" {
                Log-Info "构建MSI包..."
                pnpm tauri build --bundles msi
            }
            "nsis" {
                Log-Info "构建NSIS包..."
                pnpm tauri build --bundles nsis
            }
            "portable" {
                Log-Info "构建便携版..."
                pnpm tauri build
                # 后续打包
            }
            "all" {
                Log-Info "构建所有Windows包..."
                pnpm tauri build --bundles msi,nsis
            }
        }
        
        Log-Success "构建完成"
        
        # 显示产物位置
        $bundleDir = "$BuildDir\src-tauri\target\release\bundle"
        Log-Info "产物位置: $bundleDir"
        
        Get-ChildItem -Path $bundleDir -Recurse | 
            Where-Object { $_.Extension -match "\.(msi|exe)$" } |
            ForEach-Object { 
                $size = ($_ | Get-Item).Length / 1MB
                Log-Info "$($_.Name): $([math]::Round($size, 2)) MB"
            }
    }
    
    Pop-Location
}

# ============================================
# 打包运行依赖
# ============================================

function Package-Deps {
    Log-Info "打包运行依赖..."
    
    Push-Location $BuildDir
    
    $depsPackage = "$BuildDir\moraya-dependencies.zip"
    
    # 打包node_modules
    Compress-Archive -Path "node_modules" -DestinationPath $depsPackage -Force
    
    Pop-Location
    
    Log-Success "运行依赖已打包: $depsPackage"
    
    $size = (Get-Item $depsPackage).Length / 1MB
    Log-Info "大小: $([math]::Round($size, 2)) MB"
}

# ============================================
# 清理构建目录
# ============================================

function Cleanup-Build-Dir {
    if (-not $Keep) {
        Log-Info "清理构建目录..."
        Remove-Item -Recurse -Force $BuildDir -ErrorAction SilentlyContinue
        Log-Success "构建目录已清理"
    } else {
        Log-Info "保留构建目录: $BuildDir"
    }
}

# ============================================
# 主流程
# ============================================

Log-Info "=========================================="
Log-Info "$SCRIPT_NAME v$SCRIPT_VERSION"
Log-Info "=========================================="

# 1. 检查和安装依赖
if (-not $SkipDeps) {
    if (-not (Check-All-Deps)) {
        Install-All-Deps
    }
} else {
    Log-Info "跳过依赖安装"
}

# 2. 准备构建目录
Prepare-Build-Dir

# 3. 安装项目依赖
if (-not $SkipDeps) {
    Install-Project-Deps
}

# 4. 执行构建
Run-Build

# 5. 打包运行依赖（可选）
if ($Mode -eq "release") {
    Package-Deps
}

# 6. 清理构建目录
Cleanup-Build-Dir

Log-Success "=========================================="
Log-Success "构建完成！"
Log-Success "=========================================="

exit 0