@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo 🚀 啟動 Docker 並部署到 Cloud Run
echo ==========================================
echo.

:: 檢查 Docker 是否在運行
docker version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker 未運行，正在啟動 Docker Desktop...
    echo.
    
    :: 嘗試啟動 Docker Desktop
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo 等待 Docker 啟動中...
    echo 這可能需要 30-60 秒...
    echo.
    
    :: 等待 Docker 啟動
    set count=0
    :wait_docker
    set /a count+=1
    if %count% gtr 30 goto docker_timeout
    
    docker version >nul 2>&1
    if errorlevel 1 (
        timeout /t 2 /nobreak >nul
        goto wait_docker
    )
    
    echo ✅ Docker 已啟動！
    echo.
) else (
    echo ✅ Docker 已在運行
    echo.
)

:: 執行部署腳本
echo 開始部署...
call deploy-with-firestore.bat
goto end

:docker_timeout
echo.
echo ❌ Docker 啟動超時
echo.
echo 請手動啟動 Docker Desktop 後再試一次
echo.
pause
exit /b 1

:end 