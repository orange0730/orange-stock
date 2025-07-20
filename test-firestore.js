require('dotenv').config();
const { initFirestore } = require('./database/firestore-db');

async function test() {
    console.log('🔍 測試 Google Firestore 連接...');
    console.log('');
    console.log('環境變數檢查：');
    console.log('- FIRESTORE_KEY_PATH:', process.env.FIRESTORE_KEY_PATH || './firestore-key.json (預設)');
    console.log('- FIRESTORE_PROJECT_ID:', process.env.FIRESTORE_PROJECT_ID || 'orange-stock-a65bb (預設)');
    console.log('');
    
    try {
        const success = await initFirestore();
        if (success) {
            console.log('✅ Firestore 連接成功！');
            console.log('');
            console.log('下一步：');
            console.log('1. 設定 FIRESTORE_ENABLED=true 來啟用 Firestore');
            console.log('2. 執行 npm start 啟動應用程式');
            console.log('3. 測試註冊和登入功能');
        } else {
            console.log('❌ Firestore 連接失敗');
            console.log('請檢查：');
            console.log('1. firestore-key.json 檔案是否存在');
            console.log('2. 服務帳戶是否有正確權限');
            console.log('3. 專案 ID 是否正確');
        }
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
    
    process.exit(0);
}

test(); 