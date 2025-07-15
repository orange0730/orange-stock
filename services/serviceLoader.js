// 根據環境變數動態加載適當的服務

function getUserService() {
    if (process.env.FIRESTORE_ENABLED === 'true') {
        console.log('使用 Google Firestore 版本的 UserService');
        return require('./userService-firestore');
    } else if (process.env.COSMOS_ENABLED === 'true') {
        console.log('使用 Azure Cosmos DB 版本的 UserService');
        return require('./userService-cosmos');
    } else {
        console.log('使用記憶體版本的 UserService');
        return require('./userService');
    }
}

// 導出服務
const userService = getUserService();

module.exports = {
    // User Service 方法
    registerUser: userService.registerUser,
    loginUser: userService.loginUser,
    getUserInfo: userService.getUserInfo,
    updateUserPoints: userService.updateUserPoints,
    verifyToken: userService.verifyToken,
    getTopTraders: userService.getTopTraders,
    getUserHoldings: userService.getUserHoldings,
    getUserTransactions: userService.getUserTransactions,
    getUserPosition: userService.getUserPosition,
    checkUserExists: userService.checkUserExists
}; 