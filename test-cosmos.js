require('dotenv').config();
const { initCosmosDB } = require('./database/cosmos-db');

async function test() {
    console.log('🔍 測試 Azure Cosmos DB 連接...');
    console.log('');
    console.log('環境變數檢查：');
    console.log('- COSMOS_ENDPOINT:', process.env.COSMOS_ENDPOINT ? '已設定' : '❌ 未設定');
    console.log('- COSMOS_KEY:', process.env.COSMOS_KEY ? '已設定' : '❌ 未設定');
    console.log('- COSMOS_DATABASE:', process.env.COSMOS_DATABASE || 'orange-stock (預設)');
    console.log('');
    
    if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY) {
        console.log('❌ 請先設定環境變數：');
        console.log('   COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/');
        console.log('   COSMOS_KEY=your-primary-key');
        process.exit(1);
    }
    
    const success = await initCosmosDB();
    if (success) {
        console.log('✅ Cosmos DB 連接成功！');
        console.log('');
        console.log('下一步：');
        console.log('1. 設定 COSMOS_ENABLED=true 來啟用 Cosmos DB');
        console.log('2. 執行 npm start 啟動應用程式');
        console.log('3. 測試註冊和登入功能');
    } else {
        console.log('❌ Cosmos DB 連接失敗');
        console.log('請檢查：');
        console.log('1. Cosmos DB 帳戶是否已創建');
        console.log('2. 端點和金鑰是否正確');
        console.log('3. 網路連接是否正常');
    }
    process.exit(0);
}

test(); 