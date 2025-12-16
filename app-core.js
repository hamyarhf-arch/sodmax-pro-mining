// فایل: app-core.js
// منطق اصلی بازی SODmAX Pro

console.log('🎮 Loading SODmAX game core...');

class SODmaxGame {
    constructor() {
        this.user = null;
        this.gameData = null;
        this.userInfo = null;
        this.transactions = [];
        this.isAdmin = false;
        this.autoMineInterval = null;
        this.autoSaveInterval = null;
        
        console.log('✅ Game instance created');
    }
    
    // ==================== INITIALIZATION ====================
    
    async init() {
        console.log('🚀 Initializing game...');
        
        // تست اتصال به دیتابیس
        await this.testDatabaseConnection();
        
        // چک session موجود
        await this.checkAuthSession();
        
        // تنظیم event listeners
        this.setupEventListeners();
        
        // شروع auto-save
        this.startAutoSave();
        
        console.log('✅ Game initialized successfully');
    }
    
    async testDatabaseConnection() {
        console.log('🔗 Testing database connection...');
        
        if (!window.GameDB || !window.supabaseClient) {
            console.error('❌ GameDB or supabaseClient not found');
            return false;
        }
        
        const isConnected = await window.GameDB.testConnection();
        if (isConnected) {
            console.log('✅ Connected to Supabase database');
            return true;
        } else {
            console.error('❌ Could not connect to database');
            return false;
        }
    }
    
