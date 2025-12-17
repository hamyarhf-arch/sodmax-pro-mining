// ==================== app-core.js ====================
// نسخه نهایی SODmAX Pro
// تاریخ: ۱۴۰۳/۱۰/۰۵

console.log('🎮 بارگذاری هسته بازی SODmAX Pro...');

class SODmaxGame {
    constructor() {
        this.user = null;
        this.gameData = null;
        this.userInfo = null;
        this.transactions = [];
        this.isAdmin = false;
        this.autoMineInterval = null;
        this.autoSaveInterval = null;
        this.isInitialized = false;
        
        console.log('✅ نمونه بازی ایجاد شد');
    }
    
    // ==================== راه‌اندازی اولیه ====================
    
    async init() {
        console.log('🚀 در حال راه‌اندازی بازی...');
        
        try {
            // 1. بررسی کاربر ذخیره شده
            const hasUser = this.loadUserFromStorage();
            
            if (hasUser) {
                console.log('✅ کاربر پیدا شد:', this.user.email);
                this.showMainPage();
                this.updateUI();
            } else {
                console.log('⚠️ کاربر پیدا نشد - نمایش صفحه ورود');
                this.showLoginPage();
            }
            
            // 2. تنظیم رویدادها
            this.setupEventListeners();
            
            // 3. نمایش پنل‌های فروش
            this.renderSalePlans();
            
            // 4. شروع ذخیره خودکار
            this.startAutoSave();
            
            this.isInitialized = true;
            
            console.log('✅ بازی با موفقیت راه‌اندازی شد');
            
        } catch (error) {
            console.error('❌ خطا در راه‌اندازی بازی:', error);
            this.showLoginPage();
        }
    }
    
    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem('sodmax_user');
            const gameData = localStorage.getItem('sodmax_game');
            
            if (!userData || !gameData) {
                console.log('ℹ️ کاربر ذخیره شده یافت نشد');
                return false;
            }
            
            this.user = JSON.parse(userData);
            this.gameData = JSON.parse(gameData);
            this.userInfo = JSON.parse(localStorage.getItem('sodmax_userinfo') || '{}');
            this.transactions = JSON.parse(localStorage.getItem('sodmax_transactions') || '[]');
            
            // بررسی وضعیت ادمین
            this.checkAdminStatus();
            
            console.log('📊 اطلاعات کاربر بارگذاری شد:', this.user.email);
            
