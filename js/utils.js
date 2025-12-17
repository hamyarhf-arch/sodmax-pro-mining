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
// ==================== تابع‌های بازی ====================

async function loadUserData(user) {
    try {
        console.log('بارگذاری اطلاعات کاربر:', user.email);
        
        // دریافت یا ایجاد کاربر در دیتابیس
        const { data: userData, error: userError } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        let userInfo;
        if (userError || !userData) {
            // ایجاد کاربر جدید
            userInfo = {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                register_date: new Date().toLocaleDateString('fa-IR'),
                invite_code: 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                is_admin: user.email.toLowerCase() === ADMIN_EMAIL
            };
            
            const { error } = await window.supabaseClient
                .from('users')
                .insert([userInfo]);
            
            if (error) throw error;
        } else {
            userInfo = userData;
        }
        
        // دریافت یا ایجاد اطلاعات بازی
        const { data: gameData, error: gameError } = await window.supabaseClient
            .from('game_data')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        let userGameData;
        if (gameError || !gameData) {
            // ایجاد اطلاعات بازی جدید
            userGameData = {
                user_id: user.id,
                sod_balance: 1000000, // هدیه ثبت نام
                usdt_balance: 0,
                user_level: 1,
                total_mined: 1000000,
                today_earnings: 0,
                mining_power: 10,
                usdt_progress: 0,
                boost_active: false,
                boost_end_time: null,
                last_active: new Date().toISOString()
            };
            
            const { error } = await window.supabaseClient
                .from('game_data')
                .insert([userGameData]);
            
            if (error) throw error;
            
            // ثبت تراکنش هدیه
            await window.supabaseClient
                .from('transactions')
                .insert([{
                    user_id: user.id,
                    description: 'هدیه ثبت نام',
                    amount: 1000000,
                    type: 'sod',
                    created_at: new Date().toISOString()
                }]);
                
            showNotification('🎁 هدیه ثبت نام', '۱,۰۰۰,۰۰۰ SOD دریافت کردید!');
            
        } else {
            userGameData = gameData;
            
            // بروزرسانی last_active
            await window.supabaseClient
                .from('game_data')
                .update({ last_active: new Date().toISOString() })
                .eq('user_id', user.id);
        }
        
        // ذخیره در متغیرهای جهانی
        window.currentUser = user;
        window.userInfo = userInfo;
        window.gameData = userGameData;
        
        // آپدیت UI
        updateUI();
        
        // نمایش لینک ادمین اگر ادمین هست
        if (userInfo.is_admin) {
            showAdminLink();
        }
        
        console.log('اطلاعات بازی بارگذاری شد:', userGameData);
        
    } catch (error) {
        console.error('خطا در بارگذاری اطلاعات:', error);
        showNotification('خطا', 'مشکلی در بارگذاری اطلاعات پیش آمد', 'error');
    }
}

async function mineSOD() {
    if (!window.currentUser || !window.gameData) {
        showNotification('خطا', 'لطفاً ابتدا وارد شوید', 'error');
        return;
    }
    
    try {
        const baseEarned = window.gameData.mining_power || 10;
        const boostMultiplier = window.gameData.boost_active ? 3 : 1;
        const totalEarned = baseEarned * boostMultiplier;
        
        console.log('استخراج:', totalEarned, 'SOD');
        
        // بروزرسانی محلی
        window.gameData.sod_balance += totalEarned;
        window.gameData.total_mined += totalEarned;
        window.gameData.today_earnings += totalEarned;
        window.gameData.usdt_progress += totalEarned;
        
        // بروزرسانی در دیتابیس
        await window.supabaseClient
            .from('game_data')
            .update({
                sod_balance: window.gameData.sod_balance,
                total_mined: window.gameData.total_mined,
                today_earnings: window.gameData.today_earnings,
                usdt_progress: window.gameData.usdt_progress,
                last_active: new Date().toISOString()
            })
            .eq('user_id', window.currentUser.id);
        
        // ثبت تراکنش
        await window.supabaseClient
            .from('transactions')
            .insert([{
                user_id: window.currentUser.id,
                description: 'استخراج دستی',
                amount: totalEarned,
                type: 'sod',
                created_at: new Date().toISOString()
            }]);
        
        // افکت‌ها
        createMiningEffect(totalEarned);
        
        // آپدیت UI
        updateUI();
        
        // بررسی پاداش USDT
        await checkUSDT();
        
    } catch (error) {
        console.error('خطا در استخراج:', error);
        showNotification('خطا', 'مشکلی در استخراج پیش آمد', 'error');
    }
}