    async checkAuthSession() {
        try {
            console.log('🔐 Checking authentication session...');
            
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Error getting session:', error);
                this.showLoginPage();
                return;
            }
            
            if (session) {
                console.log('✅ User session found:', session.user.email);
                this.user = session.user;
                await this.loadUserData();
                this.showMainPage();
            } else {
                console.log('ℹ️ No user session found');
                this.showLoginPage();
            }
        } catch (error) {
            console.error('Error in checkAuthSession:', error);
            this.showLoginPage();
        }
    }
    
    // ==================== USER MANAGEMENT ====================
    
    async login(email, password) {
        console.log('🔑 Attempting login for:', email);
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('Login error:', error);
                this.showNotification('خطا در ورود', error.message);
                return false;
            }
            
            console.log('✅ Login successful:', data.user.email);
            this.user = data.user;
            
            // بارگذاری داده‌های کاربر
            await this.loadUserData();
            
            // نمایش صفحه اصلی
            this.showMainPage();
            
            this.showNotification('خوش آمدید', `سلام ${this.userInfo?.full_name || data.user.email}!`);
            
            return true;
            
        } catch (error) {
            console.error('Unexpected login error:', error);
            this.showNotification('خطا', 'مشکلی در ورود پیش آمد');
            return false;
        }
    }
    
    async register(email, password, fullName) {
        console.log('📝 Attempting registration for:', email);
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName || email.split('@')[0]
                    }
                }
            });
            
            if (error) {
                console.error('Registration error:', error);
                this.showNotification('خطا در ثبت‌نام', error.message);
                return false;
            }
            
            console.log('✅ Registration successful:', data.user?.email);
            
            if (data.user) {
                this.user = data.user;
                await this.loadUserData();
                this.showMainPage();
                this.showNotification('ثبت‌نام موفق', 'حساب شما با موفقیت ایجاد شد!');
            } else {
                this.showNotification('تأیید ایمیل', 'لطفاً ایمیل خود را برای تأیید حساب چک کنید.');
            }
            
            return true;
            
        } catch (error) {
            console.error('Unexpected registration error:', error);
            this.showNotification('خطا', 'مشکلی در ثبت‌نام پیش آمد');
            return false;
        }
    }
    
    async logout() {
        console.log('🚪 Logging out...');
        
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            
            if (error) {
                console.error('Logout error:', error);
                return false;
            }
            
            this.user = null;
            this.gameData = null;
            this.userInfo = null;
            this.transactions = [];
            
            // توقف intervalها
            if (this.autoMineInterval) {
                clearInterval(this.autoMineInterval);
                this.autoMineInterval = null;
            }
            
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
            
            console.log('✅ Logout successful');
            this.showLoginPage();
            this.showNotification('خروج', 'با موفقیت از حساب خود خارج شدید.');
            
            return true;
            
        } catch (error) {
            console.error('Unexpected logout error:', error);
            return false;
        }
    }
    
    async loadUserData() {
        if (!this.user) {
            console.error('❌ No user to load data for');
            return;
        }
        
        console.log('📊 Loading user data for:', this.user.email);
        
        try {
            // 1. دریافت یا ایجاد کاربر
            const userResult = await window.GameDB.getOrCreateUser(this.user.id, this.user.email);
            if (userResult.error) {
                console.error('Error getting/creating user:', userResult.error);
                return;
            }
            this.userInfo = userResult.data;
            
            // 2. دریافت یا ایجاد اطلاعات بازی
            const gameResult = await window.GameDB.getOrCreateGameData(this.user.id);
            if (gameResult.error) {
                console.error('Error getting/creating game data:', gameResult.error);
                return;
            }
            this.gameData = gameResult.data;
            
            // 3. بارگذاری تراکنش‌ها
            await this.loadTransactions();
            
            // 4. چک ادمین بودن
            this.checkAdminStatus();
            
            // 5. آپدیت UI
            this.updateUI();
            
            console.log('✅ User data loaded successfully');
            
        } catch (error) {
            console.error('Error in loadUserData:', error);
        }
    }
    
    async loadTransactions() {
        if (!this.user) return;
        
        try {
            const { data, error } = await window.GameDB.getTransactions(this.user.id, 15);
            
            if (error) {
                console.error('Error loading transactions:', error);
                return;
            }
            
            this.transactions = data || [];
            
            // اگر تراکنشی نیست، یک تراکنش نمونه اضافه کن
            if (this.transactions.length === 0 && this.gameData) {
                this.transactions.push({
                    description: 'هدیه ثبت نام',
                    amount: 1000000,
                    type: 'sod',
                    created_at: new Date().toISOString()
                });
            }
            
            this.renderTransactions();
            
        } catch (error) {
            console.error('Error in loadTransactions:', error);
        }
    }
    
    // ==================== GAME LOGIC ====================
    
    async mine() {
        if (!this.user || !this.gameData) {
            console.error('❌ Cannot mine: user or game data not loaded');
            return;
        }
        
        try {
            const baseEarned = this.gameData.mining_power;
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = baseEarned * boostMultiplier;
            
            console.log(`⛏️ Mining: ${baseEarned} × ${boostMultiplier} = ${totalEarned} SOD`);
            
            // آپدیت محلی
            this.gameData.sod_balance += totalEarned;
            this.gameData.total_mined += totalEarned;
            this.gameData.today_earnings += totalEarned;
            this.gameData.usdt_progress += totalEarned;
            
            // آپدیت در دیتابیس
            await window.GameDB.updateGameData(this.user.id, {
                sod_balance: this.gameData.sod_balance,
                total_mined: this.gameData.total_mined,
                today_earnings: this.gameData.today_earnings,
                usdt_progress: this.gameData.usdt_progress
            });
            
            // ثبت تراکنش
            await window.GameDB.addTransaction(
                this.user.id,
                'استخراج دستی',
                totalEarned,
                'sod'
            );
            
            // افکت بصری
            this.createMiningEffect(totalEarned);
            
            // آپدیت UI
            this.updateUI();
            
            // چک پاداش USDT
            await this.checkUSDT();
            
            // بارگذاری مجدد تراکنش‌ها
            await this.loadTransactions();
            
        } catch (error) {
            console.error('❌ Error in mining:', error);
            this.showNotification('خطا', 'مشکلی در استخراج پیش آمد');
        }
    }
    
    async checkUSDT() {
        if (!this.gameData || this.gameData.usdt_progress < 10000000) {
            return;
        }
        
        try {
            const usdtEarned = 0.01;
            const cycles = Math.floor(this.gameData.usdt_progress / 10000000);
            const totalUSDT = usdtEarned * cycles;
            
            console.log(`💰 USDT reward: ${cycles} cycles = ${totalUSDT} USDT`);
            
            this.gameData.usdt_balance += totalUSDT;
            this.gameData.usdt_progress %= 10000000;
            
            // آپدیت در دیتابیس
            await window.GameDB.updateGameData(this.user.id, {
                usdt_balance: this.gameData.usdt_balance,
                usdt_progress: this.gameData.usdt_progress
            });
            
            // ثبت تراکنش
            await window.GameDB.addTransaction(
                this.user.id,
                'دریافت پاداش USDT',
                totalUSDT,
                'usdt'
            );
            
            // نوتیفیکیشن
            this.showNotification(
                '🎉 پاداش USDT', 
                `${totalUSDT.toFixed(4)} USDT دریافت کردید!`
            );
            
            // شانس ارتقاء سطح (15% شانس)
            if (Math.random() < 0.15) {
                this.gameData.user_level += 1;
                this.gameData.mining_power = 10 * this.gameData.user_level;
                
                await window.GameDB.updateGameData(this.user.id, {
                    user_level: this.gameData.user_level,
                    mining_power: this.gameData.mining_power
                });
                
                this.showNotification(
                    '⭐ ارتقاء سطح', 
                    `سطح شما به ${this.gameData.user_level} ارتقاء یافت!`
                );
            }
            
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error in USDT check:', error);
        }
    }
    
    async buySODPlan(planId) {
        const plans = {
            1: { price: 1, sod: 5000000, bonus: 500000, name: 'استارتر' },
            2: { price: 5, sod: 30000000, bonus: 3000000, name: 'پرو' },
            3: { price: 15, sod: 100000000, bonus: 10000000, name: 'پلاتینیوم' },
            4: { price: 50, sod: 500000000, bonus: 50000000, name: 'الماس' }
        };
        
        const plan = plans[planId];
        if (!plan) {
            console.error('❌ Invalid plan ID:', planId);
            return;
        }
        
        const totalSOD = plan.sod + plan.bonus;
        
        console.log(`🛒 Buying plan ${planId}: ${totalSOD} SOD`);
        
        // در نسخه واقعی اینجا پرداخت انجام می‌شود
        // فعلاً فقط اضافه می‌کنیم
        this.gameData.sod_balance += totalSOD;
        this.gameData.total_mined += totalSOD;
        
        try {
            await window.GameDB.updateGameData(this.user.id, {
                sod_balance: this.gameData.sod_balance,
                total_mined: this.gameData.total_mined
            });
            
            await window.GameDB.addTransaction(
                this.user.id,
                `خرید پنل ${plan.name}`,
                totalSOD,
                'sod'
            );
            
            this.showNotification(
                '🛒 خرید موفق', 
                `${this.formatNumber(totalSOD)} SOD خریداری شد!\n(اصلی: ${this.formatNumber(plan.sod)} + هدیه: ${this.formatNumber(plan.bonus)})`
            );
            
            this.updateUI();
            await this.loadTransactions();
            
        } catch (error) {
            console.error('❌ Error buying plan:', error);
            this.showNotification('خطا', 'مشکلی در خرید پیش آمد');
        }
    }
    
    async claimUSDT() {
        if (!this.gameData || this.gameData.usdt_balance <= 0) {
            this.showNotification('💰 ادامه استخراج', 'هنوز USDT پاداش دریافت نکرده‌اید.');
            return;
        }
        
        const usdtToClaim = this.gameData.usdt_balance;
        const sodNeeded = Math.floor(usdtToClaim * 1000000000); // 1B SOD per USDT
        
        if (this.gameData.sod_balance >= sodNeeded) {
            if (confirm(`آیا مایل به دریافت ${usdtToClaim.toFixed(4)} USDT هستید؟\n\n${this.formatNumber(sodNeeded)} SOD از موجودی شما کسر خواهد شد.`)) {
                
                console.log(`💸 Claiming ${usdtToClaim} USDT, costing ${sodNeeded} SOD`);
                
                this.gameData.usdt_balance = 0;
                this.gameData.sod_balance -= sodNeeded;
                
                try {
                    await window.GameDB.updateGameData(this.user.id, {
                        usdt_balance: this.gameData.usdt_balance,
                        sod_balance: this.gameData.sod_balance
                    });
                    
                    await window.GameDB.addTransaction(
                        this.user.id,
                        'دریافت پاداش USDT',
                        -usdtToClaim,
                        'usdt'
                    );
                    
                    await window.GameDB.addTransaction(
                        this.user.id,
                        'تبدیل SOD به USDT',
                        -sodNeeded,
                        'sod'
                    );
                    
                    this.showNotification(
                        '✅ پاداش دریافت شد', 
                        `${usdtToClaim.toFixed(4)} USDT دریافت کردید.\n${this.formatNumber(sodNeeded)} SOD کسر شد.`
                    );
                    
                    this.updateUI();
                    await this.loadTransactions();
                    
                } catch (error) {
                    console.error('❌ Error claiming USDT:', error);
                    this.showNotification('خطا', 'مشکلی در دریافت پاداش پیش آمد');
                }
            }
        } else {
            this.showNotification(
                '⚠️ موجودی ناکافی', 
                `برای دریافت ${usdtToClaim.toFixed(4)} USDT به ${this.formatNumber(sodNeeded)} SOD نیاز دارید.\nموجودی فعلی: ${this.formatNumber(this.gameData.sod_balance)} SOD`
            );
        }
    }
    
    // ==================== UI FUNCTIONS ====================
    
    updateUI() {
        if (!this.gameData) {
            console.warn('⚠️ Cannot update UI: no game data');
            return;
        }
        
        console.log('🎨 Updating UI...');
        
        // موجودی‌ها
        this.updateElement('sodBalance', this.formatNumber(this.gameData.sod_balance) + ' <span>SOD</span>');
        this.updateElement('usdtBalance', this.gameData.usdt_balance.toFixed(4) + ' <span>USDT</span>');
        
        // آمار
        this.updateElement('todayEarnings', this.formatNumber(this.gameData.today_earnings) + ' SOD');
        this.updateElement('miningPower', this.gameData.mining_power + 'x');
        this.updateElement('clickReward', '+' + this.gameData.mining_power + ' SOD');
        this.updateElement('userLevel', this.gameData.user_level);
        
        // پاداش USDT
        this.updateElement('availableUSDT', this.gameData.usdt_balance.toFixed(4) + ' USDT');
        
        // Progress bar
        const progressPercent = Math.min((this.gameData.usdt_progress / 10000000) * 100, 100);
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = progressPercent + '%';
        }
        
        this.updateElement('progressText', 
            this.formatNumber(this.gameData.usdt_progress) + ' / ۱۰,۰۰۰,۰۰۰ SOD (۰.۰۱ USDT)'
        );
        
        // نمایش لینک ادمین
        this.showAdminLink();
        
        // آپدیت دکمه استخراج خودکار
        this.updateAutoMineButton();
        
        console.log('✅ UI updated');
    }
    
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            if (typeof content === 'string' && content.includes('<')) {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        }
    }
    
    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (!container) return;
        
        if (!this.transactions || this.transactions.length === 0) {
            container.innerHTML = `
                <div class="transaction-row">
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        هنوز تراکنشی ثبت نشده است
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.transactions.map(tx => {
            const date = new Date(tx.created_at);
            const timeString = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString('fa-IR');
            
            const icon = tx.type === 'usdt' ? '💰' : 
                        tx.description.includes('خرید') ? '🛒' : 
                        tx.amount < 0 ? '📤' : '⛏️';
            
            const color = tx.amount > 0 ? 'var(--success)' : 'var(--error)';
            const sign = tx.amount > 0 ? '+' : '';
            const amountText = tx.type === 'usdt' 
                ? `${sign}${Math.abs(tx.amount).toFixed(4)} USDT`
                : `${sign}${this.formatNumber(tx.amount)} SOD`;
            
            return `
                <div class="transaction-row">
                    <div class="transaction-type">
                        <div class="transaction-icon">${icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold;">${tx.description}</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">
                                ${dateString} - ${timeString}
                            </div>
                        </div>
                        <div style="font-weight: bold; color: ${color}">
                            ${amountText}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    createMiningEffect(amount) {
        const effect = document.createElement('div');
        effect.textContent = '+' + this.formatNumber(amount);
        effect.className = 'mining-effect';
        effect.style.cssText = `
            position: fixed;
            color: #0066FF;
            font-weight: 900;
            font-size: 20px;
            pointer-events: none;
            z-index: 10000;
            text-shadow: 0 0 10px rgba(0, 102, 255, 0.7);
            animation: miningEffect 1s ease-out forwards;
            user-select: none;
        `;
        
        const miner = document.getElementById('minerCore');
        if (miner) {
            const rect = miner.getBoundingClientRect();
            effect.style.left = (rect.left + rect.width / 2) + 'px';
            effect.style.top = (rect.top + rect.height / 2) + 'px';
        } else {
            effect.style.left = '50%';
            effect.style.top = '50%';
        }
        
        document.body.appendChild(effect);
        
        // اضافه کردن استایل انیمیشن اگر وجود ندارد
        if (!document.getElementById('mining-effect-style')) {
            const style = document.createElement('style');
            style.id = 'mining-effect-style';
            style.textContent = `
                @keyframes miningEffect {
                    0% {
                        opacity: 1;
                        transform: translate(0, 0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(0, -100px) scale(1.5);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => effect.remove(), 1000);
    }
    
    formatNumber(num) {
        const n = Math.abs(num);
        if (n >= 1000000000) return (n / 1000000000).toFixed(2) + 'B';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return Math.floor(n).toLocaleString('fa-IR');
    }
    
    showNotification(title, message) {
        // استفاده از سیستم نوتیفیکیشن موجود یا ایجاد یک نوتیفیکیشن ساده
        if (typeof window.showNotification === 'function') {
            window.showNotification(title, message);
        } else {
            // ایجاد نوتیفیکیشن ساده
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #0066FF, #00D4AA);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 300px;
                animation: slideIn 0.3s ease;
            `;
            
            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
                <div style="font-size: 14px;">${message}</div>
            `;
            
            document.body.appendChild(notification);
            
            // اضافه کردن استایل انیمیشن
            if (!document.getElementById('notification-style')) {
                const style = document.createElement('style');
                style.id = 'notification-style';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    
    showMainPage() {
        const loginPage = document.getElementById('registerOverlay');
        const mainPage = document.getElementById('mainContainer');
        
        if (loginPage) loginPage.style.display = 'none';
        if (mainPage) mainPage.style.display = 'block';
        
        console.log('📱 Showing main page');
    }
    
    showLoginPage() {
        const loginPage = document.getElementById('registerOverlay');
        const mainPage = document.getElementById('mainContainer');
        
        if (loginPage) loginPage.style.display = 'flex';
        if (mainPage) mainPage.style.display = 'none';
        
        console.log('🔐 Showing login page');
    }
    
    checkAdminStatus() {
        if (!this.user) return;
        
        const adminEmails = [
            'hamyarhf@gmail.com',
            'admin@example.com',
            'test@example.com'
        ];
        
        this.isAdmin = adminEmails.includes(this.user.email.toLowerCase());
        console.log(`👑 Admin status: ${this.isAdmin ? 'YES' : 'NO'}`);
    }
    
    showAdminLink() {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = this.isAdmin ? 'flex' : 'none';
        }
    }
    
    updateAutoMineButton() {
        const autoBtn = document.getElementById('autoMineBtn');
        if (!autoBtn) return;
        
        if (this.autoMineInterval) {
            autoBtn.innerHTML = '<i class="fas fa-pause"></i> توقف خودکار';
            autoBtn.style.background = 'var(--error)';
        } else {
            autoBtn.innerHTML = '<i class="fas fa-robot"></i> استخراج خودکار';
            autoBtn.style.background = '';
            
            // غیرفعال کردن اگر موجودی کافی نیست
            if (this.gameData && this.gameData.sod_balance < 1000000) {
                autoBtn.disabled = true;
                autoBtn.innerHTML = '<i class="fas fa-robot"></i> نیاز به ۱M SOD';
            } else {
                autoBtn.disabled = false;
            }
        }
    }
    
    // ==================== EVENT LISTENERS ====================
    
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');
        
        // کلیک ماینر
        const minerCore = document.getElementById('minerCore');
        if (minerCore) {
            minerCore.addEventListener('click', () => this.mine());
        }
        
        // دکمه دریافت USDT
        const claimBtn = document.getElementById('claimUSDTBtn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.claimUSDT());
        }
        
        // دکمه استخراج خودکار
        const autoMineBtn = document.getElementById('autoMineBtn');
        if (autoMineBtn) {
            autoMineBtn.addEventListener('click', () => this.toggleAutoMine());
        }
        
        // دکمه‌های خرید پنل
        document.addEventListener('click', (e) => {
            const buyBtn = e.target.closest('[data-plan-id]');
            if (buyBtn) {
                const planId = parseInt(buyBtn.getAttribute('data-plan-id'));
                this.buySODPlan(planId);
            }
        });
        
        console.log('✅ Event listeners setup complete');
    }
    
    async toggleAutoMine() {
        if (!this.gameData) return;
        
        if (this.autoMineInterval) {
            clearInterval(this.autoMineInterval);
            this.autoMineInterval = null;
            this.showNotification('⏸️ توقف خودکار', 'استخراج خودکار متوقف شد.');
            this.updateAutoMineButton();
            return;
        }
        
        if (this.gameData.sod_balance < 1000000) {
            this.showNotification('⚠️ موجودی ناکافی', 'برای فعال کردن استخراج خودکار حداقل ۱ میلیون SOD نیاز دارید.');
            return;
        }
        
        this.autoMineInterval = setInterval(async () => {
            if (!this.gameData) return;
            
            const earned = Math.floor(this.gameData.mining_power * 0.5);
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = earned * boostMultiplier;
            
            this.gameData.sod_balance += totalEarned;
            this.gameData.total_mined += totalEarned;
            this.gameData.today_earnings += totalEarned;
            this.gameData.usdt_progress += totalEarned;
            
            this.updateUI();
            await this.checkUSDT();
            
        }, 1000); // هر ثانیه
        
        this.showNotification('🤖 استخراج خودکار', 'سیستم استخراج خودکار فعال شد.');
        this.updateAutoMineButton();
    }
    
    startAutoSave() {
        this.autoSaveInterval = setInterval(async () => {
            if (this.user && this.gameData) {
                try {
                    await window.GameDB.updateGameData(this.user.id, {
                        sod_balance: this.gameData.sod_balance,
                        usdt_balance: this.gameData.usdt_balance,
                        total_mined: this.gameData.total_mined,
                        today_earnings: this.gameData.today_earnings,
                        usdt_progress: this.gameData.usdt_progress
                    });
                    console.log('💾 Auto-saved game data');
                } catch (error) {
                    console.error('❌ Auto-save error:', error);
                }
            }
        }, 30000); // هر 30 ثانیه
        
        console.log('💾 Auto-save started');
    }
}

// ==================== GLOBAL FUNCTIONS ====================

// ایجاد نمونه بازی
let gameInstance = null;

// تابع‌های عمومی برای دسترسی از HTML
window.loginUser = async function() {
    const email = document.getElementById('authEmail')?.value || 'test@example.com';
    const password = document.getElementById('authPassword')?.value || '123456';
    
    if (!gameInstance) {
        gameInstance = new SODmaxGame();
        await gameInstance.init();
    }
    
    return await gameInstance.login(email, password);
};

window.registerUser = async function() {
    const email = document.getElementById('authEmail')?.value;
    const password = document.getElementById('authPassword')?.value;
    
    if (!email || !password) {
        alert('لطفاً ایمیل و رمز عبور را وارد کنید');
        return false;
    }
    
    const fullName = prompt('نام کامل خود را وارد کنید:', email.split('@')[0]);
    
    if (!gameInstance) {
        gameInstance = new SODmaxGame();
        await gameInstance.init();
    }
    
    return await gameInstance.register(email, password, fullName);
};

window.logoutUser = function() {
    if (gameInstance) {
        gameInstance.logout();
    }
};

window.mineSOD = function() {
    if (gameInstance) {
        gameInstance.mine();
    }
};

window.buyPlan = function(planId) {
    if (gameInstance) {
        gameInstance.buySODPlan(planId);
    }
};

window.claimUSDT = function() {
    if (gameInstance) {
        gameInstance.claimUSDT();
    }
};

// راه‌اندازی بازی
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 DOM loaded, starting game...');
    
    gameInstance = new SODmaxGame();
    await gameInstance.init();
    
    console.log('🚀 SODmAX Pro is ready!');
});
