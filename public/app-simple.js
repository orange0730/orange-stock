// 簡化版 Orange Stock 應用程式
class OrangeStockApp {
    constructor() {
        this.socket = null;
        this.chart = null;
        this.currentUser = null;
        this.currentPrice = 100.00;
        this.selectedPeriod = '1h';
        
        console.log('🍊 Orange Stock 應用程式啟動...');
        this.init();
    }

    init() {
        // 立即隱藏載入畫面
        this.hideLoadingOverlay();
        
        // 初始化各個功能
        this.checkAuthStatus();
        this.bindEvents();
        this.setupDefaultView();
        this.connectWebSocket();
        
        console.log('✅ Orange Stock 初始化完成');
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    setupDefaultView() {
        // 設置預設統計數據
        document.getElementById('heroCurrentPrice').textContent = '$100.00';
        document.getElementById('heroPriceChange').textContent = '+0.00%';
        document.getElementById('heroVolume').textContent = '0';
        
        // 繪製預設圖表
        this.renderDefaultChart();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('orangeToken');
        if (token) {
            // 驗證token並獲取用戶信息
            this.verifyTokenAndLoadUser(token);
        } else {
            this.showAuthSection();
        }
    }

    async verifyTokenAndLoadUser(token) {
        try {
            // 嘗試使用token獲取用戶資產信息來驗證token
            const response = await fetch('/api/trading/portfolio', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Token有效，設置用戶信息
                    this.currentUser = {
                        id: 1, // 使用默認值，實際ID會在需要時從JWT token中解析
                        username: 'User',
                        token: token
                    };
                    
                    this.showTradingSection();
                    await this.loadUserPortfolio();
                    return;
                }
            }
            
            // Token無效，清除並顯示登入界面
            localStorage.removeItem('orangeToken');
            this.showAuthSection();
        } catch (error) {
            console.error('驗證token失敗:', error);
            localStorage.removeItem('orangeToken');
            this.showAuthSection();
        }
    }

