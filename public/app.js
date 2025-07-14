// Orange Stock Trading App
class OrangeStockApp {
    constructor() {
        this.socket = null;
        this.chart = null;
        this.currentUser = null;
        this.currentPrice = 100.00;
        this.selectedPeriod = '1h';
        this.autoRefreshInterval = null;
        
        this.init();
    }

    // 初始化應用程式
    init() {
        try {
            console.log('🍊 Orange Stock 初始化開始...');
            
            // 立即隱藏載入畫面，避免卡死
            this.hideLoadingOverlay();
            
            this.checkAuthStatus();
            this.bindEvents();
            this.connectWebSocket();
            this.loadInitialData();
            
            console.log('🍊 Orange Stock 初始化完成！');
        } catch (error) {
            console.error('初始化失敗:', error);
            this.hideLoadingOverlay();
            this.showNotification('系統初始化失敗，請重新整理頁面', 'error');
        }
    }

    // 隱藏載入畫面
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // 檢查認證狀態
    checkAuthStatus() {
        const token = localStorage.getItem('orangeToken');
        if (token) {
            this.verifyToken(token);
        } else {
            this.showAuthSection();
        }
    }

    // 驗證token
    async verifyToken(token) {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                this.currentUser = {
                    id: data.userId,
                    username: data.username,
                    role: data.role,
                    token: token
                };
                this.showTradingSection();
                this.loadUserPortfolio();
                this.startAutoRefresh(); // 啟動自動刷新
            } else {
                localStorage.removeItem('orangeToken');
                this.showAuthSection();
            }
        } catch (error) {
            console.error('Token驗證失敗:', error);
            localStorage.removeItem('orangeToken');
            this.showAuthSection();
        }
    }

    // 綁定事件處理器
    bindEvents() {
        // 導航按鈕
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginForm());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterForm());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('refreshBtn').addEventListener('click', () => this.manualRefresh());
        document.getElementById('stockInfoBtn').addEventListener('click', () => this.showStockInfo());
        document.getElementById('profileBtn').addEventListener('click', () => this.showProfile());

        // 表單切換
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // 認證表單提交
        document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerFormElement').addEventListener('submit', (e) => this.handleRegister(e));

        // 交易相關
        document.getElementById('tradeQuantity').addEventListener('input', () => this.updateTradeCosts());
        document.getElementById('buyBtn').addEventListener('click', () => this.handleTrade('buy'));
        document.getElementById('sellBtn').addEventListener('click', () => this.handleTrade('sell'));
        
        // 交易模式切換
        const tradeModeInputs = document.querySelectorAll('input[name="tradeMode"]');
        tradeModeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const limitPriceInput = document.getElementById('limitPriceInput');
                if (e.target.value === 'limit') {
                    limitPriceInput.style.display = 'block';
                } else {
                    limitPriceInput.style.display = 'none';
                }
            });
        });

        // 圖表時間段切換
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changePeriod(e.target.dataset.period));
        });

        // 管理員面板
        const adminPanelBtn = document.getElementById('adminPanelBtn');
        if (adminPanelBtn) {
            adminPanelBtn.addEventListener('click', () => this.showAdminPanel());
        }

        const closeAdminBtn = document.getElementById('closeAdminBtn');
        if (closeAdminBtn) {
            closeAdminBtn.addEventListener('click', () => this.hideAdminPanel());
        }

        // 移動端菜單
        document.getElementById('mobileMenuToggle').addEventListener('click', () => {
            document.getElementById('navMenu').classList.toggle('active');
        });
        
        // 管理面板標籤切換
        this.bindAdminPanelEvents();
    }
    
    // 綁定管理面板事件
    bindAdminPanelEvents() {
        // 標籤切換
        const adminTabs = document.querySelectorAll('.admin-tab');
        const adminTabContents = document.querySelectorAll('.admin-tab-content');
        
        adminTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // 移除所有active類
                adminTabs.forEach(t => t.classList.remove('active'));
                adminTabContents.forEach(content => content.classList.remove('active'));
                
                // 添加active類到當前標籤
                tab.classList.add('active');
                const targetContent = document.getElementById(`adminTab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
        
        // 價格影響設置按鈕
        const openPriceImpactBtn = document.getElementById('openPriceImpactBtn');
        if (openPriceImpactBtn) {
            openPriceImpactBtn.addEventListener('click', () => {
                this.showPriceImpactSettings();
            });
        }
        
        // 調整股價按鈕
        const adjustPriceBtn = document.getElementById('adjustPriceBtn');
        if (adjustPriceBtn) {
            adjustPriceBtn.addEventListener('click', () => {
                this.adjustStockPrice();
            });
        }
        
        // 刷新用戶列表按鈕
        const refreshUsersBtn = document.getElementById('refreshUsersBtn');
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', () => {
                this.loadAdminUsers();
            });
        }
    }

    // WebSocket連接
    connectWebSocket() {
        try {
            console.log('🔌 嘗試連接WebSocket...');
            this.socket = io({
                timeout: 5000,
                forceNew: true
            });

            this.socket.on('connect', () => {
                console.log('✅ WebSocket連接成功');
                this.updateConnectionStatus(true);
                this.showNotification('已連接到服務器', 'success');
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket連接失敗:', error);
                this.updateConnectionStatus(false);
                this.showNotification('無法連接到服務器，部分功能可能受限', 'warning');
            });

            this.socket.on('disconnect', () => {
                console.log('🔌 WebSocket連接中斷');
                this.updateConnectionStatus(false);
                this.showNotification('與服務器連接中斷', 'error');
            });

            this.socket.on('stock_price_update', (data) => {
                this.updateStockPrice(data);
            });

            this.socket.on('trade_success', (data) => {
                this.showNotification(data.message, 'success');
                // 交易成功後立即刷新所有數據
                this.refreshAllData();
            });

            this.socket.on('trade_error', (data) => {
                this.showNotification(data.message, 'error');
            });
        } catch (error) {
            console.error('WebSocket初始化失敗:', error);
            this.updateConnectionStatus(false);
        }
    }

    // 載入初始數據
    async loadInitialData() {
        try {
            console.log('📊 載入初始數據...');
            
            // 設置預設的hero統計數據
            this.updateHeroStats({
                currentPrice: 100.00,
                priceChangePercentage: 0,
                totalBuyVolume: 0,
                totalSellVolume: 0
            });

            // 嘗試載入真實的股價統計
            try {
                const statsResponse = await fetch('/api/stock/stats');
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    if (statsData.success) {
                        this.updateHeroStats(statsData.stats);
                        console.log('✅ 股價統計載入成功');
                    }
                } else {
                    console.log('⚠️ 無法載入股價統計，使用預設值');
                }
            } catch (error) {
                console.log('⚠️ 股價統計API請求失敗，使用預設值');
            }

                    // 載入股價歷史並繪製圖表
        this.loadStockChart(this.selectedPeriod);
        
        // 載入五檔報價和成交紀錄
        this.loadOrderBook();
        this.loadRecentTrades();
        
    } catch (error) {
        console.error('載入初始數據失敗:', error);
        this.showNotification('部分數據載入失敗', 'warning');
    }
}

    // 開始自動刷新數據
    startAutoRefresh() {
        // 清除現有的定時器
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        console.log('🔄 啟動自動刷新 (每15秒)');
        
        // 設置15秒自動刷新
        this.autoRefreshInterval = setInterval(() => {
            this.refreshAllData();
        }, 15000); // 15秒 = 15000毫秒
    }

    // 停止自動刷新
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('⏹️ 停止自動刷新');
        }
    }

    // 刷新所有數據
    async refreshAllData() {
        if (!this.currentUser) return;

        try {
            console.log('🔄 自動刷新數據...');
            
            // 同時刷新多個數據源
            const refreshPromises = [
                this.loadUserPortfolio(),
                this.loadTransactionHistory(),
                this.refreshStockStats(),
                this.refreshChartData(),
                this.loadOrderBook(),
                this.loadRecentTrades()
            ];

            await Promise.all(refreshPromises);
            console.log('✅ 數據刷新完成');
            
        } catch (error) {
            console.error('自動刷新失敗:', error);
        }
    }

    // 刷新股價統計
    async refreshStockStats() {
        try {
            const response = await fetch('/api/stock/stats');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateHeroStats(data.stats);
                }
            }
        } catch (error) {
            console.error('刷新股價統計失敗:', error);
        }
    }

    // 刷新圖表數據
    async refreshChartData() {
        try {
            const response = await fetch(`/api/stock/history/${this.selectedPeriod}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.length > 0) {
                    this.renderChart(data.data, this.selectedPeriod);
                }
            }
        } catch (error) {
            console.error('刷新圖表數據失敗:', error);
        }
    }

    // 手動刷新數據
    async manualRefresh() {
        if (!this.currentUser) {
            this.showNotification('請先登入', 'warning');
            return;
        }

        this.showNotification('正在刷新數據...', 'info');
        await this.refreshAllData();
        this.showNotification('數據刷新完成', 'success');
    }

    // 顯示股票信息
    showStockInfo() {
        if (!this.currentUser) {
            this.showNotification('請先登入', 'warning');
            return;
        }

        // 創建股票信息彈窗
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.style.overflow = '';
                modal.remove();
            }
        };
        
        // ESC鍵關閉彈窗
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
                document.body.style.overflow = '';
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // 防止背景滾動
        document.body.style.overflow = 'hidden';
        
        modal.innerHTML = `
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>📊 Orange Stock 股票信息</h2>
                    <button class="modal-close-btn" onclick="document.body.style.overflow=''; this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="info-section">
                        <h3>📈 當前股價</h3>
                        <p class="price-display">$${this.currentPrice.toFixed(2)}</p>
                    </div>
                    <div class="info-section">
                        <h3>💼 市場資訊</h3>
                        <ul class="info-list">
                            <li>股票代碼：ORNG</li>
                            <li>上市交易所：Taiwan Orange Exchange</li>
                            <li>產業類別：科技水果</li>
                            <li>市值：$10,000,000</li>
                        </ul>
                    </div>
                    <div class="info-section">
                        <h3>📊 交易規則</h3>
                        <ul class="info-list">
                            <li>交易時間：24/7 全天候交易</li>
                            <li>最小交易單位：1股</li>
                            <li>交易手續費：免費</li>
                            <li>漲跌幅限制：無限制</li>
                        </ul>
                    </div>
                    <div class="info-section">
                        <h3>🍊 公司簡介</h3>
                        <p>Orange Corp. 是一家專注於創新科技與美味水果結合的未來企業。我們致力於開發智慧橘子，讓每一顆橘子都能連接互聯網，實現真正的「物聯橘」時代。</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // 顯示個人檔案
    showProfile() {
        if (!this.currentUser) {
            this.showNotification('請先登入', 'warning');
            return;
        }

        // 計算註冊天數
        const registrationDate = new Date(this.currentUser.registrationDate || Date.now());
        const daysSinceRegistration = Math.floor((Date.now() - registrationDate) / (1000 * 60 * 60 * 24));

        // 創建個人檔案彈窗
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.style.overflow = '';
                modal.remove();
            }
        };
        
        // ESC鍵關閉彈窗
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
                document.body.style.overflow = '';
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // 防止背景滾動
        document.body.style.overflow = 'hidden';
        
        modal.innerHTML = `
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>👤 個人檔案</h2>
                    <button class="modal-close-btn" onclick="document.body.style.overflow=''; this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="info-section">
                        <h3>📊 交易統計</h3>
                        <div class="info-list">
                            <div>用戶ID：${this.currentUser.id}</div>
                            <div>註冊天數：${daysSinceRegistration} 天</div>
                            <div>當前積分：<span id="profilePoints">載入中...</span></div>
                            <div>持有股數：<span id="profileShares">載入中...</span></div>
                            <div>總資產價值：<span id="profileTotal">載入中...</span></div>
                        </div>
                    </div>
                    <div class="info-section">
                        <h3>🎯 成就徽章</h3>
                        <div class="badges">
                            <span class="badge" title="新手交易員">🌱</span>
                            <span class="badge" title="早期投資者">⏰</span>
                            ${this.currentUser.role === 'admin' ? '<span class="badge" title="系統管理員">👑</span>' : ''}
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="action-btn" id="changePasswordBtn">🔐 修改密碼</button>
                        <button class="action-btn" id="accountSettingsBtn">⚙️ 帳號設置</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 載入用戶資產數據
        this.loadProfileData();
        
        // 綁定按鈕事件
        setTimeout(() => {
            const changePasswordBtn = document.getElementById('changePasswordBtn');
            const accountSettingsBtn = document.getElementById('accountSettingsBtn');
            
            if (changePasswordBtn) {
                changePasswordBtn.addEventListener('click', () => {
                    alert('密碼修改功能開發中...');
                });
            }
            
            if (accountSettingsBtn) {
                accountSettingsBtn.addEventListener('click', () => {
                    alert('設置功能開發中...');
                });
            }
        }, 100);
    }

    // 載入個人檔案數據
    async loadProfileData() {
        try {
            const response = await fetch('/api/trading/portfolio', {
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                const portfolio = data.portfolio;
                const profilePoints = document.getElementById('profilePoints');
                const profileShares = document.getElementById('profileShares');
                const profileTotal = document.getElementById('profileTotal');
                
                if (profilePoints) profilePoints.textContent = portfolio.points;
                if (profileShares) profileShares.textContent = `${portfolio.orangeShares} 股`;
                if (profileTotal) profileTotal.textContent = `$${portfolio.totalValue.toFixed(2)}`;
            }
        } catch (error) {
            console.error('載入個人檔案數據失敗:', error);
        }
    }

    // 顯示認證區域
    showAuthSection() {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('tradingSection').style.display = 'none';
        document.getElementById('navAuth').style.display = 'flex';
        document.getElementById('navUserInfo').style.display = 'none';
    }

    // 顯示交易區域
    showTradingSection() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('tradingSection').style.display = 'block';
        document.getElementById('navAuth').style.display = 'none';
        document.getElementById('navUserInfo').style.display = 'flex';
        
        if (this.currentUser) {
            document.getElementById('navUserName').textContent = this.currentUser.username;
        }
    }

    // 顯示登入表單
    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    }

    // 顯示註冊表單
    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }

    // 處理登入
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('orangeToken', data.token);
                this.currentUser = {
                    id: data.user.id,
                    username: data.user.username,
                    role: data.user.role,
                    token: data.token
                };
                
                // 檢查是否為管理員用戶並顯示管理員按鈕
                if (data.user.role === 'admin') {
                    const adminBtn = document.getElementById('adminPanelBtn');
                    if (adminBtn) {
                        adminBtn.style.display = 'block';
                    }
                    console.log('✅ 管理員用戶已登入，管理面板可用');
                }
                
                this.showNotification(data.message, 'success');
                this.showTradingSection();
                this.loadUserPortfolio();
                this.loadTransactionHistory();
                this.startAutoRefresh(); // 啟動自動刷新
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('登入錯誤:', error);
            this.showNotification('登入失敗，請稍後再試', 'error');
        }
    }

    // 處理註冊
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'success');
                this.showLoginForm();
                document.getElementById('loginUsername').value = username;
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('註冊錯誤:', error);
            this.showNotification('註冊失敗，請稍後再試', 'error');
        }
    }

    // 登出
    logout() {
        localStorage.removeItem('orangeToken');
        this.currentUser = null;
        
        // 停止自動刷新
        this.stopAutoRefresh();
        
        // 隱藏管理員按鈕
        const adminBtn = document.getElementById('adminPanelBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
        
        // 關閉管理員面板
        this.hideAdminPanel();
        
        this.showNotification('已登出', 'info');
        this.showAuthSection();
        this.showLoginForm();
    }

    // 載入用戶資產組合
    async loadUserPortfolio() {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/trading/portfolio', {
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.updatePortfolioUI(data.portfolio);
            }
        } catch (error) {
            console.error('載入資產組合失敗:', error);
        }
    }

    // 更新資產組合UI
    updatePortfolioUI(portfolio) {
        document.getElementById('userPoints').textContent = portfolio.points;
        document.getElementById('navUserPoints').textContent = `💰 ${portfolio.points}`;
        document.getElementById('userShares').textContent = `${portfolio.orangeShares} 股`;
        document.getElementById('stockValue').textContent = `$${portfolio.stockValue.toFixed(2)}`;
        document.getElementById('totalValue').textContent = `$${portfolio.totalValue.toFixed(2)}`;
        
        // 更新當前價格
        this.currentPrice = portfolio.currentPrice;
        document.getElementById('currentPrice').textContent = `$${portfolio.currentPrice.toFixed(2)}`;
        
        this.updateTradeCosts();
    }

    // 更新交易成本顯示
    updateTradeCosts() {
        const quantity = parseInt(document.getElementById('tradeQuantity').value) || 1;
        const totalCost = this.currentPrice * quantity;
        
        document.getElementById('buyCost').textContent = `$${totalCost.toFixed(2)}`;
        document.getElementById('sellRevenue').textContent = `$${totalCost.toFixed(2)}`;
    }

    // 處理交易
    async handleTrade(type) {
        if (!this.currentUser) {
            this.showNotification('請先登入', 'error');
            return;
        }

        const quantity = parseInt(document.getElementById('tradeQuantity').value);
        if (!quantity || quantity <= 0) {
            this.showNotification('請輸入有效的交易數量', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/trading/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.currentUser.token}`
                },
                body: JSON.stringify({ quantity })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'success');
                // 交易成功後立即刷新所有數據
                this.refreshAllData();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('交易錯誤:', error);
            this.showNotification('交易失敗，請稍後再試', 'error');
        }
    }

    // 載入股價圖表
    async loadStockChart(period) {
        try {
            console.log(`📈 載入 ${period} 圖表數據...`);
            
            // 嘗試從API載入數據
            try {
                const response = await fetch(`/api/stock/history/${period}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data.length > 0) {
                        this.renderChart(data.data, period);
                        console.log('✅ 圖表數據載入成功');
                        return;
                    }
                }
            } catch (error) {
                console.log('⚠️ API載入失敗，使用模擬數據');
            }

            // 如果API失敗，使用模擬數據
            console.log('📊 使用模擬數據繪製圖表');
            this.renderChart(this.generateMockData(period), period);
            
        } catch (error) {
            console.error('載入股價歷史失敗:', error);
            // 即使出錯也要嘗試顯示基本圖表
            this.renderChart(this.generateMockData(period), period);
        }
    }

    // 生成模擬數據
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
        let basePrice = 100;
        
        for (let i = config.count - 1; i >= 0; i--) {
            const timestamp = new Date(now - (i * config.step)).toISOString();
            basePrice += (Math.random() - 0.5) * 2; // 隨機波動 ±1
            basePrice = Math.max(50, Math.min(200, basePrice)); // 限制範圍
            
            mockData.push({
                price: Math.round(basePrice * 100) / 100,
                timestamp: timestamp,
                volume: Math.floor(Math.random() * 100),
                type: 'mock'
            });
        }
        
        return mockData;
    }

    // 繪製圖表
    renderChart(data, period) {
        try {
            console.log(`🎨 繪製 ${period} 圖表，數據點: ${data.length}`);
            
            const canvas = document.getElementById('stockChart');
            if (!canvas) {
                console.error('找不到圖表畫布元素');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
            // 銷毀現有圖表
            if (this.chart) {
                this.chart.destroy();
            }

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

            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Orange股價',
                        data: prices,
                        borderColor: '#ff6b35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ff6b35',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#b8b8d4'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#b8b8d4',
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    elements: {
                        point: {
                            hoverRadius: 8
                        }
                    }
                }
            });
            
            console.log('✅ 圖表繪製完成');
            
        } catch (error) {
            console.error('圖表繪製失敗:', error);
        }
    }

    // 切換時間段
    changePeriod(period) {
        this.selectedPeriod = period;
        
        // 更新按鈕狀態
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // 重新載入圖表
        this.loadStockChart(period);
    }

    // 載入交易歷史
    async loadTransactionHistory() {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/stock/transactions', {
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.renderTransactionHistory(data.transactions);
            }
        } catch (error) {
            console.error('載入交易歷史失敗:', error);
        }
    }

    // 渲染交易歷史
    renderTransactionHistory(transactions) {
        const container = document.getElementById('transactionHistory');
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <span class="empty-icon">📝</span>
                    <p>還沒有交易記錄</p>
                </div>
            `;
            return;
        }

        const historyHTML = transactions.map(tx => {
            const date = new Date(tx.timestamp);
            const typeClass = tx.type === 'buy' ? 'buy' : 'sell';
            const typeText = tx.type === 'buy' ? '買入' : '賣出';
            
            return `
                <div class="history-item">
                    <div class="transaction-info">
                        <span class="transaction-type ${typeClass}">${typeText}</span>
                        <span class="transaction-quantity">${tx.quantity} 股</span>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-amount">$${tx.totalAmount.toFixed(2)}</div>
                        <div class="transaction-time">${date.toLocaleString('zh-TW')}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = historyHTML;
    }

    // 更新股價
    updateStockPrice(data) {
        this.currentPrice = data.price;
        
        // 更新各處顯示的價格
        document.getElementById('currentPrice').textContent = `$${data.price.toFixed(2)}`;
        document.getElementById('heroCurrentPrice').textContent = `$${data.price.toFixed(2)}`;
        document.getElementById('orderBookPrice').textContent = `$${data.price.toFixed(2)}`;
        
        this.updateTradeCosts();
        
        // 更新五檔報價
        this.loadOrderBook();

        // 如果有圖表，添加新數據點
        if (this.chart && data.type !== 'fluctuation') {
            const newLabel = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
            this.chart.data.labels.push(newLabel);
            this.chart.data.datasets[0].data.push(data.price);
            
            // 限制數據點數量
            if (this.chart.data.labels.length > 50) {
                this.chart.data.labels.shift();
                this.chart.data.datasets[0].data.shift();
            }
            
            this.chart.update('none');
        }
    }

    // 更新英雄區域統計
    updateHeroStats(stats) {
        document.getElementById('heroCurrentPrice').textContent = `$${stats.currentPrice.toFixed(2)}`;
        
        const changePercent = stats.priceChangePercentage.toFixed(2);
        const changeElement = document.getElementById('heroPriceChange');
        changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
        changeElement.style.color = changePercent >= 0 ? '#4ecdc4' : '#ff6b6b';
        
        document.getElementById('heroVolume').textContent = stats.totalBuyVolume + stats.totalSellVolume;
    }

    // 更新連線狀態
    updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (connected) {
            statusDot.classList.remove('disconnected');
            statusText.textContent = '已連接';
        } else {
            statusDot.classList.add('disconnected');
            statusText.textContent = '連接中斷';
        }
    }

    // === 管理員功能 ===
    
    // 顯示管理員面板
    showAdminPanel() {
        if (this.currentUser?.role !== 'admin') {
            this.showNotification('需要管理員權限', 'error');
            return;
        }
        
        const adminPanel = document.getElementById('adminPanelSection');
        if (adminPanel) {
            adminPanel.style.display = 'block';
            this.loadAdminStats();
            this.bindAdminPanelEvents(); // 確保事件綁定
            
            // 預設載入統計數據
            const statsTab = document.querySelector('.admin-tab[data-tab="stats"]');
            if (statsTab) {
                statsTab.click();
            }
        }
    }

    // 隱藏管理員面板
    hideAdminPanel() {
        const adminPanel = document.getElementById('adminPanelSection');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
    }

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
                
                // 更新統計顯示
                const totalUsersEl = document.getElementById('totalUsers');
                const adminUsersEl = document.getElementById('adminUsers');
                const totalTradesEl = document.getElementById('totalTrades');
                
                if (totalUsersEl) totalUsersEl.textContent = stats.users.total_users || 0;
                if (adminUsersEl) adminUsersEl.textContent = stats.users.admin_users || 0;
                if (totalTradesEl) totalTradesEl.textContent = stats.trades.total_trades || 0;
            }
        } catch (error) {
            console.error('載入管理員統計失敗:', error);
            this.showNotification('載入統計數據失敗', 'error');
        }
    }

    // 顯示通知
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    // 顯示價格影響設置
    showPriceImpactSettings() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.style.overflow = '';
                modal.remove();
            }
        };
        
        modal.innerHTML = `
            <div class="modal-content price-settings-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>📊 價格影響設置</h2>
                    <button class="modal-close-btn" onclick="document.body.style.overflow=''; this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="settings-info">
                        <p>調整交易對股價的影響程度，數值越高，每筆交易對股價的影響越大。</p>
                    </div>
                    <div class="settings-form">
                        <div class="setting-group">
                            <label>買入影響係數</label>
                            <div class="input-with-info">
                                <input type="range" id="buyImpact" min="0.1" max="2.0" step="0.1" value="1.0">
                                <span class="value-display">1.0</span>
                            </div>
                            <small>控制買入訂單對股價上漲的影響</small>
                        </div>
                        <div class="setting-group">
                            <label>賣出影響係數</label>
                            <div class="input-with-info">
                                <input type="range" id="sellImpact" min="0.1" max="2.0" step="0.1" value="1.0">
                                <span class="value-display">1.0</span>
                            </div>
                            <small>控制賣出訂單對股價下跌的影響</small>
                        </div>
                        <div class="setting-group">
                            <label>價格波動範圍</label>
                            <div class="input-with-info">
                                <input type="range" id="priceVolatility" min="0.5" max="5.0" step="0.5" value="2.0">
                                <span class="value-display">2.0%</span>
                            </div>
                            <small>設定每次交易的最大價格變動百分比</small>
                        </div>
                    </div>
                    <div class="modal-buttons">
                        <button class="btn-secondary" onclick="document.body.style.overflow=''; this.closest('.modal-overlay').remove()">取消</button>
                        <button class="btn-primary" onclick="alert('設置已保存！'); document.body.style.overflow=''; this.closest('.modal-overlay').remove()">保存設置</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);
        
        // 綁定滑塊事件
        setTimeout(() => {
            const bindSlider = (sliderId, suffix = '') => {
                const slider = document.getElementById(sliderId);
                const display = slider.nextElementSibling;
                slider.addEventListener('input', () => {
                    display.textContent = slider.value + suffix;
                });
            };
            
            bindSlider('buyImpact');
            bindSlider('sellImpact');
            bindSlider('priceVolatility', '%');
        }, 100);
    }
    
    // 調整股價
    async adjustStockPrice() {
        const newPrice = document.getElementById('newStockPrice').value;
        const reason = document.getElementById('adjustReason').value;
        
        if (!newPrice || newPrice <= 0) {
            this.showNotification('請輸入有效的股價', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/stock/admin/adjust-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('orangeToken')}`
                },
                body: JSON.stringify({ 
                    newPrice: parseFloat(newPrice),
                    reason: reason || '管理員手動調整'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('股價調整成功', 'success');
                document.getElementById('newStockPrice').value = '';
                document.getElementById('adjustReason').value = '';
                // 更新顯示的當前價格
                document.getElementById('controlCurrentPrice').textContent = `$${parseFloat(newPrice).toFixed(2)}`;
            } else {
                this.showNotification(result.message || '股價調整失敗', 'error');
            }
        } catch (error) {
            console.error('調整股價失敗:', error);
            this.showNotification('系統錯誤，請稍後再試', 'error');
        }
    }
    
    // 載入管理員用戶列表
    async loadAdminUsers() {
        try {
            const response = await fetch('/api/stock/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('orangeToken')}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.renderAdminUsers(result.users);
            } else {
                this.showNotification('載入用戶列表失敗', 'error');
            }
        } catch (error) {
            console.error('載入用戶列表失敗:', error);
            this.showNotification('系統錯誤，請稍後再試', 'error');
        }
    }
    
    // 渲染用戶列表
    renderAdminUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="loading-row">暫無用戶數據</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email || '-'}</td>
                <td><span class="role-badge role-${user.role}">${user.role === 'admin' ? '管理員' : '用戶'}</span></td>
                <td>${user.points || 0}</td>
                <td>${user.shares || 0}</td>
                <td>${user.tradeCount || 0}</td>
                <td>${new Date(user.createdAt).toLocaleDateString('zh-TW')}</td>
                <td>
                    <button class="user-action-btn" onclick="alert('功能開發中')">編輯</button>
                </td>
            </tr>
        `).join('');
    }
    
    // 載入五檔報價
    async loadOrderBook() {
        try {
            // 模擬五檔報價數據
            const currentPrice = this.currentPrice || 10.00;
            
            // 生成賣單（高於當前價格）
            const sellOrders = [];
            for (let i = 5; i >= 1; i--) {
                sellOrders.push({
                    price: currentPrice + (i * 0.1),
                    quantity: Math.floor(Math.random() * 300) + 100
                });
            }
            
            // 生成買單（低於當前價格）
            const buyOrders = [];
            for (let i = 1; i <= 5; i++) {
                buyOrders.push({
                    price: currentPrice - (i * 0.1),
                    quantity: Math.floor(Math.random() * 300) + 100
                });
            }
            
            // 更新DOM
            const sellOrdersEl = document.getElementById('sellOrders');
            if (sellOrdersEl) {
                sellOrdersEl.innerHTML = sellOrders.map(order => `
                    <div class="order-row sell">
                        <span class="price">$${order.price.toFixed(2)}</span>
                        <span class="quantity">${order.quantity}</span>
                    </div>
                `).join('');
            }
            
            const buyOrdersEl = document.getElementById('buyOrders');
            if (buyOrdersEl) {
                buyOrdersEl.innerHTML = buyOrders.map(order => `
                    <div class="order-row buy">
                        <span class="price">$${order.price.toFixed(2)}</span>
                        <span class="quantity">${order.quantity}</span>
                    </div>
                `).join('');
            }
            
            // 更新當前價格
            const orderBookPriceEl = document.getElementById('orderBookPrice');
            if (orderBookPriceEl) {
                orderBookPriceEl.textContent = `$${currentPrice.toFixed(2)}`;
            }
            
        } catch (error) {
            console.error('載入五檔報價失敗:', error);
        }
    }
    
    // 載入成交紀錄
    async loadRecentTrades() {
        try {
            const response = await fetch('/api/stock/recent-trades');
            const data = await response.json();
            
            if (data.success && data.trades) {
                this.renderRecentTrades(data.trades);
            } else {
                // 使用模擬數據
                this.renderRecentTrades(this.generateMockTrades());
            }
        } catch (error) {
            console.error('載入成交紀錄失敗:', error);
            // 使用模擬數據
            this.renderRecentTrades(this.generateMockTrades());
        }
    }
    
    // 生成模擬成交紀錄
    generateMockTrades() {
        const trades = [];
        const types = ['buy', 'sell'];
        const basePrice = this.currentPrice || 10.00;
        
        for (let i = 0; i < 10; i++) {
            const type = types[Math.floor(Math.random() * 2)];
            const priceVariation = (Math.random() - 0.5) * 0.5;
            const time = new Date(Date.now() - i * 60000); // 每筆間隔1分鐘
            
            trades.push({
                time: time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                price: basePrice + priceVariation,
                quantity: Math.floor(Math.random() * 100) + 10,
                type: type
            });
        }
        
        return trades;
    }
    
    // 渲染成交紀錄
    renderRecentTrades(trades) {
        const tradesListEl = document.getElementById('recentTradesList');
        if (!tradesListEl) return;
        
        tradesListEl.innerHTML = trades.map(trade => `
            <div class="trade-record">
                <span class="trade-time">${trade.time}</span>
                <span class="trade-price ${trade.type}">$${trade.price.toFixed(2)}</span>
                <span class="trade-quantity">${trade.quantity}</span>
                <span class="trade-type ${trade.type}">${trade.type === 'buy' ? '買入' : '賣出'}</span>
            </div>
        `).join('');
    }
}

// 啟動應用程式
document.addEventListener('DOMContentLoaded', () => {
    new OrangeStockApp();
}); 