async function checkUSDT() {
    if (!window.gameData || (window.gameData.usdt_progress || 0) < EXCHANGE_RATE) {
        return;
    }
    
    try {
        const cycles = Math.floor((window.gameData.usdt_progress || 0) / EXCHANGE_RATE);
        const usdtEarned = cycles * 0.01; // 0.01 USDT per 1M SOD
        
        console.log('پاداش USDT:', usdtEarned, 'از', cycles, 'چرخه');
        
        window.gameData.usdt_balance += usdtEarned;
        window.gameData.usdt_progress %= EXCHANGE_RATE;
        
        // بروزرسانی در دیتابیس
        await window.supabaseClient
            .from('game_data')
            .update({
                usdt_balance: window.gameData.usdt_balance,
                usdt_progress: window.gameData.usdt_progress
            })
            .eq('user_id', window.currentUser.id);
        
        // ثبت تراکنش USDT
        await window.supabaseClient
            .from('transactions')
            .insert([{
                user_id: window.currentUser.id,
                description: 'دریافت پاداش USDT',
                amount: usdtEarned,
                type: 'usdt',
                created_at: new Date().toISOString()
            }]);
        
        showNotification('🎉 پاداش USDT', `${usdtEarned.toFixed(4)} USDT دریافت کردید!`);
        
        // شانس ارتقاء سطح
        if (Math.random() < 0.15) { // 15% chance
            window.gameData.user_level += 1;
            window.gameData.mining_power = 10 * window.gameData.user_level;
            
            await window.supabaseClient
                .from('game_data')
                .update({
                    user_level: window.gameData.user_level,
                    mining_power: window.gameData.mining_power
                })
                .eq('user_id', window.currentUser.id);
            
            showNotification('⭐ ارتقاء سطح', `سطح شما به ${window.gameData.user_level} ارتقاء یافت!`);
        }
        
        updateUI();
        
    } catch (error) {
        console.error('خطا در بررسی USDT:', error);
    }
}

async function claimUSDT() {
    if (!window.currentUser || !window.gameData) {
        showNotification('خطا', 'لطفاً ابتدا وارد شوید', 'error');
        return;
    }
    
    if (!window.gameData.usdt_balance || window.gameData.usdt_balance <= 0) {
        showNotification('اطلاع', 'هنوز USDT پاداش دریافت نکرده‌اید.', 'info');
        return;
    }
    
    const usdtToClaim = window.gameData.usdt_balance;
    const sodNeeded = Math.floor(usdtToClaim * (EXCHANGE_RATE * 100)); // 1M SOD = 0.01 USDT
    
    if (window.gameData.sod_balance < sodNeeded) {
        showNotification('⚠️ موجودی ناکافی', 
            `برای دریافت ${usdtToClaim.toFixed(4)} USDT به ${formatNumber(sodNeeded)} SOD نیاز دارید.`,
            'warning');
        return;
    }
    
    if (!confirm(`آیا مایل به دریافت ${usdtToClaim.toFixed(4)} USDT هستید؟\n\n${formatNumber(sodNeeded)} SOD کسر خواهد شد.`)) {
        return;
    }
    
    try {
        window.gameData.usdt_balance = 0;
        window.gameData.sod_balance -= sodNeeded;
        
        // بروزرسانی در دیتابیس
        await window.supabaseClient
            .from('game_data')
            .update({
                usdt_balance: window.gameData.usdt_balance,
                sod_balance: window.gameData.sod_balance
            })
            .eq('user_id', window.currentUser.id);
        
        // ثبت تراکنش‌ها
        await window.supabaseClient
            .from('transactions')
            .insert([
                {
                    user_id: window.currentUser.id,
                    description: 'دریافت پاداش USDT',
                    amount: -usdtToClaim,
                    type: 'usdt',
                    created_at: new Date().toISOString()
                },
                {
                    user_id: window.currentUser.id,
                    description: 'تبدیل SOD به USDT',
                    amount: -sodNeeded,
                    type: 'sod',
                    created_at: new Date().toISOString()
                }
            ]);
        
        showNotification('✅ پاداش دریافت شد', `${usdtToClaim.toFixed(4)} USDT دریافت کردید.`);
        updateUI();
        
    } catch (error) {
        console.error('خطا در دریافت پاداش:', error);
        showNotification('خطا', 'مشکلی در دریافت پاداش پیش آمد', 'error');
    }
}

function updateUI() {
    if (!window.gameData) return;
    
    // موجودی‌ها
    document.getElementById('sodBalance').textContent = formatNumber(window.gameData.sod_balance);
    document.getElementById('usdtBalance').textContent = window.gameData.usdt_balance.toFixed(4);
    
    // آمار
    document.getElementById('todayEarnings').textContent = formatNumber(window.gameData.today_earnings || 0) + ' SOD';
    document.getElementById('miningPower').textContent = (window.gameData.mining_power || 10) + 'x';
    document.getElementById('clickReward').textContent = '+' + (window.gameData.mining_power || 10) + ' SOD';
    document.getElementById('availableUSDT').textContent = window.gameData.usdt_balance.toFixed(4) + ' USDT';
    
    // نوار پیشرفت
    const progressPercent = Math.min(((window.gameData.usdt_progress || 0) / EXCHANGE_RATE) * 100, 100);
    document.getElementById('progressFill').style.width = progressPercent + '%';
    
    const remaining = EXCHANGE_RATE - (window.gameData.usdt_progress || 0);
    document.getElementById('progressText').textContent = 
        formatNumber(window.gameData.usdt_progress || 0) + ' / ' + formatNumber(EXCHANGE_RATE) + ' SOD';
}

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toLocaleString('fa-IR');
}