    bindEvents() {
        // 登入/註冊按鈕
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginForm());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterForm());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // 表單提交
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // 交易按鈕
        document.getElementById('buyBtn').addEventListener('click', () => this.handleTrade('buy'));
        document.getElementById('sellBtn').addEventListener('click', () => this.handleTrade('sell'));

        // 交易數量變更
        document.getElementById('tradeQuantity').addEventListener('input', () => this.updateTradeCosts());

        // 圖表時間段切換
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.changePeriod(period);
            });
        });

        // 個人檔案
        document.getElementById('profileBtn').addEventListener('click', () => this.showProfile());
        document.getElementById('closeProfileBtn').addEventListener('click', () => this.hideProfile());

        // 股票信息面板
        document.getElementById('stockInfoBtn').addEventListener('click', () => this.toggleStockInfo());

        // 管理員面板
        const adminPanelBtn = document.getElementById('adminPanelBtn');
        if (adminPanelBtn) {
            adminPanelBtn.addEventListener('click', () => this.showAdminPanel());
        }

        const closeAdminBtn = document.getElementById('closeAdminBtn');
        if (closeAdminBtn) {
            closeAdminBtn.addEventListener('click', () => this.hideAdminPanel());
        }

        // 限價單功能
        document.getElementById('createLimitOrderBtn').addEventListener('click', () => this.createLimitOrder());

        // 時間段切換按鈕
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                if (period) {
                    this.changePeriod(period);
                }
            });
        });

        // 手機菜單切換
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                const navMenu = document.getElementById('navMenu');
                navMenu.classList.toggle('active');
            });
        }

        // === 新增功能事件綁定 ===
        
        // 交易模式切換
        const tradeModeInputs = document.querySelectorAll('input[name="tradeMode"]');
        tradeModeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleTradeModeChange(e.target.value));
        });

        // 限價價格輸入變更
        const limitPriceInput = document.getElementById('limitPrice');
        if (limitPriceInput) {
            limitPriceInput.addEventListener('input', () => this.updateTradeCosts());
        }

        // 價格設置按鈕
        document.getElementById('priceSettingsBtn').addEventListener('click', () => this.showPriceSettings());
        document.getElementById('closePriceSettingsBtn').addEventListener('click', () => this.hidePriceSettings());

        // 價格設置滑桿
        this.bindPriceSettingsSliders();

        // 價格設置按鈕
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.savePriceSettings());
        document.getElementById('resetSettingsBtn').addEventListener('click', () => this.resetPriceSettings());

        // 模態框點擊外部關閉
        document.getElementById('priceSettingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'priceSettingsModal') {
                this.hidePriceSettings();
            }
        });
    }

    connectWebSocket() {
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('✅ WebSocket 連接成功');
                this.updateConnectionStatus(true);
                this.showNotification('已連接到服務器', 'success');
            });

            this.socket.on('disconnect', () => {
                console.log('❌ WebSocket 連接中斷');
                this.updateConnectionStatus(false);
            });

            this.socket.on('stock_price_update', (data) => {
                if (data && data.price) {
                    this.updateStockPrice(data);
                }
            });
        } catch (error) {
            console.error('WebSocket 連接失敗:', error);
            this.updateConnectionStatus(false);
        }
    }

    showAuthSection() {
        const authSection = document.getElementById('authSection');
        const tradingSection = document.getElementById('tradingSection');
        const navAuth = document.getElementById('navAuth');
        const navUserInfo = document.getElementById('navUserInfo');
        
        if (authSection) authSection.style.display = 'block';
        if (tradingSection) tradingSection.style.display = 'none';
        if (navAuth) navAuth.style.display = 'flex';
        if (navUserInfo) navUserInfo.style.display = 'none';
        
        this.showLoginForm();
    }

    showTradingSection() {
        const authSection = document.getElementById('authSection');
        const tradingSection = document.getElementById('tradingSection');
        const navAuth = document.getElementById('navAuth');
        const navUserInfo = document.getElementById('navUserInfo');
        
        if (authSection) authSection.style.display = 'none';
        if (tradingSection) tradingSection.style.display = 'block';
        if (navAuth) navAuth.style.display = 'none';
        if (navUserInfo) navUserInfo.style.display = 'flex';
        
        // 設置預設用戶信息
        this.updatePortfolioUI({
            points: 10000,
            orangeShares: 0,
            currentPrice: 100.00,
            stockValue: 0,
            totalValue: 10000
        });
    }

    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    }

    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            this.showNotification('請輸入用戶名和密碼', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('orangeToken', result.token);
                
                // 設置當前用戶信息
                this.currentUser = {
                    id: result.user.id,
                    username: result.user.username,
                    email: result.user.email,
                    role: result.user.role
                };
                
                this.showNotification('登入成功！', 'success');
                this.showTradingSection();
                await this.loadUserPortfolio();
                
                // 檢查是否為管理員用戶並顯示管理員按鈕
                if (result.user.role === 'admin') {
                    const adminBtn = document.getElementById('adminPanelBtn');
                    if (adminBtn) {
                        adminBtn.style.display = 'block';
                    }
                    console.log('✅ 管理員用戶已登入，管理面板可用');
                }
            } else {
                this.showNotification(result.message || '登入失敗', 'error');
            }
        } catch (error) {
            console.error('登入錯誤:', error);
            this.showNotification('登入處理失敗', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (!username || !email || !password) {
            this.showNotification('請填寫所有欄位', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('註冊成功！請登入', 'success');
                this.showLoginForm();
                document.getElementById('loginUsername').value = username;
            } else {
                this.showNotification(data.message || '註冊失敗', 'error');
            }
        } catch (error) {
            console.error('註冊錯誤:', error);
            this.showNotification('註冊失敗，請稍後再試', 'error');
        }
    }

    logout() {
        localStorage.removeItem('orangeToken');
        this.currentUser = null;
        
        // 隱藏管理員按鈕
        const adminBtn = document.getElementById('adminPanelBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
        
        // 關閉管理員面板
        this.hideAdminPanel();
        
        this.showAuthSection();
    }

    async loadUserPortfolio() {
        try {
            const token = localStorage.getItem('orangeToken');
            if (!token) return;

            const response = await fetch('/api/trading/portfolio', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.updatePortfolioUI(data.portfolio);
                
                // 更新導航欄用戶信息
                const navUserPoints = document.getElementById('navUserPoints');
                const navUserName = document.getElementById('navUserName');
                if (navUserPoints) navUserPoints.textContent = `💰 ${Math.floor(data.portfolio.points)}`;
                if (navUserName) navUserName.textContent = this.currentUser?.username || 'User';
            }
        } catch (error) {
            console.error('載入用戶資產失敗:', error);
        }
    }

    updatePortfolioUI(portfolio) {
        const userPoints = document.getElementById('userPoints');
        const navUserPoints = document.getElementById('navUserPoints');
        const userShares = document.getElementById('userShares');
        const stockValue = document.getElementById('stockValue');
        const totalValue = document.getElementById('totalValue');
        const currentPrice = document.getElementById('currentPrice');
        
        if (userPoints) userPoints.textContent = portfolio.points;
        if (navUserPoints) navUserPoints.textContent = `💰 ${portfolio.points}`;
        if (userShares) userShares.textContent = `${portfolio.orangeShares} 股`;
        if (stockValue) stockValue.textContent = `$${portfolio.stockValue.toFixed(2)}`;
        if (totalValue) totalValue.textContent = `$${portfolio.totalValue.toFixed(2)}`;
        if (currentPrice) currentPrice.textContent = `$${portfolio.currentPrice.toFixed(2)}`;
        
        this.currentPrice = portfolio.currentPrice;
        this.updateTradeCosts();
    }

    updateTradeCosts() {
        const quantity = parseInt(document.getElementById('tradeQuantity').value) || 1;
        const totalCost = this.currentPrice * quantity;
        
        const buyCost = document.getElementById('buyCost');
        const sellRevenue = document.getElementById('sellRevenue');
        
        if (buyCost) buyCost.textContent = `$${totalCost.toFixed(2)}`;
        if (sellRevenue) sellRevenue.textContent = `$${totalCost.toFixed(2)}`;
    }

    // 加載並渲染股價圖表（真實數據）
    async loadStockChart(period = '24h') {
        const canvas = document.getElementById('stockChart');
        if (!canvas) {
            console.error('找不到圖表元素');
            return;
        }

        try {
            console.log(`📈 載入 ${period} 真實圖表數據...`);
            
            // 從API加載真實歷史數據
            const response = await fetch(`/api/stock/history/${period}`);
            const result = await response.json();
            
            let chartData = [];
            if (result.success && result.data.length > 0) {
                chartData = result.data;
                console.log(`✅ 載入了 ${chartData.length} 個真實數據點`);
            } else {
                // 如果沒有數據，生成基本數據
                chartData = this.generateMockData(period);
                console.log('⚠️ 使用模擬數據');
            }
            
            this.renderChart(chartData, period);
            
        } catch (error) {
            console.error('載入股價歷史失敗:', error);
            // 如果API失敗，使用模擬數據
            this.renderChart(this.generateMockData(period), period);
        }
    },

    // 生成模擬數據（當沒有真實數據時）
    generateMockData(period) {
        const now = Date.now();
        const intervals = {
            '1h': { count: 12, step: 5 * 60 * 1000 }, // 5分鐘間隔
            '24h': { count: 24, step: 60 * 60 * 1000 }, // 1小時間隔
            '7d': { count: 7, step: 24 * 60 * 60 * 1000 }, // 1天間隔
            '30d': { count: 30, step: 24 * 60 * 60 * 1000 } // 1天間隔
        };
        
        const config = intervals[period] || intervals['24h'];
        const mockData = [];
        let basePrice = this.currentPrice || 10.00;
        
        for (let i = config.count - 1; i >= 0; i--) {
            const timestamp = new Date(now - (i * config.step)).toISOString();
            basePrice += (Math.random() - 0.5) * 0.5; // 較小的隨機波動
            basePrice = Math.max(5, Math.min(20, basePrice)); // 限制範圍
            
            mockData.push({
                price: Math.round(basePrice * 100) / 100,
                timestamp: timestamp,
                volume: Math.floor(Math.random() * 50) + 10,
                type: 'mock'
            });
        }
        
        return mockData;
    },

    // 渲染圖表
    renderChart(data, period) {
        const canvas = document.getElementById('stockChart');
        if (!canvas) return;
        
        try {
            const ctx = canvas.getContext('2d');
            
            // 銷毀現有圖表
            if (this.chart) {
                this.chart.destroy();
            }

            // 處理標籤格式
            const labels = data.map(item => {
                const date = new Date(item.timestamp);
                switch (period) {
                    case '1h':
                        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                    case '24h':
                        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                    case '7d':
                        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                    case '30d':
                        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                    default:
                        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                }
            });

            const prices = data.map(item => item.price);
            const volumes = data.map(item => item.volume || 0);

            // 計算統計數據
            const openPrice = prices.length > 0 ? prices[0] : this.currentPrice;
            const currentPrice = prices.length > 0 ? prices[prices.length - 1] : this.currentPrice;
            const highPrice = Math.max(...prices);
            const lowPrice = Math.min(...prices);
            const priceChange = currentPrice - openPrice;
            const priceChangePercent = openPrice > 0 ? (priceChange / openPrice * 100) : 0;
            const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);

            // 更新統計顯示
            this.updateChartStats({
                openPrice,
                currentPrice,
                highPrice,
                lowPrice,
                priceChange,
                priceChangePercent,
                totalVolume
            });

            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Orange股價',
                        data: prices,
                        borderColor: priceChange >= 0 ? '#4ade80' : '#ef4444',
                        backgroundColor: priceChange >= 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: priceChange >= 0 ? '#4ade80' : '#ef4444',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#ff6b35',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const volume = volumes[context.dataIndex] || 0;
                                    return [
                                        `價格: $${context.parsed.y.toFixed(2)}`,
                                        `成交量: ${volume}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#b8b8d4' }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: {
                                color: '#b8b8d4',
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        intersect: false
                    }
                }
            });
            
            console.log(`✅ 圖表渲染完成 - ${data.length} 個數據點`);
            
        } catch (error) {
            console.error('圖表渲染失敗:', error);
        }
    },

    // 更新圖表統計數據顯示
    updateChartStats(stats) {
        // 更新價格顯示
        const currentPriceEl = document.getElementById('currentPrice');
        const heroPriceEl = document.getElementById('heroCurrentPrice');
        
        if (currentPriceEl) currentPriceEl.textContent = `$${stats.currentPrice.toFixed(2)}`;
        if (heroPriceEl) heroPriceEl.textContent = `$${stats.currentPrice.toFixed(2)}`;
        
        // 更新漲跌顯示
        this.updatePriceChangeDisplay(stats.priceChange, stats.priceChangePercent);
        
        // 更新成交量
        this.updateVolumeDisplay(stats.totalVolume);
        
        // 更新高低點
        this.updateHighLowDisplay(stats.highPrice, stats.lowPrice);
    },

    // 更新價格變動顯示
    updatePriceChangeDisplay(priceChange, priceChangePercent) {
        const changeElements = document.querySelectorAll('.price-change');
        const changeText = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`;
        const changeClass = priceChange >= 0 ? 'positive' : 'negative';
        
        changeElements.forEach(el => {
            el.textContent = changeText;
            el.className = `price-change ${changeClass}`;
        });
        
        // 如果沒有專門的元素，創建或更新現有顯示
        let heroPriceChangeEl = document.getElementById('heroPriceChange');
        if (!heroPriceChangeEl) {
            // 查找合適的位置添加漲跌顯示
            const heroStatsEl = document.querySelector('.hero-stats');
            if (heroStatsEl) {
                heroPriceChangeEl = document.createElement('div');
                heroPriceChangeEl.id = 'heroPriceChange';
                heroPriceChangeEl.className = `price-change ${changeClass}`;
                heroPriceChangeEl.textContent = changeText;
                heroStatsEl.appendChild(heroPriceChangeEl);
            }
        } else {
            heroPriceChangeEl.textContent = changeText;
            heroPriceChangeEl.className = `price-change ${changeClass}`;
        }
    },

    // 更新成交量顯示
    updateVolumeDisplay(totalVolume) {
        let volumeEl = document.getElementById('totalVolume');
        if (!volumeEl) {
            // 如果沒有成交量元素，可以創建一個
            const heroStatsEl = document.querySelector('.hero-stats');
            if (heroStatsEl) {
                volumeEl = document.createElement('div');
                volumeEl.id = 'totalVolume';
                volumeEl.className = 'volume-display';
                volumeEl.innerHTML = `<span class="volume-label">成交量:</span> <span class="volume-value">${totalVolume}</span>`;
                heroStatsEl.appendChild(volumeEl);
            }
        } else {
            const volumeValueEl = volumeEl.querySelector('.volume-value');
            if (volumeValueEl) {
                volumeValueEl.textContent = totalVolume;
            } else {
                volumeEl.textContent = `成交量: ${totalVolume}`;
            }
        }
    },

    // 更新最高最低價顯示
    updateHighLowDisplay(highPrice, lowPrice) {
        let highLowEl = document.getElementById('highLow');
        if (!highLowEl) {
            const heroStatsEl = document.querySelector('.hero-stats');
            if (heroStatsEl) {
                highLowEl = document.createElement('div');
                highLowEl.id = 'highLow';
                highLowEl.className = 'high-low-display';
                highLowEl.innerHTML = `<span>最高: $${highPrice.toFixed(2)}</span> <span>最低: $${lowPrice.toFixed(2)}</span>`;
                heroStatsEl.appendChild(highLowEl);
            }
        } else {
            highLowEl.innerHTML = `<span>最高: $${highPrice.toFixed(2)}</span> <span>最低: $${lowPrice.toFixed(2)}</span>`;
        }
    },

    // 替換原來的renderDefaultChart方法
    renderDefaultChart() {
        // 載入真實數據圖表
        this.loadStockChart('24h');
    },

    changePeriod(period) {
        this.selectedPeriod = period;
        
        // 更新按鈕樣式
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-period="${period}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        console.log(`切換到 ${period} 時間段`);
        
        // 重新載入對應時間段的圖表
        this.loadStockChart(period);
    },

    updateStockPrice(data) {
        this.currentPrice = data.price;
        
        const heroPrice = document.getElementById('heroCurrentPrice');
        const currentPrice = document.getElementById('currentPrice');
        
        if (heroPrice) heroPrice.textContent = `$${data.price.toFixed(2)}`;
        if (currentPrice) currentPrice.textContent = `$${data.price.toFixed(2)}`;
        
        this.updateTradeCosts();
    },

    updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot) {
            if (connected) {
                statusDot.classList.remove('disconnected');
            } else {
                statusDot.classList.add('disconnected');
            }
        }
        
        if (statusText) {
            statusText.textContent = connected ? '已連接' : '連接中斷';
        }
    },

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    },

    // 顯示個人檔案
    showProfile() {
        const profileSection = document.getElementById('profileSection');
        if (profileSection) {
            profileSection.style.display = 'flex';
            this.loadProfileData();
        }
    },

    // 隱藏個人檔案
    hideProfile() {
        const profileSection = document.getElementById('profileSection');
        if (profileSection) {
            profileSection.style.display = 'none';
        }
    },

    // 載入個人檔案數據
    async loadProfileData() {
        if (!this.currentUser) return;

        try {
            // 載入用戶基本信息
            document.getElementById('profileUsername').textContent = this.currentUser.username || 'Unknown';
            document.getElementById('profileJoinDate').textContent = '2024-01-01'; // 模擬數據
            document.getElementById('profileLastLogin').textContent = new Date().toLocaleString('zh-TW');

            // 載入資產信息 (模擬數據，因為loadUserPortfolio不返回值)
            this.updateProfileAssets({
                points: 10000,
                orangeShares: 0,
                currentPrice: this.currentPrice,
                stockValue: 0,
                totalValue: 10000,
                profitLoss: 0,
                profitLossPercentage: 0
            });

            // 載入交易統計
            this.loadTradingStats();

            // 載入限價單
            this.loadLimitOrders();

            // 載入詳細交易歷史
            this.loadDetailedHistory();

        } catch (error) {
            console.error('載入個人檔案失敗:', error);
        }
    },

    // 更新個人檔案資產信息
    updateProfileAssets(portfolio) {
        document.getElementById('profilePoints').textContent = portfolio.points;
        document.getElementById('profileShares').textContent = `${portfolio.orangeShares} 股`;
        document.getElementById('profileStockValue').textContent = `$${portfolio.stockValue.toFixed(2)}`;
        document.getElementById('profileTotalValue').textContent = `$${portfolio.totalValue.toFixed(2)}`;
        
        const profitLoss = portfolio.profitLoss || 0;
        const profitLossElement = document.getElementById('profileProfitLoss');
        const profitRateElement = document.getElementById('profileProfitRate');
        
        profitLossElement.textContent = `$${profitLoss.toFixed(2)}`;
        profitLossElement.style.color = profitLoss >= 0 ? '#4ecdc4' : '#ff6b6b';
        
        const profitRate = portfolio.profitLossPercentage || 0;
        profitRateElement.textContent = `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%`;
        profitRateElement.style.color = profitRate >= 0 ? '#4ecdc4' : '#ff6b6b';
    },

    // 載入交易統計
    async loadTradingStats() {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/stock/transactions', {
                headers: { 'Authorization': `Bearer ${this.currentUser.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const transactions = data.transactions;
                    
                    const totalTrades = transactions.length;
                    const buyTrades = transactions.filter(t => t.type === 'buy').length;
                    const sellTrades = transactions.filter(t => t.type === 'sell').length;
                    
                    const buyTransactions = transactions.filter(t => t.type === 'buy');
                    const avgBuyPrice = buyTransactions.length > 0 ? 
                        buyTransactions.reduce((sum, t) => sum + t.price, 0) / buyTransactions.length : 0;

                    document.getElementById('totalTrades').textContent = totalTrades;
                    document.getElementById('buyTrades').textContent = buyTrades;
                    document.getElementById('sellTrades').textContent = sellTrades;
                    document.getElementById('avgBuyPrice').textContent = `$${avgBuyPrice.toFixed(2)}`;
                }
            }
        } catch (error) {
            console.error('載入交易統計失敗:', error);
        }
    },

    // 創建限價單
    async createLimitOrder() {
        if (!this.currentUser) {
            this.showNotification('請先登入', 'error');
            return;
        }

        const orderType = document.getElementById('limitOrderType').value;
        const quantity = parseInt(document.getElementById('limitOrderQuantity').value);
        const limitPrice = parseFloat(document.getElementById('limitOrderPrice').value);

        if (!quantity || quantity <= 0 || !limitPrice || limitPrice <= 0) {
            this.showNotification('請輸入有效的數量和價格', 'error');
            return;
        }

        try {
            const response = await fetch('/api/limit-orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentUser.token}`
                },
                body: JSON.stringify({ orderType, quantity, limitPrice })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'success');
                
                // 清空表單
                document.getElementById('limitOrderQuantity').value = '';
                document.getElementById('limitOrderPrice').value = '';
                
                // 重新載入限價單列表
                this.loadLimitOrders();
            } else {
                this.showNotification(data.message || '創建限價單失敗', 'error');
            }

        } catch (error) {
            console.error('創建限價單失敗:', error);
            this.showNotification('創建限價單失敗，請稍後再試', 'error');
        }
    },

    // 載入限價單
    async loadLimitOrders() {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/limit-orders/list', {
                headers: { 'Authorization': `Bearer ${this.currentUser.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.renderLimitOrders(data.orders);
                }
            }
        } catch (error) {
            console.error('載入限價單失敗:', error);
        }
    },

    // 渲染限價單列表
    renderLimitOrders(orders) {
        const container = document.getElementById('limitOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="orders-empty">
                    <span class="empty-icon">📋</span>
                    <p>目前沒有活躍的限價單</p>
                </div>
            `;
            return;
        }

        const ordersHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-info">
                    <span class="order-type ${order.type}">${order.type === 'buy' ? '買入' : '賣出'}</span>
                    <div class="order-details">${order.quantity} 股 @ $${order.price.toFixed(2)}</div>
                </div>
                <button class="cancel-order-btn" onclick="window.orangeApp.cancelLimitOrder(${order.id})">
                    取消
                </button>
            </div>
        `).join('');

        container.innerHTML = ordersHTML;
    },

    // 取消限價單
    async cancelLimitOrder(orderId) {
        if (!this.currentUser) return;

        try {
            const response = await fetch(`/api/limit-orders/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.currentUser.token}` }
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'info');
                this.loadLimitOrders();
            } else {
                this.showNotification(data.message || '取消限價單失敗', 'error');
            }
        } catch (error) {
            console.error('取消限價單失敗:', error);
            this.showNotification('取消限價單失敗，請稍後再試', 'error');
        }
    },

    // 載入詳細交易歷史
    async loadDetailedHistory() {
        if (!this.currentUser) return;

        const historyContainer = document.getElementById('detailedHistoryList');
        if (!historyContainer) return;

        historyContainer.innerHTML = '<div class="history-loading">載入中...</div>';

        try {
            const response = await fetch('/api/stock/transactions', {
                headers: { 'Authorization': `Bearer ${this.currentUser.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    let transactions = data.transactions;
                    
                    // 應用篩選
                    const filterType = document.getElementById('historyFilter')?.value || 'all';
                    const filterPeriod = document.getElementById('historyPeriod')?.value || '7d';
                    
                    if (filterType !== 'all') {
                        transactions = transactions.filter(t => t.type === filterType);
                    }
                    
                    // 應用時間篩選（簡化版本）
                    if (filterPeriod !== 'all') {
                        const days = filterPeriod === '7d' ? 7 : 30;
                        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                        transactions = transactions.filter(t => new Date(t.timestamp) > cutoffDate);
                    }
                    
                    this.renderDetailedHistory(transactions);
                }
            } else {
                historyContainer.innerHTML = '<div class="history-loading">載入失敗</div>';
            }
        } catch (error) {
            console.error('載入詳細歷史失敗:', error);
            historyContainer.innerHTML = '<div class="history-loading">載入失敗</div>';
        }
    },

    // 渲染詳細交易歷史
    renderDetailedHistory(transactions) {
        const container = document.getElementById('detailedHistoryList');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <span class="empty-icon">📝</span>
                    <p>沒有符合條件的交易記錄</p>
                </div>
            `;
            return;
        }

        const historyHTML = transactions.map(tx => {
            const date = new Date(tx.timestamp);
            const typeClass = tx.type === 'buy' ? 'buy' : 'sell';
            const typeText = tx.type === 'buy' ? '買入' : '賣出';
            
            return `
                <div class="detailed-history-item">
                    <span class="transaction-type ${typeClass}">${typeText}</span>
                    <div class="transaction-info">
                        <div>${tx.quantity} 股 @ $${tx.price.toFixed(2)}</div>
                        <div class="transaction-time">${date.toLocaleString('zh-TW')}</div>
                    </div>
                    <div class="transaction-amount">$${tx.totalAmount.toFixed(2)}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = historyHTML;
    }

    // 添加新的輔助方法
    updateStockPrice(data) {
        this.currentPrice = data.price;
        
        const heroPrice = document.getElementById('heroCurrentPrice');
        const currentPrice = document.getElementById('currentPrice');
        
        if (heroPrice) heroPrice.textContent = `$${data.price.toFixed(2)}`;
        if (currentPrice) currentPrice.textContent = `$${data.price.toFixed(2)}`;
        
        this.updateTradeCosts();
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.className = connected ? 'connection-status connected' : 'connection-status disconnected';
            const statusDot = statusEl.querySelector('.status-dot');
            const statusText = statusEl.querySelector('.status-text');
            if (statusDot) statusDot.className = connected ? 'status-dot connected' : 'status-dot disconnected';
            if (statusText) statusText.textContent = connected ? '已連接' : '連接中斷';
        }
    }

    changePeriod(period) {
        this.selectedPeriod = period;
        
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-period="${period}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        console.log(`切換到 ${period} 時間段`);
        
        // 重新載入對應時間段的圖表
        if (this.loadStockChart) {
            this.loadStockChart(period);
        }
    }
}

