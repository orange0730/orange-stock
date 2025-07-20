// 測試登入功能
require('dotenv').config();
process.env.FIRESTORE_ENABLED = 'true';

const { registerUser, loginUser } = require('./services/serviceLoader');

async function testLogin() {
    console.log('🔍 測試登入功能...');
    
    try {
        // 測試註冊
        console.log('1. 測試註冊新用戶...');
        const registerResult = await registerUser('testuser', 'test@example.com', 'password123');
        console.log('註冊結果:', registerResult.success ? '成功' : '失敗');
        
        // 測試登入
        console.log('2. 測試登入...');
        const loginResult = await loginUser('testuser', 'password123');
        console.log('登入結果:', loginResult.success ? '成功' : '失敗');
        
        if (loginResult.success) {
            console.log('✅ 登入功能正常');
        } else {
            console.log('❌ 登入失敗:', loginResult.message);
        }
        
    } catch (error) {
        console.error('❌ 測試過程出錯:', error.message);
    }
}

testLogin(); 