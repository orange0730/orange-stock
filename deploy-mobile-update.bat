@echo off
chcp 65001 > nul
echo.
echo ===================================
echo   部署手機版介面更新
echo ===================================
echo.

echo 正在準備部署手機版介面更新...
echo.

echo 新增的檔案：
echo - public/styles-mobile.css (手機版樣式)
echo - public/mobile-enhancements.js (手機版增強功能)
echo - 手機版介面改善說明.md (說明文檔)
echo.

echo 修改的檔案：
echo - public/index.html (添加手機版資源)
echo - public/styles.css (添加底部導航隱藏)
echo - public/app.js (添加底部導航功能)
echo.

echo 請選擇部署方式：
echo 1. 提交到 GitHub 並手動部署
echo 2. 提交到 GitHub 並自動部署（需先設置）
echo 3. 只提交到 GitHub
echo 4. 退出
echo.

set /p choice="請輸入選項 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 正在提交更改到 GitHub...
    git add .
    git commit -m "feat: 添加手機版介面優化 - 底部導航、手勢支援、觸控優化"
    git push origin master
    
    echo.
    echo 正在部署到 Google Cloud Run...
    call redeploy.bat
    
    echo.
    echo ✅ 部署完成！
    echo.
    echo 請在手機上訪問以下網址測試：
    echo https://orange-trade-1069330928314.us-central1.run.app
    echo.
    pause
) else if "%choice%"=="2" (
    echo.
    echo 正在提交更改到 GitHub...
    git add .
    git commit -m "feat: 添加手機版介面優化 - 底部導航、手勢支援、觸控優化"
    git push origin master
    
    echo.
    echo ✅ 已推送到 GitHub！
    echo.
    echo 如果您已設置自動部署，系統將在 2-5 分鐘內自動更新。
    echo 您可以在這裡查看部署進度：
    echo https://console.cloud.google.com/cloud-build/builds?project=orange-stock-465916
    echo.
    pause
) else if "%choice%"=="3" (
    echo.
    echo 正在提交更改到 GitHub...
    git add .
    git commit -m "feat: 添加手機版介面優化 - 底部導航、手勢支援、觸控優化"
    git push origin master
    
    echo.
    echo ✅ 已成功提交到 GitHub！
    echo.
    pause
) else if "%choice%"=="4" (
    exit
) else (
    echo 無效的選項！
    pause
    exit
) 