            return true;
            
        } catch (error) {
            console.error('❌ خطا در بارگذاری کاربر:', error);
            return false;
        }
    }
    
    saveToStorage() {
        try {
            if (this.user) localStorage.setItem('sodmax_user', JSON.stringify(this.user));
            if (this.gameData) localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
            if (this.userInfo) localStorage.setItem('sodmax_userinfo', JSON.stringify(this.userInfo));
            if (this.transactions) localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
            
            console.log('💾 اطلاعات ذخیره شد');
        } catch (error) {
            console.error('❌ خطا در ذخیره اطلاعات:', error);
        }
    }
    
    // ==================== مدیریت کاربران ====================
    
    async login(email, password) {
        console.log(`🔑 درخواست ورود برای: ${email}`);
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        try {
            // ایجاد کاربر
            this.user = {
                id: 'user-' + Date.now(),
                email: email,
                user_metadata: { full_name: email.split('@')[0] }
            };
            
            this.gameData = {
                sod_balance: 1000000,
                usdt_balance: 0,
                today_earnings: 0,
                mining_power: 10,
                user_level: 1,
                usdt_progress: 0,
                total_mined: 1000000,
                boost_active: false,
                boost_end_time: 0,
                last_login: new Date().toISOString()
            };
            
            this.userInfo = {
                full_name: email.split('@')[0],
                email: email,
                register_date: new Date().toLocaleDateString('fa-IR'),
                last_active: new Date().toISOString(),
                is_admin: email === 'hamyarhf@gmail.com' // فقط این ایمیل ادمین است
            };
            
            // تراکنش اولیه
            this.transactions = [{
                description: 'هدیه ورود',
                amount: 1000000,
                type: 'sod',
                created_at: new Date().toISOString()
            }];
            
            // ذخیره
            this.saveToStorage();
            
            // نمایش صفحه اصلی
            this.showMainPage();
            this.updateUI();
            this.checkAdminStatus();
            
            this.showNotification(
                'خوش آمدید',
                `سلام ${email.split('@')[0]}! 🎉`
            );
            
            console.log('✅ ورود موفقیت‌آمیز بود');
            return true;
            
        } catch (error) {
            console.error('❌ خطا در ورود:', error);
            this.showNotification('خطا', 'مشکلی در ورود پیش آمد');
            return false;
        }
    }
    
    async register(email, password, fullName) {
        console.log(`📝 درخواست ثبت‌نام برای: ${email}`);
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        try {
            // ایجاد کاربر جدید
            this.user = {
                id: 'new-user-' + Date.now(),
                email: email,
                user_metadata: { full_name: fullName || email.split('@')[0] }
            };
            
            this.gameData = {
                sod_balance: 1000000,
                usdt_balance: 0,
                today_earnings: 0,
                mining_power: 10,
                user_level: 1,
                usdt_progress: 0,
                total_mined: 1000000,
                boost_active: false,
                boost_end_time: 0,
                register_date: new Date().toISOString()
            };
            
            this.userInfo = {
                full_name: fullName || email.split('@')[0],
                email: email,
                register_date: new Date().toLocaleDateString('fa-IR'),
                last_active: new Date().toISOString(),
                is_admin: false
            };
            
            this.transactions = [{
                description: 'هدیه ثبت نام',
                amount: 1000000,
                type: 'sod',
                created_at: new Date().toISOString()
            }];
            
            // ذخیره
            this.saveToStorage();
            
            // نمایش صفحه اصلی
            this.showMainPage();
            this.updateUI();
            
            this.showNotification(
                'ثبت‌نام موفق',
                `حساب شما با موفقیت ایجاد شد! 🎉`
            );
            
            console.log('✅ ثبت‌نام موفقیت‌آمیز بود');
            return true;
            
        } catch (error) {
            console.error('❌ خطا در ثبت‌نام:', error);
            this.showNotification('خطا', 'مشکلی در ثبت‌نام پیش آمد');
            return false;
        }
    }
    
    async logout() {
        console.log('🚪 در حال خروج...');
        
        // توقف عملیات خودکار
        if (this.autoMineInterval) {
            clearInterval(this.autoMineInterval);
            this.autoMineInterval = null;
        }
        
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        // ذخیره آخرین وضعیت
        if (this.userInfo) {
            this.userInfo.last_active = new Date().toISOString();
            this.saveToStorage();
        }
        
        // نمایش صفحه ورود
        this.showLoginPage();
        
        this.showNotification('خروج', 'با موفقیت از حساب خود خارج شدید.');
        
        console.log('✅ خروج موفقیت‌آمیز بود');
    }
    
    // ==================== منطق بازی ====================
    
    async mine() {
        // بررسی اولیه
        if (!this.user || !this.gameData) {
            console.error('❌ امکان استخراج وجود ندارد - لطفاً وارد شوید');
            this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
            return;
        }
        
        console.log('⛏️ در حال استخراج...');
        
        try {
            // محاسبه درآمد
            const baseEarned = this.gameData.mining_power || 10;
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = baseEarned * boostMultiplier;
            
            console.log(`💰 درآمد: ${totalEarned} SOD`);
            
            // بروزرسانی داده‌ها
            this.gameData.sod_balance += totalEarned;
            this.gameData.total_mined += totalEarned;
            this.gameData.today_earnings += totalEarned;
            this.gameData.usdt_progress += totalEarned;
            
            // ثبت تراکنش
            this.addTransaction('استخراج دستی', totalEarned, 'sod');
            
            // ذخیره
            this.saveToStorage();
            
            // افکت‌های بصری
            this.createMiningEffect(totalEarned);
            
            const minerCore = document.getElementById('minerCore');
            if (minerCore) {
                minerCore.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    minerCore.style.transform = 'scale(1)';
                }, 150);
            }
            
            // بروزرسانی رابط کاربری
            this.updateUI();
            
            // بررسی پاداش USDT
            await this.checkUSDT();
            
            console.log('✅ استخراج موفقیت‌آمیز بود');
            
        } catch (error) {
            console.error('❌ خطا در استخراج:', error);
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
            
            console.log(`🎁 پاداش USDT: ${totalUSDT.toFixed(4)} USDT`);
            
            // بروزرسانی موجودی
            this.gameData.usdt_balance += totalUSDT;
            this.gameData.usdt_progress %= 10000000;
            
            // ثبت تراکنش
            this.addTransaction('دریافت پاداش USDT', totalUSDT, 'usdt');
            
            // ذخیره
            this.saveToStorage();
            
            // اعلان
            this.showNotification(
                '🎉 پاداش USDT دریافت شد!',
                `${totalUSDT.toFixed(4)} USDT به موجودی شما اضافه شد.`
            );
            
            // شانس ارتقاء سطح
            if (Math.random() < 0.15) {
                this.gameData.user_level += 1;
                this.gameData.mining_power = 10 * this.gameData.user_level;
                
                this.saveToStorage();
                
                this.showNotification(
                    '⭐ ارتقاء سطح!',
                    `سطح شما به ${this.gameData.user_level} ارتقاء یافت!`
                );
            }
            
            // بروزرسانی رابط کاربری
            this.updateUI();
            
        } catch (error) {
            console.error('❌ خطا در بررسی USDT:', error);
        }
    }
    
    addTransaction(description, amount, type) {
        const transaction = {
            description,
            amount,
            type,
            created_at: new Date().toISOString()
        };
        
        this.transactions.unshift(transaction);
        
        // محدود کردن تعداد تراکنش‌ها
        if (this.transactions.length > 20) {
            this.transactions = this.transactions.slice(0, 20);
        }
        
        // ذخیره
        localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
        
        // بروزرسانی نمایش تراکنش‌ها
        this.renderTransactions();
    }
    
    async buySODPlan(planId) {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
            return;
        }
        
        const plans = {
            1: { 
                price: 1, 
                sod: 5000000, 
                bonus: 500000, 
                name: 'استارتر'
            },
            2: { 
                price: 5, 
                sod: 30000000, 
                bonus: 3000000, 
                name: 'پرو'
            },
            3: { 
                price: 15, 
                sod: 100000000, 
                bonus: 10000000, 
                name: 'پلاتینیوم'
            },
            4: { 
                price: 50, 
                sod: 500000000, 
                bonus: 50000000, 
                name: 'الماس'
            }
        };
        
        const plan = plans[planId];
        if (!plan) {
            this.showNotification('خطا', 'پنل انتخابی معتبر نیست');
            return;
        }
        
        const totalSOD = plan.sod + plan.bonus;
        
        // تایید خرید
        const confirmMessage = `آیا مطمئن هستید که می‌خواهید پنل "${plan.name}" را خریداری کنید؟\n\n` +
                              `💰 دریافت: ${this.formatNumber(totalSOD)} SOD\n` +
                              `🎁 شامل: ${this.formatNumber(plan.sod)} SOD اصلی + ${this.formatNumber(plan.bonus)} SOD هدیه`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            console.log(`🛒 خرید پنل ${plan.name}: ${totalSOD} SOD`);
            
            // اضافه کردن SOD
            this.gameData.sod_balance += totalSOD;
            this.gameData.total_mined += totalSOD;
            
            // ذخیره
            this.saveToStorage();
            
            // ثبت تراکنش
            this.addTransaction(`خرید پنل ${plan.name}`, totalSOD, 'sod');
            
            // اعلان
            this.showNotification(
                '🎉 خرید موفق!',
                `${this.formatNumber(totalSOD)} SOD به موجودی شما اضافه شد.`
            );
            
            // بروزرسانی رابط کاربری
            this.updateUI();
            
        } catch (error) {
            console.error('❌ خطا در خرید:', error);
            this.showNotification('خطا', 'مشکلی در خرید پیش آمد');
        }
    }
    
    async claimUSDT() {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
            return;
        }
        
        if (!this.gameData.usdt_balance || this.gameData.usdt_balance <= 0) {
            this.showNotification('اطلاع', 'هنوز USDT پاداش دریافت نکرده‌اید.');
            return;
        }
        
        const usdtToClaim = this.gameData.usdt_balance;
        const sodNeeded = Math.floor(usdtToClaim * 1000000000);
        
        // بررسی موجودی SOD
        if (this.gameData.sod_balance < sodNeeded) {
            this.showNotification(
                'موجودی ناکافی',
                `برای دریافت ${usdtToClaim.toFixed(4)} USDT به ${this.formatNumber(sodNeeded)} SOD نیاز دارید.`
            );
            return;
        }
        
        // تایید دریافت
        const confirmMessage = `آیا مایل به دریافت ${usdtToClaim.toFixed(4)} USDT هستید؟\n\n` +
                              `⚠️ ${this.formatNumber(sodNeeded)} SOD از موجودی شما کسر خواهد شد.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            console.log(`💸 دریافت ${usdtToClaim} USDT`);
            
            // بروزرسانی موجودی‌ها
            this.gameData.usdt_balance = 0;
            this.gameData.sod_balance -= sodNeeded;
            
            // ذخیره
            this.saveToStorage();
            
            // ثبت تراکنش‌ها
            this.addTransaction('دریافت پاداش USDT', -usdtToClaim, 'usdt');
            this.addTransaction('تبدیل SOD به USDT', -sodNeeded, 'sod');
            
            // اعلان
            this.showNotification(
                '✅ پاداش دریافت شد!',
                `${usdtToClaim.toFixed(4)} USDT دریافت کردید.`
            );
            
            // بروزرسانی رابط کاربری
            this.updateUI();
            
        } catch (error) {
            console.error('❌ خطا در دریافت پاداش:', error);
            this.showNotification('خطا', 'مشکلی در دریافت پاداش پیش آمد');
        }
    }
    
    boostMining() {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
            return;
        }
        
        const cost = 5000;
        
        if (this.gameData.sod_balance < cost) {
            this.showNotification('موجودی ناکافی', `برای افزایش قدرت به ${this.formatNumber(cost)} SOD نیاز دارید.`);
            return;
        }
        
        try {
            console.log('⚡ فعال‌سازی افزایش قدرت');
            
            // کسر هزینه و فعال‌سازی
            this.gameData.sod_balance -= cost;
            this.gameData.boost_active = true;
            this.gameData.boost_end_time = Date.now() + (30 * 60 * 1000);
            
            // ذخیره
            this.saveToStorage();
            
            // ثبت تراکنش
            this.addTransaction('خرید افزایش قدرت', -cost, 'sod');
            
            // اعلان
            this.showNotification(
                '⚡ افزایش قدرت فعال شد!',
                'قدرت استخراج شما ۳ برابر شد.'
            );
            
            // تایمر پایان
            setTimeout(() => {
                if (this.gameData) {
                    this.gameData.boost_active = false;
                    this.saveToStorage();
                    this.showNotification('پایان افزایش قدرت', 'مدت زمان افزایش قدرت به پایان رسید.');
                    this.updateUI();
                }
            }, 30 * 60 * 1000);
            
            // بروزرسانی رابط کاربری
            this.updateUI();
            
        } catch (error) {
            console.error('❌ خطا در افزایش قدرت:', error);
            this.showNotification('خطا', 'مشکلی در فعال‌سازی افزایش قدرت پیش آمد');
        }
    }
    
    async toggleAutoMine() {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
            return;
        }
        
        // اگر در حال اجراست، متوقف کن
        if (this.autoMineInterval) {
            clearInterval(this.autoMineInterval);
            this.autoMineInterval = null;
            
            this.showNotification('⏸️ استخراج خودکار متوقف شد', 'سیستم استخراج خودکار غیرفعال شد.');
            this.updateAutoMineButton();
            return;
        }
        
        // بررسی حداقل موجودی
        const minBalance = 1000000;
        if (this.gameData.sod_balance < minBalance) {
            this.showNotification(
                'موجودی ناکافی',
                `برای فعال کردن استخراج خودکار حداقل ${this.formatNumber(minBalance)} SOD نیاز دارید.`
            );
            return;
        }
        
        // شروع استخراج خودکار
        console.log('🤖 شروع استخراج خودکار');
        
        this.autoMineInterval = setInterval(() => {
            if (!this.gameData) return;
            
            const baseEarned = Math.floor((this.gameData.mining_power || 10) * 0.5);
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = baseEarned * boostMultiplier;
            
            this.gameData.sod_balance += totalEarned;
            this.gameData.total_mined += totalEarned;
            this.gameData.today_earnings += totalEarned;
            this.gameData.usdt_progress += totalEarned;
            
            this.saveToStorage();
            this.updateUI();
            
        }, 1000);
        
        this.showNotification('🤖 استخراج خودکار فعال شد', 'سیستم در حال استخراج خودکار است.');
        this.updateAutoMineButton();
    }
    
    // ==================== رابط کاربری ====================
    
    updateUI() {
        if (!this.gameData) {
            console.warn('⚠️ امکان بروزرسانی رابط کاربری وجود ندارد');
            return;
        }
        
        // موجودی‌ها
        this.updateElement('sodBalance', this.formatNumber(this.gameData.sod_balance) + ' <span>SOD</span>');
        this.updateElement('usdtBalance', (this.gameData.usdt_balance || 0).toFixed(4) + ' <span>USDT</span>');
        
        // آمار
        this.updateElement('todayEarnings', this.formatNumber(this.gameData.today_earnings || 0) + ' SOD');
        this.updateElement('miningPower', (this.gameData.mining_power || 10) + 'x');
        this.updateElement('clickReward', '+' + (this.gameData.mining_power || 10) + ' SOD');
        this.updateElement('userLevel', this.gameData.user_level || 1);
        
        // پاداش USDT
        this.updateElement('availableUSDT', (this.gameData.usdt_balance || 0).toFixed(4) + ' USDT');
        
        // نوار پیشرفت
        const progressPercent = Math.min(((this.gameData.usdt_progress || 0) / 10000000) * 100, 100);
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = progressPercent + '%';
        }
        
        this.updateElement('progressText', 
            this.formatNumber(this.gameData.usdt_progress || 0) + ' / ۱۰,۰۰۰,۰۰۰ SOD (۰.۰۱ USDT)'
        );
        
        // آخرین دریافت
        this.updateLastClaimTime();
        
        // دکمه‌ها
        this.updateAutoMineButton();
        this.showAdminLink();
        
        // تراکنش‌ها
        this.renderTransactions();
    }
    
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = content;
        }
    }
    
    updateLastClaimTime() {
        const element = document.getElementById('lastClaimTime');
        if (!element) return;
        
        const lastTransaction = this.transactions.find(t => 
            t.type === 'usdt' && t.description.includes('دریافت پاداش')
        );
        
        if (lastTransaction) {
            const date = new Date(lastTransaction.created_at);
            element.textContent = date.toLocaleDateString('fa-IR') + ' - ' + 
                                 date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        } else {
            element.textContent = 'هنوز دریافت نکرده‌اید';
        }
    }
    
    updateAutoMineButton() {
        const button = document.getElementById('autoMineBtn');
        if (!button) return;
        
        if (this.autoMineInterval) {
            button.innerHTML = '<i class="fas fa-pause"></i> توقف خودکار';
            button.classList.remove('btn-primary');
            button.classList.add('btn-warning');
        } else {
            button.innerHTML = '<i class="fas fa-robot"></i> استخراج خودکار';
            button.classList.remove('btn-warning');
            button.classList.add('btn-primary');
            
            // بررسی حداقل موجودی
            if (this.gameData && this.gameData.sod_balance < 1000000) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-robot"></i> نیاز به ۱M SOD';
            } else {
                button.disabled = false;
            }
        }
    }
    
    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (!container) return;
        
        if (!this.transactions || this.transactions.length === 0) {
            container.innerHTML = `
                <div class="transaction-row">
                    <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                        <i class="fas fa-receipt" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <div>هنوز تراکنشی ثبت نشده است</div>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.transactions.map(tx => {
            const date = new Date(tx.created_at);
            const timeString = date.toLocaleTimeString('fa-IR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const dateString = date.toLocaleDateString('fa-IR');
            
            // انتخاب آیکون
            let icon = '⛏️';
            if (tx.type === 'usdt') icon = '💰';
            if (tx.description.includes('خرید')) icon = '🛒';
            if (tx.amount < 0) icon = '📤';
            if (tx.description.includes('هدیه')) icon = '🎁';
            
            // رنگ
            const color = tx.amount > 0 ? 'var(--success)' : 'var(--error)';
            const sign = tx.amount > 0 ? '+' : '';
            
            // فرمت مقدار
            let amountText;
            if (tx.type === 'usdt') {
                amountText = `${sign}${Math.abs(tx.amount).toFixed(4)} USDT`;
            } else {
                amountText = `${sign}${this.formatNumber(tx.amount)} SOD`;
            }
            
            return `
                <div class="transaction-row">
                    <div class="transaction-type">
                        <div class="transaction-icon">${icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">${tx.description}</div>
                            <div style="color: var(--text-secondary); font-size: 11px;">
                                <i class="far fa-clock"></i> ${dateString} - ${timeString}
                            </div>
                        </div>
                        <div style="font-weight: 900; color: ${color}; font-size: 14px;">
                            ${amountText}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderSalePlans() {
        const grid = document.getElementById('salePlansGrid');
        if (!grid) return;
        
        const plans = [
            {
                id: 1,
                name: "پنل استارتر",
                price: 1,
                sod: 5000000,
                bonus: 500000,
                features: [
                    "۵,۰۰۰,۰۰۰ SOD",
                    "هدیه ۵۰۰,۰۰۰ SOD اضافی",
                    "قدرت استخراج +۵٪ به مدت ۷ روز",
                    "پشتیبانی اولیه",
                    "کد تخفیف ۱۰٪ برای خرید بعدی"
                ],
                popular: false,
                discount: 0
            },
            {
                id: 2,
                name: "پنل پرو",
                price: 5,
                sod: 30000000,
                bonus: 3000000,
                features: [
                    "۳۰,۰۰۰,۰۰۰ SOD",
                    "هدیه ۳,۰۰۰,۰۰۰ SOD اضافی",
                    "قدرت استخراج +۱۵٪ به مدت ۱۴ روز",
                    "پشتیبانی ویژه",
                    "کد تخفیف ۱۵٪ برای خرید بعدی",
                    "دسترسی به استخراج خودکار"
                ],
                popular: true,
                discount: 10
            },
            {
                id: 3,
                name: "پنل پلاتینیوم",
                price: 15,
                sod: 100000000,
                bonus: 10000000,
                features: [
                    "۱۰۰,۰۰۰,۰۰۰ SOD",
                    "هدیه ۱۰,۰۰۰,۰۰۰ SOD اضافی",
                    "قدرت استخراج +۳۰٪ به مدت ۳۰ روز",
                    "پشتیبانی VIP",
                    "کد تخفیف ۲۰٪ برای خرید بعدی",
                    "دسترسی به استخراج خودکار",
                    "دریافت روزانه پاداش SOD"
                ],
                popular: false,
                discount: 15
            },
            {
                id: 4,
                name: "پنل الماس",
                price: 50,
                sod: 500000000,
                bonus: 50000000,
                features: [
                    "۵۰۰,۰۰۰,۰۰۰ SOD",
                    "هدیه ۵۰,۰۰۰,۰۰۰ SOD اضافی",
                    "قدرت استخراج +۵۰٪ به مدت ۶۰ روز",
                    "پشتیبانی اختصاصی",
                    "کد تخفیف ۳۰٪ برای خرید بعدی",
                    "دسترسی به استخراج خودکار",
                    "دریافت روزانه پاداش SOD",
                    "مشارکت در سود شبکه",
                    "دسترسی به API پیشرفته"
                ],
                popular: false,
                discount: 20
            }
        ];
        
        grid.innerHTML = plans.map(plan => {
            const totalSOD = plan.sod + plan.bonus;
            
            return `
                <div class="sale-plan-card ${plan.popular ? 'featured' : ''}">
                    ${plan.popular ? '<div class="sale-plan-badge">پیشنهاد ویژه</div>' : ''}
                    
                    <div class="sale-plan-header">
                        <h3 class="sale-plan-name">${plan.name}</h3>
                        <div class="sale-plan-price">${plan.price} <span>USDT</span></div>
                        <div class="sod-amount">${this.formatNumber(totalSOD)} SOD</div>
                    </div>
                    
                    <ul class="sale-plan-features">
                        ${plan.features.map(f => 
                            `<li><i class="fas fa-check" style="color: var(--success);"></i> ${f}</li>`
                        ).join('')}
                    </ul>
                    
                    <button class="btn ${plan.popular ? 'btn-warning' : 'btn-primary'}" 
                            onclick="window.gameInstance.buySODPlan(${plan.id})">
                        <i class="fas fa-shopping-cart"></i>
                        خرید پنل
                    </button>
                </div>
            `;
        }).join('');
    }
    
    showSODSale() {
        const section = document.getElementById('sodSaleSection');
        if (section) {
            section.style.display = 'block';
            section.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    // ==================== کنترل رابط کاربری ====================
    
    showMainPage() {
        const loginPage = document.getElementById('registerOverlay');
        const mainPage = document.getElementById('mainContainer');
        
        if (loginPage) loginPage.style.display = 'none';
        if (mainPage) mainPage.style.display = 'block';
    }
    
    showLoginPage() {
        const loginPage = document.getElementById('registerOverlay');
        const mainPage = document.getElementById('mainContainer');
        
        if (loginPage) loginPage.style.display = 'flex';
        if (mainPage) mainPage.style.display = 'none';
    }
    
    // ==================== توابع کمکی ====================
    
    createMiningEffect(amount) {
        const effect = document.createElement('div');
        effect.textContent = '+' + this.formatNumber(amount);
        effect.style.cssText = `
            position: fixed;
            color: var(--primary-light);
            font-weight: 900;
            font-size: 20px;
            pointer-events: none;
            z-index: 10000;
            text-shadow: 0 0 10px var(--primary);
            animation: miningEffect 1s ease-out forwards;
            user-select: none;
        `;
        
        const miner = document.getElementById('minerCore');
        if (miner) {
            const rect = miner.getBoundingClientRect();
            effect.style.left = (rect.left + rect.width / 2) + 'px';
            effect.style.top = (rect.top + rect.height / 2) + 'px';
        }
        
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 1000);
    }
    
    showNotification(title, message) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const titleEl = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');
        
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        
        const n = Math.abs(Number(num));
        if (n >= 1000000000) return (n / 1000000000).toFixed(2) + 'B';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return Math.floor(n).toLocaleString('fa-IR');
    }
    
    checkAdminStatus() {
        if (!this.user) return;
        
        this.isAdmin = this.user.email === 'hamyarhf@gmail.com';
    }
    
    showAdminLink() {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = this.isAdmin ? 'flex' : 'none';
        }
    }
    
    setupEventListeners() {
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
    }
    
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.user && this.gameData) {
                this.saveToStorage();
            }
        }, 30000);
    }
}

// ==================== نمونه سراسری ====================

let gameInstance = null;

// توابع عمومی برای دسترسی از HTML
window.loginUser = async function() {
    const email = document.getElementById('authEmail')?.value;
    const password = document.getElementById('authPassword')?.value;
    
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

window.showSODSale = function() {
    if (gameInstance) {
        gameInstance.showSODSale();
    }
};

window.boostMining = function() {
    if (gameInstance) {
        gameInstance.boostMining();
    }
};

// راه‌اندازی بازی
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 DOM بارگذاری شد - شروع SODmAX Pro...');
    
    try {
        gameInstance = new SODmaxGame();
        await gameInstance.init();
        
        console.log('🚀 SODmAX Pro آماده است!');
        
    } catch (error) {
        console.error('❌ خطای شدید:', error);
    }
});

console.log('✅ app-core.js با موفقیت بارگذاری شد');
