const { CosmosClient } = require('@azure/cosmos');

// 從環境變數讀取設定
const endpoint = process.env.COSMOS_ENDPOINT || '';
const key = process.env.COSMOS_KEY || '';
const databaseId = process.env.COSMOS_DATABASE || 'orange-stock';

let cosmosClient;
let database;
let containers = {};

// 初始化 Cosmos DB 連接
async function initCosmosDB() {
    try {
        if (!endpoint || !key) {
            console.log('⚠️ Cosmos DB 未配置，使用記憶體儲存');
            return false;
        }

        // 創建 Cosmos Client
        cosmosClient = new CosmosClient({ endpoint, key });
        
        // 創建或取得資料庫
        const { database: db } = await cosmosClient.databases.createIfNotExists({
            id: databaseId
        });
        database = db;
        
        // 創建容器
        await createContainers();
        
        console.log('✅ Azure Cosmos DB 連接成功！');
        return true;
    } catch (error) {
        console.error('❌ Cosmos DB 連接失敗:', error.message);
        return false;
    }
}

// 創建所需的容器
async function createContainers() {
    // 用戶容器
    const { container: usersContainer } = await database.containers.createIfNotExists({
        id: 'users',
        partitionKey: { paths: ['/username'] }
    });
    containers.users = usersContainer;
    
    // 交易記錄容器
    const { container: transactionsContainer } = await database.containers.createIfNotExists({
        id: 'transactions',
        partitionKey: { paths: ['/userId'] }
    });
    containers.transactions = transactionsContainer;
    
    // 股票歷史容器
    const { container: stockHistoryContainer } = await database.containers.createIfNotExists({
        id: 'stockHistory',
        partitionKey: { paths: ['/date'] }
    });
    containers.stockHistory = stockHistoryContainer;
    
    // 限價單容器
    const { container: limitOrdersContainer } = await database.containers.createIfNotExists({
        id: 'limitOrders',
        partitionKey: { paths: ['/userId'] }
    });
    containers.limitOrders = limitOrdersContainer;
}

// 取得容器
function getContainer(containerName) {
    return containers[containerName];
}

// 檢查是否已連接
function isConnected() {
    return !!cosmosClient && !!database;
}

module.exports = {
    initCosmosDB,
    getContainer,
    isConnected
}; 