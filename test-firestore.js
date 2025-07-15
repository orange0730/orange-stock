// 測試 Firestore 連接
const { initFirestore, getFirestore, admin } = require('./database/firestore-init');

async function testFirestore() {
    console.log('🔥 測試 Firestore 連接...\n');
    
    try {
        // 初始化 Firestore
        await initFirestore();
        console.log('✅ Firestore 初始化成功\n');
        
        const db = getFirestore();
        
        // 測試寫入
        console.log('📝 測試寫入數據...');
        const testDoc = await db.collection('test').add({
            message: 'Hello from Orange Stock!',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            testTime: new Date().toISOString()
        });
        console.log('✅ 寫入成功，文檔 ID:', testDoc.id, '\n');
        
        // 測試讀取
        console.log('📖 測試讀取數據...');
        const doc = await testDoc.get();
        const data = doc.data();
        console.log('✅ 讀取成功:', data, '\n');
        
        // 測試更新
        console.log('✏️ 測試更新數據...');
        await testDoc.update({
            updated: true,
            updateTime: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ 更新成功\n');
        
        // 測試查詢
        console.log('🔍 測試查詢數據...');
        const querySnapshot = await db.collection('test')
            .where('message', '==', 'Hello from Orange Stock!')
            .get();
        console.log(`✅ 找到 ${querySnapshot.size} 個匹配的文檔\n`);
        
        // 測試刪除
        console.log('🗑️ 測試刪除數據...');
        await testDoc.delete();
        console.log('✅ 刪除成功\n');
        
        // 檢查系統設定
        console.log('⚙️ 檢查系統設定...');
        const settingsRef = db.collection('settings').doc('system');
        const settingsDoc = await settingsRef.get();
        
        if (settingsDoc.exists) {
            console.log('✅ 系統設定已存在:', settingsDoc.data());
        } else {
            console.log('📝 創建初始系統設定...');
            await settingsRef.set({
                currentPrice: 100,
                openPrice: 100,
                dayHigh: 100,
                dayLow: 100,
                totalVolume: 0,
                lastUpdate: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ 系統設定創建成功');
        }
        
        console.log('\n🎉 所有測試通過！Firestore 連接正常。');
        
    } catch (error) {
        console.error('\n❌ 測試失敗:', error.message);
        console.error('\n詳細錯誤:', error);
        
        console.log('\n可能的解決方案：');
        console.log('1. 確認 firestore-key.json 檔案存在且格式正確');
        console.log('2. 確認 Firebase 專案已啟用 Firestore');
        console.log('3. 確認服務帳戶有正確的權限');
        console.log('4. 檢查網路連接');
    }
    
    process.exit(0);
}

// 執行測試
testFirestore(); 