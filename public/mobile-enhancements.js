// 手機版增強功能
class MobileEnhancements {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.currentSection = 'trading';
        
        if (this.isMobile) {
            this.init();
        }
    }
    
    init() {
        // 添加滑動手勢支援
        this.addSwipeGestures();
        
        // 優化輸入框
        this.optimizeInputs();
        
        // 添加震動反饋
        this.addHapticFeedback();
        
        // 優化滾動
        this.optimizeScrolling();
        
        // 防止雙擊縮放
        this.preventDoubleTapZoom();
    }
    
    // 滑動手勢
    addSwipeGestures() {
        const mainContent = document.querySelector('main');
        
        mainContent.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        mainContent.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }
    
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            const sections = ['trading', 'stockInfo', 'portfolio', 'profile'];
            const currentIndex = sections.indexOf(this.currentSection);
            
            if (diff > 0 && currentIndex < sections.length - 1) {
                // 向左滑動，下一個區塊
                this.navigateToSection(sections[currentIndex + 1]);
            } else if (diff < 0 && currentIndex > 0) {
                // 向右滑動，上一個區塊
                this.navigateToSection(sections[currentIndex - 1]);
            }
        }
    }
    
    navigateToSection(section) {
        const navItem = document.querySelector(`[data-section="${section}"]`);
        if (navItem) {
            navItem.click();
            this.currentSection = section;
        }
    }
    
    // 優化輸入框
    optimizeInputs() {
        const inputs = document.querySelectorAll('input[type="number"]');
        
        inputs.forEach(input => {
            // 添加輸入模式
            input.setAttribute('inputmode', 'decimal');
            
            // 自動聚焦時顯示數字鍵盤
            input.addEventListener('focus', () => {
                if (input.type === 'number') {
                    input.setAttribute('pattern', '[0-9]*');
                }
            });
        });
    }
    
    // 震動反饋
    addHapticFeedback() {
        if ('vibrate' in navigator) {
            const buttons = document.querySelectorAll('button, .clickable');
            
            buttons.forEach(button => {
                button.addEventListener('touchstart', () => {
                    navigator.vibrate(10);
                });
            });
        }
    }
    
    // 優化滾動
    optimizeScrolling() {
        // 添加慣性滾動
        const scrollContainers = document.querySelectorAll('.modal-body, .trades-list, .order-book');
        
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.overflowScrolling = 'touch';
        });
        
        // 防止滾動穿透
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.addEventListener('touchmove', (e) => {
                if (e.target === modal) {
                    e.preventDefault();
                }
            }, { passive: false });
        });
    }
    
    // 防止雙擊縮放
    preventDoubleTapZoom() {
        let lastTouchEnd = 0;
        
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    // 顯示載入指示器
    showLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'mobile-loading-indicator';
        indicator.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(indicator);
        
        return {
            remove: () => indicator.remove()
        };
    }
    
    // 顯示下拉刷新
    addPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;
        
        const mainContent = document.querySelector('main');
        const refreshThreshold = 80;
        
        // 創建下拉指示器
        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-to-refresh-indicator';
        pullIndicator.innerHTML = '<span>下拉刷新</span>';
        mainContent.insertBefore(pullIndicator, mainContent.firstChild);
        
        mainContent.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        });
        
        mainContent.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            
            currentY = e.touches[0].pageY;
            const diff = currentY - startY;
            
            if (diff > 0 && window.scrollY === 0) {
                e.preventDefault();
                
                const progress = Math.min(diff / refreshThreshold, 1);
                pullIndicator.style.transform = `translateY(${diff}px)`;
                pullIndicator.style.opacity = progress;
                
                if (diff > refreshThreshold) {
                    pullIndicator.innerHTML = '<span>釋放刷新</span>';
                } else {
                    pullIndicator.innerHTML = '<span>下拉刷新</span>';
                }
            }
        });
        
        mainContent.addEventListener('touchend', () => {
            if (!pulling) return;
            
            const diff = currentY - startY;
            
            if (diff > refreshThreshold) {
                // 觸發刷新
                pullIndicator.innerHTML = '<span>刷新中...</span>';
                document.getElementById('refreshBtn').click();
                
                setTimeout(() => {
                    pullIndicator.style.transform = 'translateY(0)';
                    pullIndicator.style.opacity = '0';
                }, 1000);
            } else {
                pullIndicator.style.transform = 'translateY(0)';
                pullIndicator.style.opacity = '0';
            }
            
            pulling = false;
            startY = 0;
            currentY = 0;
        });
    }
}

// 初始化手機增強功能
document.addEventListener('DOMContentLoaded', () => {
    new MobileEnhancements();
}); 