const { getDb, isUsingFirestore } = require('../database/init');

// 當前股價（記憶體快取）
let currentPrice = 10.00;

// 價格影響參數（可調整）
let priceImpactSettings = {
  buyImpactMultiplier: 0.7,
  sellImpactMultiplier: 0.7,
  volumeDecayFactor: 1500,
  randomFluctuation: 0.02
};

// 獲取當前股價
function getStockPrice() {
  return currentPrice;
}

// 獲取價格影響設置
function getPriceImpactSettings() {
  return priceImpactSettings;
}

// 更新股價
function updateStockPrice(type, quantity) {
  const oldPrice = currentPrice;
  let volumeImpact = Math.log(1 + quantity / priceImpactSettings.volumeDecayFactor);
  let randomFactor = 1 + (Math.random() - 0.5) * priceImpactSettings.randomFluctuation;
  
  if (type === 'buy') {
    currentPrice = currentPrice * (1 + volumeImpact * priceImpactSettings.buyImpactMultiplier) * randomFactor;
  } else if (type === 'sell') {
    currentPrice = currentPrice * (1 - volumeImpact * priceImpactSettings.sellImpactMultiplier) * randomFactor;
  }
  
  currentPrice = Math.max(0.01, Math.round(currentPrice * 100) / 100);
  console.log(`股價更新: $${oldPrice} → $${currentPrice} (${type} ${quantity}股)`);
  
  return currentPrice;
}

// 簡化版本的其他函數
function getStockPriceHistory(limit = 50) {
  return Promise.resolve([]);
}

function getStockStats() {
  return Promise.resolve({
    currentPrice,
    openPrice: currentPrice,
    highPrice: currentPrice * 1.05,
    lowPrice: currentPrice * 0.95,
    change: 0,
    changePercent: 0,
    volume: 0
  });
}

async function initializeStockPrice() {
  console.log(`使用預設Orange股價: $${currentPrice}`);
  return currentPrice;
}

function updatePriceImpactSettings(newSettings) {
  priceImpactSettings = { ...priceImpactSettings, ...newSettings };
  console.log('價格影響設置已更新:', priceImpactSettings);
  return Promise.resolve(priceImpactSettings);
}

function loadPriceImpactSettings() {
  console.log('使用預設價格影響設置');
  return Promise.resolve();
}

function getTodayStockInfo() {
  return Promise.resolve({
    openPrice: currentPrice,
    currentPrice: currentPrice,
    highPrice: currentPrice * 1.05,
    lowPrice: currentPrice * 0.95,
    volume: 0,
    lastUpdate: new Date().toISOString()
  });
}

function getFiveLevelQuotes() {
  return Promise.resolve({
    buy: [],
    sell: []
  });
}

function getRecentTrades(limit = 10) {
  return Promise.resolve([]);
}

module.exports = {
  getStockPrice,
  updateStockPrice,
  getStockPriceHistory,
  getStockStats,
  initializeStockPrice,
  getPriceImpactSettings,
  updatePriceImpactSettings,
  loadPriceImpactSettings,
  getTodayStockInfo,
  getFiveLevelQuotes,
  getRecentTrades
};