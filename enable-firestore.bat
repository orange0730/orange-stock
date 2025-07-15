@echo off
chcp 65001 > nul
echo.
echo ===================================
echo   啟用 Google Firestore
echo ===================================
echo.

echo 這個腳本會引導您設置 Firestore
echo.

echo 步驟 1：確認 Firebase 專案
echo -------------------------
echo 請先在瀏覽器中開啟 Firebase Console
echo.
start https://console.firebase.google.com/
echo.
echo 1. 選擇或創建專案 (專案 ID: orange-stock-465916)
echo 2. 啟用 Firestore Database
echo 3. 選擇生產模式和 us-central1 位置
echo.
pause

echo.
echo 步驟 2：下載服務帳戶金鑰
echo -------------------------
echo 在 Firebase Console 中：
echo 1. 點擊專案設定（齒輪圖標）
echo 2. 選擇「服務帳戶」標籤
echo 3. 點擊「生成新的私鑰」
echo 4. 下載 JSON 檔案
echo 5. 將檔案重命名為 firestore-key.json
echo 6. 將檔案放在專案根目錄
echo.
echo 請完成以上步驟後按任意鍵繼續...
pause

echo.
echo 步驟 3：檢查檔案
echo -------------------------
if exist firestore-key.json (
    echo ✅ 找到 firestore-key.json
) else (
    echo ❌ 找不到 firestore-key.json
    echo 請確保檔案在專案根目錄中
    pause
    exit /b 1
)

echo.
echo 步驟 4：安裝依賴
echo -------------------------
echo 正在安裝 Firebase Admin SDK...
npm install firebase-admin@^12.0.0

echo.
echo 步驟 5：設置環境變數
echo -------------------------
echo 正在更新 Cloud Run 環境變數...
gcloud run services update orange-trade ^
    --update-env-vars FIRESTORE_ENABLED=true,FIRESTORE_PROJECT_ID=orange-stock-465916 ^
    --region us-central1

echo.
echo ✅ Firestore 設置完成！
echo.
echo 接下來：
echo 1. 執行 test-firestore.bat 測試連接
echo 2. 執行 deploy-firestore-update.bat 部署更新
echo.
pause 