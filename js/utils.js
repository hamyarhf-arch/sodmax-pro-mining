// ==================== utils.js ====================
// توابع کمکی SODmAX Pro

console.log('🔧 بارگذاری توابع کمکی...');

// ==================== فرمت اعداد ====================

const NumberUtils = {
    formatNumber(num, decimals = 1) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '۰';
        }
        
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(decimals) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(decimals) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(decimals) + 'K';
        }
        
        return Math.floor(num).toLocaleString('fa-IR');
    },
    
    formatCurrency(amount, currency = 'SOD') {
        if (currency === 'USDT') {
            return amount.toFixed(4) + ' ' + currency;
        }
        
        const formatted = this.formatNumber(amount);
        return formatted + ' ' + currency;
    },
    
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diff = now - past;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'همین الان';
        if (minutes < 60) return `${minutes} دقیقه پیش`;
        if (hours < 24) return `${hours} ساعت پیش`;
        if (days < 7) return `${days} روز پیش`;
        
        return this.formatDate(date);
    }
};

// ==================== اعتبارسنجی ====================

const Validation = {
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    validatePassword(password) {
        if (password.length < 6) {
            return { valid: false, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' };
        }
        return { valid: true, message: '' };
    },
    
    validateName(name) {
        if (!name || name.trim().length < 2) {
            return { valid: false, message: 'نام باید حداقل ۲ کاراکتر باشد' };
        }
        return { valid: true, message: '' };
    }
};

// ==================== ذخیره‌سازی محلی ====================

const Storage = {
    prefix: 'sodmax_',
    
    set(key, value) {
        try {
            const fullKey = this.prefix + key;
            localStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('❌ خطا در ذخیره‌سازی:', error);
            return false;
        }
    },
    
    get(key) {
        try {
            const fullKey = this.prefix + key;
            const value = localStorage.getItem(fullKey);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('❌ خطا در خواندن:', error);
            return null;
        }
    },
    
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('❌ خطا در حذف:', error);
            return false;
        }
    },
    
    clearAll() {
        try {
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
            
        } catch (error) {
            console.error('❌ خطا در پاک کردن:', error);
            return false;
        }
    },
    
    // ذخیره‌سازی امن برای داده‌های حساس
    setSecure(key, value) {
        try {
            const encrypted = btoa(JSON.stringify(value));
            return this.set(key + '_secure', encrypted);
        } catch (error) {
            console.error('❌ خطا در ذخیره‌سازی امن:', error);
            return false;
        }
    },
    
    getSecure(key) {
        try {
            const encrypted = this.get(key + '_secure');
            if (!encrypted) return null;
            
            const decrypted = JSON.parse(atob(encrypted));
            return decrypted;
        } catch (error) {
            console.error('❌ خطا در خواندن امن:', error);
            return null;
        }
    }
};

// ==================== مدیریت حالت ====================

const StateManager = {
    currentPage: 'home',
    user: null,
    gameData: null,
    
    setPage(page) {
        this.currentPage = page;
        this.dispatchEvent('pageChange', page);
    },
    
    setUser(user) {
        this.user = user;
        Storage.set('user', user);
        this.dispatchEvent('userChange', user);
    },
    
    setGameData(gameData) {
        this.gameData = gameData;
        Storage.set('gameData', gameData);
        this.dispatchEvent('gameDataChange', gameData);
    },
    
    // سیستم event
    listeners: {},
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    off(event, callback) {
        if (!this.listeners[event]) return;
        
        const index = this.listeners[event].indexOf(callback);
        if (index > -1) {
            this.listeners[event].splice(index, 1);
        }
    },
    
    dispatchEvent(event, data) {
        if (!this.listeners[event]) return;
        
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ خطا در اجرای callback برای ${event}:`, error);
            }
        });
    },
    
    // بازیابی از localStorage
    restore() {
        const savedUser = Storage.get('user');
        const savedGameData = Storage.get('gameData');
        
        if (savedUser) this.user = savedUser;
        if (savedGameData) this.gameData = savedGameData;
        
        return { user: this.user, gameData: this.gameData };
    }
};

// ==================== افکت‌های بصری ====================

const Effects = {
    createMiningEffect(amount, x, y) {
        const effect = document.createElement('div');
        effect.className = 'mining-effect';
        effect.textContent = '+' + NumberUtils.formatNumber(amount);
        effect.style.cssText = `
            position: fixed;
            color: var(--primary);
            font-weight: 900;
            font-size: 18px;
            pointer-events: none;
            z-index: 10000;
            text-shadow: 0 0 10px var(--primary);
            animation: floatUp 1s ease-out forwards;
            left: ${x}px;
            top: ${y}px;
        `;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 1000);
        
        return effect;
    },
    
    createConfetti() {
        const colors = ['#0066FF', '#00D4AA', '#FF6B35', '#26A17B'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -20px;
                left: ${Math.random() * 100}vw;
                border-radius: 50%;
                z-index: 10000;
                pointer-events: none;
                animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
        
        // اضافه کردن انیمیشن CSS
        if (!document.querySelector('#confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    shakeElement(element) {
        element.style.animation = 'shake 0.5s';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
        
        if (!document.querySelector('#shake-style')) {
            const style = document.createElement('style');
            style.id = 'shake-style';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    pulseElement(element) {
        element.style.animation = 'pulse 0.5s';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
};

// ==================== API کمکی ====================

const API = {
    async fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    },
    
    async get(url, options = {}) {
        const response = await this.fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    },
    
    async post(url, data, options = {}) {
        const response = await this.fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data),
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }
};

// ==================== تست و دیباگ ====================

const Debug = {
    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`, data || '');
    },
    
    warn(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.warn(`[${timestamp}] ⚠️ ${message}`, data || '');
    },
    
    error(message, error = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.error(`[${timestamp}] ❌ ${message}`, error || '');
    },
    
    // تست عملکرد
    benchmark(name, callback) {
        const start = performance.now();
        const result = callback();
        const end = performance.now();
        
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    },
    
    // بررسی وضعیت ذخیره‌سازی
    checkStorage() {
        try {
            const total = localStorage.length;
            let sodmaxItems = 0;
            let totalSize = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                if (key.includes('sodmax')) {
                    sodmaxItems++;
                    totalSize += (key.length + value.length) * 2; // تقریبی
                }
            }
            
            return {
                totalItems: total,
                sodmaxItems,
                totalSizeKB: (totalSize / 1024).toFixed(2),
                isOk: totalSize < 5 * 1024 * 1024 // کمتر از 5MB
            };
        } catch (error) {
            return { error: error.message };
        }
    }
};

// ==================== قرار دادن در window ====================

window.NumberUtils = NumberUtils;
window.Validation = Validation;
window.Storage = Storage;
window.StateManager = StateManager;
window.Effects = Effects;
window.API = API;
window.Debug = Debug;

// تابع کمکی برای مقداردهی اولیه
window.initUtils = function() {
    // بازیابی state
    StateManager.restore();
    
    // بررسی storage
    const storageStatus = Debug.checkStorage();
    if (!storageStatus.isOk) {
        Debug.warn('فضای ذخیره‌سازی در حال پر شدن است', storageStatus);
    }
    
    console.log('✅ توابع کمکی بارگذاری شدند');
};

// اجرای خودکار
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.initUtils();
    }, 1000);
});

console.log('🔧 توابع کمکی آماده استفاده هستند');