function createMiningEffect(amount) {
    const effect = document.createElement('div');
    effect.textContent = '+' + formatNumber(amount);
    effect.style.cssText = `
        position: fixed;
        color: var(--primary);
        font-weight: 900;
        font-size: 18px;
        pointer-events: none;
        z-index: 10000;
        text-shadow: 0 0 10px var(--primary);
        animation: floatUp 1s ease-out forwards;
    `;
    
    const miner = document.getElementById('minerCore');
    const rect = miner.getBoundingClientRect();
    effect.style.left = (rect.left + rect.width / 2) + 'px';
    effect.style.top = (rect.top + rect.height / 2) + 'px';
    
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
}

// اضافه کردن انیمیشن CSS
document.head.insertAdjacentHTML('beforeend', `
    <style>
        @keyframes floatUp {
            0% {
                opacity: 1;
                transform: translate(0, 0) scale(1);
            }
            100% {
                opacity: 0;
                transform: translate(0, -100px) scale(1.2);
            }
        }
    </style>
`);

function showAdminLink() {
    // در صورت نیاز ایجاد لینک ادمین
    const userInfo = document.querySelector('.user-info');
    if (userInfo && window.userInfo && window.userInfo.is_admin) {
        const adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.className = 'btn';
        adminLink.style.background = 'var(--accent)';
        adminLink.style.width = 'auto';
        adminLink.style.padding = '10px 20px';
        adminLink.innerHTML = '<i class="fas fa-user-shield"></i> پنل مدیریت';
        userInfo.insertBefore(adminLink, userInfo.querySelector('button'));
    }
}

// ==================== تابع‌های خرید ====================

async function buySODPlan(planId) {
    if (!window.currentUser || !window.gameData) {
        showNotification('خطا', 'لطفاً ابتدا وارد شوید', 'error');
        return;
    }
    
    const plans = {
        1: { price: 1, sod: 5000000, bonus: 500000, name: 'استارتر' },
        2: { price: 5, sod: 30000000, bonus: 3000000, name: 'پرو' },
        3: { price: 15, sod: 100000000, bonus: 10000000, name: 'پلاتینیوم' },
        4: { price: 50, sod: 500000000, bonus: 50000000, name: 'الماس' }
    };
    
    const plan = plans[planId];
    if (!plan) {
        showNotification('خطا', 'پنل معتبر نیست', 'error');
        return;
    }
    
    const totalSOD = plan.sod + plan.bonus;
    
    const confirmMsg = `آیا مطمئن هستید که می‌خواهید پنل "${plan.name}" را خریداری کنید؟\n\n` +
                      `💰 دریافت: ${formatNumber(totalSOD)} SOD\n` +
                      `🎁 شامل: ${formatNumber(plan.sod)} SOD اصلی + ${formatNumber(plan.bonus)} SOD هدیه`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
        // در نسخه واقعی اینجا پرداخت انجام می‌شود
        // فعلاً فقط اضافه می‌کنیم
        window.gameData.sod_balance += totalSOD;
        window.gameData.total_mined += totalSOD;
        
        // بروزرسانی در دیتابیس
        await window.supabaseClient
            .from('game_data')
            .update({
                sod_balance: window.gameData.sod_balance,
                total_mined: window.gameData.total_mined
            })
            .eq('user_id', window.currentUser.id);
        
        // ثبت تراکنش
        await window.supabaseClient
            .from('transactions')
            .insert([{
                user_id: window.currentUser.id,
                description: `خرید پنل ${plan.name}`,
                amount: totalSOD,
                type: 'sod',
                created_at: new Date().toISOString()
            }]);
        
        showNotification('🎉 خرید موفق', `${formatNumber(totalSOD)} SOD خریداری شد!`);
        updateUI();
        
    } catch (error) {
        console.error('خطا در خرید:', error);
        showNotification('خطا', 'مشکلی در خرید پیش آمد', 'error');
    }
}

// ==================== تابع‌های کمکی ====================

function initSupabase() {
    const SUPABASE_URL = 'https://utnqkgbmdjilvbkwjqef.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bnFrZ2JtZGppbHZia3dqcWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDM3ODUsImV4cCI6MjA4MTQ3OTc4NX0.-PA0KAaSuQ-ZAJZLdVNe-AafE5fHf8CA5R4uR3TKGDc';
    
    try {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase Client ایجاد شد');
    } catch (error) {
        console.error('❌ خطا در ایجاد Supabase Client:', error);
    }
}

// ==================== راه‌اندازی نهایی ====================

console.log('🚀 SODmAX Pro آماده است!');
console.log('🔧 توابع کمکی آماده استفاده هستند');