// === 新增功能方法 ===

// 添加到 OrangeStockApp 類的原型上
Object.assign(OrangeStockApp.prototype, {
    // 處理交易模式變更
    handleTradeModeChange(mode) {
        const limitPriceInput = document.getElementById('limitPriceInput');
        const buyBtnText = document.getElementById('buyBtnText');
        const sellBtnText = document.getElementById('sellBtnText');
        
        if (mode === 'limit') {
            limitPriceInput.style.display = 'block';
            buyBtnText.textContent = '限價買入';
            sellBtnText.textContent = '限價賣出';
        } else {
            limitPriceInput.style.display = 'none';
            buyBtnText.textContent = '買入';
            sellBtnText.textContent = '賣出';
        }
        
        this.updateTradeCosts();
    },

    // 修改交易處理以支援限價單
    async handleTrade(type) {
        const tradeMode = document.querySelector('input[name="tradeMode"]:checked').value;
        const quantity = parseInt(document.getElementById('tradeQuantity').value);
        
        if (!quantity || quantity <= 0) {
            this.showNotification('請輸入有效的交易數量', 'error');
            return;
        }

        if (tradeMode === 'limit') {
            await this.handleLimitTrade(type, quantity);
        } else {
            await this.handleMarketTrade(type, quantity);
        }
    },

    // 市價交易
    async handleMarketTrade(type, quantity) {
        try {
            const token = localStorage.getItem('orangeToken');
            if (!token) {
                this.showNotification('請先登入', 'error');
                return;
            }

            const response = await fetch(`/api/trading/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`${type === 'buy' ? '買入' : '賣出'}成功！`, 'success');
                
                // 立即更新股價顯示
                if (result.transaction && result.transaction.newPrice) {
                    this.currentPrice = result.transaction.newPrice;
                    this.updateStockPrice({ price: result.transaction.newPrice });
                }
                
                // 重新載入用戶資產
                await this.loadUserPortfolio();
                
                // 清空輸入框
                const quantityInput = document.getElementById('tradeQuantity');
                if (quantityInput) quantityInput.value = '';
                
            } else {
                this.showNotification(result.message || '交易失敗', 'error');
            }
        } catch (error) {
            console.error('交易錯誤:', error);
            this.showNotification('交易處理失敗', 'error');
        }
    },

    // 限價交易
    async handleLimitTrade(type, quantity) {
        const limitPrice = parseFloat(document.getElementById('limitPrice').value);
        
        if (!limitPrice || limitPrice <= 0) {
            this.showNotification('請輸入有效的限價價格', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('orangeToken');
            const response = await fetch('/api/limit-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type,
                    quantity,
                    target_price: limitPrice
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`限價單創建成功！目標價格: $${limitPrice}`, 'success');
                // 清空表單
                document.getElementById('tradeQuantity').value = '1';
                document.getElementById('limitPrice').value = '';
                this.updateTradeCosts();
            } else {
                this.showNotification(result.message || '限價單創建失敗', 'error');
            }
        } catch (error) {
            console.error('限價單創建錯誤:', error);
            this.showNotification('限價單處理失敗', 'error');
        }
    },

    // 顯示價格設置模態框
    async showPriceSettings() {
        const modal = document.getElementById('priceSettingsModal');
        modal.style.display = 'flex';
        
        // 載入當前設置
        await this.loadPriceSettings();
    },

    // 隱藏價格設置模態框
    hidePriceSettings() {
        const modal = document.getElementById('priceSettingsModal');
        modal.style.display = 'none';
    },

    // 載入價格影響設置
    async loadPriceSettings() {
        try {
            const response = await fetch('/api/stock/price-impact-settings');
            const result = await response.json();
            
            if (result.success) {
                const settings = result.settings;
                
                // 設置滑桿值
                document.getElementById('buyImpactMultiplier').value = settings.buyImpactMultiplier;
                document.getElementById('sellImpactMultiplier').value = settings.sellImpactMultiplier;
                document.getElementById('volumeDecayFactor').value = settings.volumeDecayFactor;
                document.getElementById('randomFluctuation').value = settings.randomFluctuation;
                
                // 更新顯示值
                this.updateSliderDisplays();
            }
        } catch (error) {
            console.error('載入價格設置失敗:', error);
            this.showNotification('載入設置失敗', 'error');
        }
    },

    // 綁定價格設置滑桿事件
    bindPriceSettingsSliders() {
        const sliders = [
            'buyImpactMultiplier',
            'sellImpactMultiplier', 
            'volumeDecayFactor',
            'randomFluctuation'
        ];

        sliders.forEach(id => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.addEventListener('input', () => this.updateSliderDisplays());
            }
        });
    },

    // 更新滑桿顯示值
    updateSliderDisplays() {
        const buyImpact = document.getElementById('buyImpactMultiplier').value;
        const sellImpact = document.getElementById('sellImpactMultiplier').value;
        const volumeDecay = document.getElementById('volumeDecayFactor').value;
        const randomFluctuation = document.getElementById('randomFluctuation').value;

        document.getElementById('buyImpactValue').textContent = buyImpact;
        document.getElementById('sellImpactValue').textContent = sellImpact;
        document.getElementById('volumeDecayValue').textContent = volumeDecay;
        document.getElementById('randomFluctuationValue').textContent = (randomFluctuation * 100).toFixed(1) + '%';
    },

    // 保存價格設置
    async savePriceSettings() {
        try {
            const settings = {
                buyImpactMultiplier: parseFloat(document.getElementById('buyImpactMultiplier').value),
                sellImpactMultiplier: parseFloat(document.getElementById('sellImpactMultiplier').value),
                volumeDecayFactor: parseFloat(document.getElementById('volumeDecayFactor').value),
                randomFluctuation: parseFloat(document.getElementById('randomFluctuation').value)
            };

            const response = await fetch('/api/stock/price-impact-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('價格影響設置已保存！', 'success');
                this.hidePriceSettings();
            } else {
                this.showNotification('保存設置失敗', 'error');
            }
        } catch (error) {
            console.error('保存價格設置失敗:', error);
            this.showNotification('保存設置失敗', 'error');
        }
    },

    // 重置價格設置
    resetPriceSettings() {
        document.getElementById('buyImpactMultiplier').value = 0.5;
        document.getElementById('sellImpactMultiplier').value = 0.5;
        document.getElementById('volumeDecayFactor').value = 1000;
        document.getElementById('randomFluctuation').value = 0.02;
        
        this.updateSliderDisplays();
        this.showNotification('設置已重置為預設值', 'info');
    },

    // === 股票信息面板功能 ===
    
    // 切換股票信息面板
    toggleStockInfo() {
        const stockInfoSection = document.getElementById('stockInfoSection');
        const chartSection = document.getElementById('chartSection');
        const tradingSection = document.getElementById('tradingSection');
        
        if (stockInfoSection.style.display === 'none' || !stockInfoSection.style.display) {
            // 顯示股票信息面板
            stockInfoSection.style.display = 'block';
            chartSection.style.display = 'none';
            tradingSection.style.display = 'none';
            
            // 載入所有數據
            this.loadStockInfoData();
            
            // 設置定期更新
            this.startStockInfoUpdates();
        } else {
            // 隱藏股票信息面板，回到交易界面
            stockInfoSection.style.display = 'none';
            chartSection.style.display = 'block';
            tradingSection.style.display = 'block';
            
            // 停止定期更新
            this.stopStockInfoUpdates();
        }
    },

    // 載入所有股票信息數據
    async loadStockInfoData() {
        await Promise.all([
            this.loadStockDetails(),
            this.loadFiveLevelQuotes(),
            this.loadRecentTrades(),
            this.loadRankings()
        ]);
    },

    // 載入股票詳細信息
    async loadStockDetails() {
        try {
            const response = await fetch('/api/stock/info');
            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                
                document.getElementById('detailCurrentPrice').textContent = `$${data.currentPrice.toFixed(2)}`;
                document.getElementById('detailAvgPrice').textContent = `$${data.avgPrice.toFixed(2)}`;
                document.getElementById('detailOpenPrice').textContent = `$${data.openPrice.toFixed(2)}`;
                document.getElementById('detailTodayHigh').textContent = `$${data.todayHigh.toFixed(2)}`;
                document.getElementById('detailTodayLow').textContent = `$${data.todayLow.toFixed(2)}`;
                document.getElementById('detailVolume').textContent = `${data.totalVolume.toLocaleString()} 股`;
                document.getElementById('detailAmount').textContent = `$${data.totalAmount.toFixed(2)}`;
                document.getElementById('detailTransCount').textContent = `${data.transactionCount} 筆`;
                
                // 設置漲跌幅顏色
                const changeElement = document.getElementById('detailPriceChange');
                const changeText = `${data.priceChange >= 0 ? '+' : ''}${data.priceChange.toFixed(2)} (${data.priceChangePercent >= 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%)`;
                changeElement.textContent = changeText;
                changeElement.className = `info-value ${data.priceChange >= 0 ? 'positive' : 'negative'}`;
            }
        } catch (error) {
            console.error('載入股票詳情失敗:', error);
        }
    },

    // 載入五檔報價
    async loadFiveLevelQuotes() {
        try {
            const response = await fetch('/api/stock/quotes');
            const result = await response.json();
            
            if (result.success) {
                const { buyOrders, sellOrders } = result.data;
                this.renderFiveLevelQuotes(buyOrders, sellOrders);
            }
        } catch (error) {
            console.error('載入五檔報價失敗:', error);
        }
    },

    // 渲染五檔報價
    renderFiveLevelQuotes(buyOrders, sellOrders) {
        const quotesContainer = document.getElementById('fiveLevelQuotes');
        
        if (buyOrders.length === 0 && sellOrders.length === 0) {
            quotesContainer.innerHTML = '<div class="quotes-empty">目前沒有掛單</div>';
            return;
        }
        
        let html = '';
        const maxRows = Math.max(buyOrders.length, sellOrders.length, 5);
        
        for (let i = 0; i < maxRows; i++) {
            const buyOrder = buyOrders[i];
            const sellOrder = sellOrders[i];
            
            html += `
                <div class="quote-row">
                    <span class="quote-price buy">${buyOrder ? `$${buyOrder.price.toFixed(2)}` : '-'}</span>
                    <span class="quote-quantity">${buyOrder ? buyOrder.quantity : '-'}</span>
                    <span class="quote-price sell">${sellOrder ? `$${sellOrder.price.toFixed(2)}` : '-'}</span>
                    <span class="quote-quantity">${sellOrder ? sellOrder.quantity : '-'}</span>
                </div>
            `;
        }
        
        quotesContainer.innerHTML = html;
    },

    // 載入近期交易記錄
    async loadRecentTrades() {
        try {
            const response = await fetch('/api/stock/recent-trades?limit=20');
            const result = await response.json();
            
            if (result.success) {
                this.renderRecentTrades(result.data);
            }
        } catch (error) {
            console.error('載入交易記錄失敗:', error);
        }
    },

    // 渲染近期交易記錄
    renderRecentTrades(trades) {
        const tradesContainer = document.getElementById('recentTradesList');
        
        if (trades.length === 0) {
            tradesContainer.innerHTML = '<div class="trades-empty">暫無交易記錄</div>';
            return;
        }
        
        const html = trades.map(trade => {
            const time = new Date(trade.timestamp).toLocaleTimeString('zh-TW', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const trendClass = trade.trend || 'flat';
            const typeClass = trade.type === 'buy' ? 'buy' : 'sell';
            const typeText = trade.type === 'buy' ? '買入' : '賣出';
            
            return `
                <div class="trade-row">
                    <span class="trade-time">${time}</span>
                    <span class="trade-price ${trendClass}">$${trade.price.toFixed(2)}</span>
                    <span class="trade-quantity">${trade.volume}</span>
                    <span class="trade-type ${typeClass}">${typeText}</span>
                </div>
            `;
        }).join('');
        
        tradesContainer.innerHTML = html;
    },

    // 載入排行榜
    async loadRankings() {
        try {
            const response = await fetch('/api/stock/rankings?limit=10');
            const result = await response.json();
            
            if (result.success) {
                this.renderRankings(result.data);
                
                // 如果已登入，載入用戶排名
                if (this.currentUser) {
                    await this.loadUserRank();
                }
            }
        } catch (error) {
            console.error('載入排行榜失敗:', error);
        }
    },

    // 渲染排行榜
    renderRankings(rankings) {
        const rankingsContainer = document.getElementById('rankingsList');
        
        if (rankings.length === 0) {
            rankingsContainer.innerHTML = '<div class="rankings-empty">暫無排行榜數據</div>';
            return;
        }
        
        const html = rankings.map(rank => {
            const isCurrentUser = this.currentUser && rank.userId === this.currentUser.id;
            const isTop3 = rank.rank <= 3;
            
            return `
                <div class="rank-row ${isCurrentUser ? 'current-user' : ''}">
                    <span class="rank-number ${isTop3 ? 'top3' : ''}">${rank.rank}</span>
                    <span class="rank-username">${rank.username}</span>
                    <span class="rank-value">$${rank.totalValue.toFixed(2)}</span>
                    <span class="rank-trades">${rank.tradeCount}</span>
                </div>
            `;
        }).join('');
        
        rankingsContainer.innerHTML = html;
    },

    // 載入用戶排名
    async loadUserRank() {
        try {
            const response = await fetch(`/api/stock/user-rank/${this.currentUser.id}`);
            const result = await response.json();
            
            if (result.success && result.data.rank) {
                const userRankInfo = document.getElementById('userRankInfo');
                const rankNumber = document.getElementById('userRankNumber');
                const totalValue = document.getElementById('userTotalValue');
                
                rankNumber.textContent = `#${result.data.rank}`;
                totalValue.textContent = `$${result.data.total_value.toFixed(2)}`;
                userRankInfo.style.display = 'block';
            }
        } catch (error) {
            console.error('載入用戶排名失敗:', error);
        }
    },

    // 開始定期更新股票信息
    startStockInfoUpdates() {
        // 清除現有定時器
        this.stopStockInfoUpdates();
        
        // 每30秒更新一次數據
        this.stockInfoUpdateInterval = setInterval(() => {
            this.loadStockInfoData();
        }, 30000);
    },

    // 停止定期更新
    stopStockInfoUpdates() {
        if (this.stockInfoUpdateInterval) {
            clearInterval(this.stockInfoUpdateInterval);
            this.stockInfoUpdateInterval = null;
        }
    },

    // === 管理員面板功能 ===
    
    // 顯示管理員面板
    showAdminPanel() {
        if (this.currentUser?.role !== 'admin') {
            this.showNotification('需要管理員權限', 'error');
            return;
        }
        
        const adminPanel = document.getElementById('adminPanelSection');
        if (adminPanel) {
            adminPanel.style.display = 'block';
            this.initAdminPanel();
        }
    },

    // 隱藏管理員面板
    hideAdminPanel() {
        const adminPanel = document.getElementById('adminPanelSection');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
    },

    // 初始化管理員面板
    initAdminPanel() {
        // 綁定標籤切換事件
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchAdminTab(tabName);
            });
        });

        // 綁定各種功能按鈕
        this.bindAdminEvents();
        
        // 載入統計數據
        this.loadAdminStats();
    },

    // 切換管理員標籤
    switchAdminTab(tabName) {
        // 更新標籤樣式
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新內容顯示
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`adminTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');

        // 載入對應數據
        switch (tabName) {
            case 'stats':
                this.loadAdminStats();
                break;
            case 'users':
                this.loadAdminUsers();
                break;
            case 'settings':
                this.loadAdminSettings();
                break;
            case 'control':
                this.loadPriceControl();
                break;
        }
    },

    // 綁定管理員事件
    bindAdminEvents() {
        // 刷新用戶列表
        const refreshUsersBtn = document.getElementById('refreshUsersBtn');
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', () => this.loadAdminUsers());
        }

        // 保存所有設置
        const saveAllSettingsBtn = document.getElementById('saveAllSettingsBtn');
        if (saveAllSettingsBtn) {
            saveAllSettingsBtn.addEventListener('click', () => this.saveAllAdminSettings());
        }

        // 危險操作
        const resetPricesBtn = document.getElementById('resetPricesBtn');
        if (resetPricesBtn) {
            resetPricesBtn.addEventListener('click', () => this.confirmReset('prices'));
        }

        const resetTradesBtn = document.getElementById('resetTradesBtn');
        if (resetTradesBtn) {
            resetTradesBtn.addEventListener('click', () => this.confirmReset('trades'));
        }

        // 股價調整
        const adjustPriceBtn = document.getElementById('adjustPriceBtn');
        if (adjustPriceBtn) {
            adjustPriceBtn.addEventListener('click', () => this.adjustStockPrice());
        }

        // 打開價格影響設置
        const openPriceImpactBtn = document.getElementById('openPriceImpactBtn');
        if (openPriceImpactBtn) {
            openPriceImpactBtn.addEventListener('click', () => this.showPriceSettings());
        }
    },

    // 載入管理員統計數據
    async loadAdminStats() {
        try {
            const token = localStorage.getItem('orangeToken');
            const response = await fetch('/api/stock/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            if (result.success) {
                const stats = result.stats;
                
                // 更新用戶統計
                document.getElementById('totalUsers').textContent = stats.users.total_users || 0;
                document.getElementById('adminUsers').textContent = stats.users.admin_users || 0;
                document.getElementById('newUsersToday').textContent = stats.users.new_users_today || 0;
                
                // 更新交易統計
                document.getElementById('totalTrades').textContent = stats.trades.total_trades || 0;
                document.getElementById('tradesToday').textContent = stats.trades.trades_today || 0;
                document.getElementById('totalVolume').textContent = `$${(stats.trades.total_volume || 0).toFixed(2)}`;
                
                // 更新股票統計
                document.getElementById('adminCurrentPrice').textContent = `$${stats.currentPrice.toFixed(2)}`;
                document.getElementById('admin24hHigh').textContent = `$${(stats.stock.maxPrice24h || stats.currentPrice).toFixed(2)}`;
                document.getElementById('admin24hLow').textContent = `$${(stats.stock.minPrice24h || stats.currentPrice).toFixed(2)}`;
            }
        } catch (error) {
            console.error('載入管理員統計失敗:', error);
            this.showNotification('載入統計數據失敗', 'error');
        }
    },

    // 載入用戶管理數據
    async loadAdminUsers() {
        try {
            const token = localStorage.getItem('orangeToken');
            const response = await fetch('/api/stock/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            if (result.success) {
                this.renderUsersTable(result.users);
            }
        } catch (error) {
            console.error('載入用戶列表失敗:', error);
            this.showNotification('載入用戶列表失敗', 'error');
        }
    },

    // 渲染用戶表格
    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="loading-row">沒有用戶數據</td></tr>';
            return;
        }

        const html = users.map(user => {
            const date = new Date(user.created_at).toLocaleDateString('zh-TW');
            const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
            
            return `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="role-badge ${roleClass}">${user.role}</span></td>
                    <td>${user.points}</td>
                    <td>${user.shares} 股</td>
                    <td>${user.trade_count}</td>
                    <td>${date}</td>
                    <td>
                        <button class="user-action-btn" onclick="orangeApp.toggleUserRole(${user.id}, '${user.role}')">
                            ${user.role === 'admin' ? '降為用戶' : '升為管理員'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = html;
    },

    // 切換用戶角色
    async toggleUserRole(userId, currentRole) {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        
        if (!confirm(`確定要將此用戶${currentRole === 'admin' ? '降為普通用戶' : '升為管理員'}嗎？`)) {
            return;
        }

        try {
            const token = localStorage.getItem('orangeToken');
            const response = await fetch(`/api/stock/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showNotification('用戶角色已更新', 'success');
                this.loadAdminUsers(); // 重新載入用戶列表
            } else {
                this.showNotification(result.message || '角色更新失敗', 'error');
            }
        } catch (error) {
            console.error('更新用戶角色失敗:', error);
            this.showNotification('角色更新失敗', 'error');
        }
    },

    // 載入系統設置
    async loadAdminSettings() {
        try {
            const token = localStorage.getItem('orangeToken');
            const response = await fetch('/api/stock/admin/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            if (result.success) {
                this.renderAdminSettings(result.settings);
            }
        } catch (error) {
            console.error('載入系統設置失敗:', error);
            this.showNotification('載入系統設置失敗', 'error');
        }
    },

    // 渲染系統設置
    renderAdminSettings(settings) {
        const container = document.getElementById('adminSettingsList');
        
        if (settings.length === 0) {
            container.innerHTML = '<div class="loading-settings">沒有設置項目</div>';
            return;
        }

        const html = settings.map(setting => `
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-name">${setting.setting_key}</div>
                    <div class="setting-description">${setting.description || '無描述'}</div>
                </div>
                <div class="setting-control">
                    <input type="text" class="setting-input" 
                           data-key="${setting.setting_key}" 
                           value="${setting.setting_value}"
                           placeholder="設置值">
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    },

    // 保存所有管理員設置
    async saveAllAdminSettings() {
        const inputs = document.querySelectorAll('.setting-input');
        const token = localStorage.getItem('orangeToken');
        let successCount = 0;

        for (const input of inputs) {
            try {
                const response = await fetch(`/api/stock/admin/settings/${input.dataset.key}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ value: input.value })
                });
                
                if (response.ok) {
                    successCount++;
                }
            } catch (error) {
                console.error(`保存設置 ${input.dataset.key} 失敗:`, error);
            }
        }

        this.showNotification(`成功保存 ${successCount}/${inputs.length} 個設置`, 'success');
    },

    // 載入股價控制
    loadPriceControl() {
        // 更新當前股價顯示
        const currentPrice = this.currentPrice || 10.00;
        document.getElementById('controlCurrentPrice').textContent = `$${currentPrice.toFixed(2)}`;
    },

    // 調整股價
    async adjustStockPrice() {
        const newPrice = parseFloat(document.getElementById('newStockPrice').value);
        const reason = document.getElementById('adjustReason').value || '管理員調整';

        if (!newPrice || newPrice <= 0) {
            this.showNotification('請輸入有效的股價', 'error');
            return;
        }

        if (!confirm(`確定要將股價調整為 $${newPrice.toFixed(2)} 嗎？\n原因：${reason}`)) {
            return;
        }

        try {
            const token = localStorage.getItem('orangeToken');
            const response = await fetch('/api/stock/admin/adjust-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPrice, reason })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showNotification(`股價已調整為 $${result.newPrice.toFixed(2)}`, 'success');
                
                // 更新顯示
                this.currentPrice = result.newPrice;
                document.getElementById('controlCurrentPrice').textContent = `$${result.newPrice.toFixed(2)}`;
                
                // 清空表單
                document.getElementById('newStockPrice').value = '';
                document.getElementById('adjustReason').value = '';
                
                // 更新統計數據
                this.loadAdminStats();
            } else {
                this.showNotification(result.message || '股價調整失敗', 'error');
            }
        } catch (error) {
            console.error('調整股價失敗:', error);
            this.showNotification('股價調整失敗', 'error');
        }
    },

    // 確認重置操作
    confirmReset(type) {
        const typeNames = {
            prices: '股價歷史',
            trades: '交易記錄'
        };
        
        const typeName = typeNames[type];
        if (!confirm(`⚠️ 警告！\n\n此操作將永久刪除所有${typeName}，且無法恢復！\n\n確定要繼續嗎？`)) {
            return;
        }

        if (!confirm(`最後確認：真的要重置${typeName}嗎？\n\n此操作不可逆！`)) {
            return;
        }

        this.performReset(type);
    },

    // 執行重置操作
    async performReset(type) {
        try {
            const token = localStorage.getItem('orangeToken');
            const response = await fetch('/api/stock/admin/reset-system', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ resetType: type })
            });
            
            const result = await response.json();
            if (result.success) {
                this.showNotification(result.message, 'success');
                this.loadAdminStats(); // 重新載入統計數據
            } else {
                this.showNotification(result.message || '重置失敗', 'error');
            }
        } catch (error) {
            console.error('重置操作失敗:', error);
            this.showNotification('重置操作失敗', 'error');
        }
    }
});

// 啟動應用程式
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.orangeApp = new OrangeStockApp();
        console.log('🍊 Orange Stock 應用程式已啟動');
    } catch (error) {
        console.error('應用程式啟動失敗:', error);
        
        // 隱藏載入畫面即使出錯
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}); 