@echo off
chcp 65001 > nul
echo.
echo ===================================
echo   部署數據備份功能
echo ===================================
echo.

echo 新增功能說明：
echo 1. 管理員可以導出所有數據為 JSON 檔案
echo 2. 支援導入備份檔案還原數據
echo 3. 顯示數據庫統計信息
echo 4. 首頁顯示資料持久性警告
echo.

echo 請選擇部署方式：
echo 1. 提交並手動部署
echo 2. 只提交到 GitHub
echo 3. 退出
echo.

set /p choice="請輸入選項 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 正在提交更改...
    git add .
    git commit -m "feat: 添加數據備份功能解決資料持久性問題"
    git push origin master
    
    echo.
    echo 正在部署...
    call redeploy.bat
    
    echo.
    echo ✅ 部署完成！
    echo.
    echo 管理員可以在管理面板的「系統設置」標籤中找到備份功能。
    pause
) else if "%choice%"=="2" (
    echo.
    echo 正在提交更改...
    git add .
    git commit -m "feat: 添加數據備份功能解決資料持久性問題"
    git push origin master
    
    echo.
    echo ✅ 已提交到 GitHub！
    pause
) else if "%choice%"=="3" (
    exit
) else (
    echo 無效的選項！
    pause
) 