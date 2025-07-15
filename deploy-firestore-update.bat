@echo off
chcp 65001 > nul
echo.
echo ===================================
echo   部署 Firestore 更新
echo ===================================
echo.

echo 檢查 Firestore 設置...
if exist firestore-key.json (
    echo ✅ 找到 firestore-key.json
) else (
    echo ❌ 找不到 firestore-key.json
    echo 請先執行 enable-firestore.bat
    pause
    exit /b 1
)

echo.
echo 準備部署的更新：
echo - 支援 Firestore 數據庫
echo - 自動切換 SQLite/Firestore
echo - 數據永久保存
echo.

echo 請選擇部署方式：
echo 1. 提交並部署到 Cloud Run
echo 2. 只提交到 GitHub
echo 3. 退出
echo.

set /p choice="請輸入選項 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 正在提交更改...
    git add .
    git commit -m "feat: 整合 Firestore 實現數據持久化"
    git push origin master
    
    echo.
    echo 正在重建 Docker 映像並部署...
    gcloud builds submit --tag gcr.io/orange-stock-465916/orange-trade
    
    echo.
    echo 正在更新 Cloud Run 服務...
    gcloud run deploy orange-trade ^
        --image gcr.io/orange-stock-465916/orange-trade ^
        --platform managed ^
        --region us-central1 ^
        --allow-unauthenticated ^
        --update-env-vars FIRESTORE_ENABLED=true
    
    echo.
    echo ✅ 部署完成！
    echo.
    echo 您的應用現在使用 Firestore，資料不會再丟失了！
    echo.
    echo 訪問應用：https://orange-trade-1069330928314.us-central1.run.app
    echo.
    pause
) else if "%choice%"=="2" (
    echo.
    echo 正在提交更改...
    git add .
    git commit -m "feat: 整合 Firestore 實現數據持久化"
    git push origin master
    
    echo.
    echo ✅ 已提交到 GitHub！
    echo.
    echo 記得之後執行部署。
    pause
) else if "%choice%"=="3" (
    exit
) else (
    echo 無效的選項！
    pause
) 