// ==================== app-core.js ====================
// هسته اصلی بازی SODmAX Pro

console.log('🎮 بارگذاری هسته بازی SODmAX Pro...');

// جلوگیری از تعریف تکراری کلاس
if (!window.SODmaxGame) {
    class SODmaxGame {
        constructor() {
            this.user = null;
            this.gameData = null;
            this.userInfo = null;
            this.transactions = [];
            this.isAdmin = false;
            this.autoMineInterval = null;
            this.autoSaveInterval = null;
            
            console.log('✅ نمونه بازی ایجاد شد');
        }
        
        // ==================== راه‌اندازی ====================
        
        async init() {
            console.log('🚀 راه‌اندازی بازی...');
            
            try {
                // 1. بررسی session کاربر
                const hasUser = await this.checkAuthSession();
                
                if (hasUser) {
                    console.log('✅ کاربر پیدا شد:', this.user.email);
                    this.showMainPage();
                    this.updateUI();
                } else {
                    console.log('⚠️ کاربر پیدا نشد');
                    this.showLoginPage();
                }
                
                // 2. تنظیم رویدادها
                this.setupEventListeners();
                
                // 3. نمایش پنل‌های فروش
                this.renderSalePlans();
                
                console.log('✅ بازی راه‌اندازی شد');
                
            } catch (error) {
                console.error('❌ خطا در راه‌اندازی:', error);
                this.showLoginPage();
            }
        }
        
        async checkAuthSession() {
            try {
                // بررسی Supabase Auth
                if (window.supabaseClient) {
                    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
                    
                    if (error) {
                        console.error('خطا در دریافت session:', error);
                        return false;
                    }
                    
                    if (session) {
                        console.log('✅ Supabase session پیدا شد');
                        this.user = session.user;
                        await this.loadUserData();
                        return true;
                    }
                }
                
                // بررسی localStorage
                const savedUser = localStorage.getItem('sodmax_user');
                if (savedUser) {
                    console.log('✅ کاربر از localStorage پیدا شد');
                    this.user = JSON.parse(savedUser);
                    this.gameData = JSON.parse(localStorage.getItem('sodmax_game') || '{}');
                    this.userInfo = JSON.parse(localStorage.getItem('sodmax_userinfo') || '{}');
                    this.transactions = JSON.parse(localStorage.getItem('sodmax_transactions') || '[]');
                    this.checkAdminStatus();
                    return true;
                }
                
                return false;
                
            } catch (error) {
                console.error('❌ خطا در بررسی session:', error);
                return false;
            }
        }
        
        async loadUserData() {
            if (!this.user) return;
            
            console.log('📊 بارگذاری اطلاعات کاربر:', this.user.email);
            
            try {
                // بارگذاری از دیتابیس
                if (window.GameDB && this.user.id) {
                    const userResult = await window.GameDB.getOrCreateUser(this.user.id, this.user.email);
                    const gameResult = await window.GameDB.getOrCreateGameData(this.user.id);
                    
                    if (!userResult.error) this.userInfo = userResult.data;
                    if (!gameResult.error) this.gameData = gameResult.data;
                    
                    // بارگذاری تراکنش‌ها
                    const txResult = await window.GameDB.getTransactions(this.user.id, 10);
                    if (!txResult.error) this.transactions = txResult.data || [];
                }
                
                // اگر از دیتابیس بارگذاری نشد، از localStorage استفاده کن
                if (!this.gameData) {
                    const savedGame = localStorage.getItem('sodmax_game');
                    if (savedGame) this.gameData = JSON.parse(savedGame);
                }
                
                if (!this.userInfo) {
                    const savedInfo = localStorage.getItem('sodmax_userinfo');
                    if (savedInfo) this.userInfo = JSON.parse(savedInfo);
                }
                
                // اگر هنوز داده‌ای نداریم، ایجاد کن
                if (!this.gameData) {
                    this.gameData = {
                        sod_balance: 1000000,
                        usdt_balance: 0,
                        today_earnings: 0,
                        mining_power: 10,
                        user_level: 1,
                        usdt_progress: 0,
                        total_mined: 1000000,
                        boost_active: false,
                        boost_end_time: 0
                    };
                }
                
                // بررسی ادمین
                this.checkAdminStatus();
                
                console.log('✅ اطلاعات کاربر بارگذاری شد');
                
            } catch (error) {
                console.error('❌ خطا در بارگذاری اطلاعات:', error);
            }
        }
        
        // ==================== مدیریت کاربران ====================
        
        async login(email, password) {
            console.log(`🔑 ورود: ${email}`);
            
            if (!email || !password) {
                this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
                return false;
            }
            
            try {
                // 1. ابتدا از Supabase لاگین کن
                if (window.supabaseClient) {
                    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (error) {
                        console.error('خطا در ورود Supabase:', error);
                        // ادامه به حالت آفلاین
                    } else if (data.user) {
                        this.user = data.user;
                        await this.loadUserData();
                        this.showMainPage();
                        this.updateUI();
                        
                        this.showNotification('خوش آمدید', `سلام ${this.userInfo?.full_name || email.split('@')[0]}!`);
                        return true;
                    }
                }
                
                // 2. حالت آفلاین (برای تست)
                console.log('⚠️ استفاده از حالت آفلاین');
                
                this.user = {
                    id: 'offline-' + Date.now(),
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
                    boost_end_time: 0
                };
                
                this.userInfo = {
                    full_name: email.split('@')[0],
                    email: email,
                    register_date: new Date().toLocaleDateString('fa-IR'),
                    is_admin: email.toLowerCase() === 'hamyarhf@gmail.com'
                };
                
                this.transactions = [{
                    description: 'هدیه ورود',
                    amount: 1000000,
                    type: 'sod',
                    created_at: new Date().toISOString()
                }];
                
                // ذخیره در localStorage
                this.saveToLocalStorage();
                
                // نمایش صفحه اصلی
                this.showMainPage();
                this.updateUI();
                this.checkAdminStatus();
                
                this.showNotification('خوش آمدید (آفلاین)', `سلام ${email.split('@')[0]}!`);
                return true;
                
            } catch (error) {
                console.error('❌ خطا در ورود:', error);
                this.showNotification('خطا', 'مشکلی در ورود پیش آمد');
                return false;
            }
        }
        
        async register(email, password, fullName) {
            console.log(`📝 ثبت‌نام: ${email}`);
            
            if (!email || !password) {
                this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
                return false;
            }
            
            try {
                // 1. ثبت‌نام در Supabase
                if (window.supabaseClient) {
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
                        console.error('خطا در ثبت‌نام:', error);
                        this.showNotification('خطا در ثبت‌نام', error.message);
                        return false;
                    }
                    
                    if (data.user) {
                        this.user = data.user;
                        this.showNotification('ثبت‌نام موفق', 'حساب شما ایجاد شد!');
                        return true;
                    }
                }
                
                // 2. حالت آفلاین
                console.log('⚠️ ثبت‌نام آفلاین');
                
                this.user = {
                    id: 'new-offline-' + Date.now(),
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
                    boost_end_time: 0
                };
                
                this.userInfo = {
                    full_name: fullName || email.split('@')[0],
                    email: email,
                    register_date: new Date().toLocaleDateString('fa-IR'),
                    is_admin: false
                };
                
                this.transactions = [{
                    description: 'هدیه ثبت نام',
                    amount: 1000000,
                    type: 'sod',
                    created_at: new Date().toISOString()
                }];
                
                this.saveToLocalStorage();
                this.showMainPage();
                this.updateUI();
                
                this.showNotification('ثبت‌نام موفق (آفلاین)', 'حساب شما ایجاد شد!');
                return true;
                
            } catch (error) {
                console.error('❌ خطا در ثبت‌نام:', error);
                this.showNotification('خطا', 'مشکلی در ثبت‌نام پیش آمد');
                return false;
            }
        }
        
        async logout() {
            console.log('🚪 خروج...');
            
            // توقف عملیات خودکار
            if (this.autoMineInterval) {
                clearInterval(this.autoMineInterval);
                this.autoMineInterval = null;
            }
            
            // خروج از Supabase
            if (window.supabaseClient) {
                try {
                    await window.supabaseClient.auth.signOut();
                } catch (error) {
                    console.error('خطا در خروج:', error);
                }
            }
            
            // نمایش صفحه ورود
            this.showLoginPage();
            this.showNotification('خروج', 'با موفقیت خارج شدید.');
        }
        
        saveToLocalStorage() {
            try {
                if (this.user) localStorage.setItem('sodmax_user', JSON.stringify(this.user));
                if (this.gameData) localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                if (this.userInfo) localStorage.setItem('sodmax_userinfo', JSON.stringify(this.userInfo));
                if (this.transactions) localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
            } catch (error) {
                console.error('❌ خطا در ذخیره:', error);
            }
        }
        
        // ==================== منطق بازی ====================
        
        async mine() {
            if (!this.user || !this.gameData) {
                console.error('❌ امکان استخراج نیست');
                this.showNotification('خطا', 'لطفاً ابتدا وارد شوید');
                return;
            }
            
            try {
                const baseEarned = this.gameData.mining_power || 10;
                const boostMultiplier = this.gameData.boost_active ? 3 : 1;
                const totalEarned = baseEarned * boostMultiplier;
                
                console.log(`⛏️ استخراج: ${totalEarned} SOD`);
                
                // بروزرسانی محلی
                this.gameData.sod_balance += totalEarned;
                this.gameData.total_mined += totalEarned;
                this.gameData.today_earnings += totalEarned;
                this.gameData.usdt_progress += totalEarned;
                
                // ذخیره در دیتابیس
                if (window.GameDB && this.user.id) {
                    await window.GameDB.updateGameData(this.user.id, {
                        sod_balance: this.gameData.sod_balance,
                        total_mined: this.gameData.total_mined,
                        today_earnings: this.gameData.today_earnings,
                        usdt_progress: this.gameData.usdt_progress
                    });
                    
                    await window.GameDB.addTransaction(
                        this.user.id,
                        'استخراج دستی',
                        totalEarned,
                        'sod'
                    );
                }
                
                // ذخیره محلی
                this.saveToLocalStorage();
                
                // ثبت تراکنش محلی
                this.addLocalTransaction('استخراج دستی', totalEarned, 'sod');
                
                // افکت‌ها
                this.createMiningEffect(totalEarned);
                
                const minerCore = document.getElementById('minerCore');
                if (minerCore) {
                    minerCore.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        minerCore.style.transform = 'scale(1)';
                    }, 150);
                }
                
                // بروزرسانی UI
                this.updateUI();
                
                // بررسی پاداش USDT
                await this.checkUSDT();
                
            } catch (error) {
                console.error('❌ خطا در استخراج:', error);
                this.showNotification('خطا', 'مشکلی در استخراج پیش آمد');
            }
        }
        
        async checkUSDT() {
            if (!this.gameData || (this.gameData.usdt_progress || 0) < 10000000) {
                return;
            }
            
            try {
                const usdtEarned = 0.01;
                const cycles = Math.floor((this.gameData.usdt_progress || 0) / 10000000);
                const totalUSDT = usdtEarned * cycles;
                
                console.log(`💰 پاداش USDT: ${totalUSDT.toFixed(4)} USDT`);
                
                // بروزرسانی
                this.gameData.usdt_balance += totalUSDT;
                this.gameData.usdt_progress %= 10000000;
                
                // ذخیره در دیتابیس
                if (window.GameDB && this.user.id) {
                    await window.GameDB.updateGameData(this.user.id, {
                        usdt_balance: this.gameData.usdt_balance,
                        usdt_progress: this.gameData.usdt_progress
                    });
                    
                    await window.GameDB.addTransaction(
                        this.user.id,
                        'دریافت پاداش USDT',
                        totalUSDT,
                        'usdt'
                    );
                }
                
                // ذخیره محلی
                this.saveToLocalStorage();
                
                // ثبت تراکنش محلی
                this.addLocalTransaction('دریافت پاداش USDT', totalUSDT, 'usdt');
                
                // اعلان
                this.showNotification('🎉 پاداش USDT', `${totalUSDT.toFixed(4)} USDT دریافت کردید!`);
                
                // شانس ارتقاء سطح
                if (Math.random() < 0.15) {
                    this.gameData.user_level += 1;
                    this.gameData.mining_power = 10 * this.gameData.user_level;
                    
                    if (window.GameDB && this.user.id) {
                        await window.GameDB.updateGameData(this.user.id, {
                            user_level: this.gameData.user_level,
                            mining_power: this.gameData.mining_power
                        });
                    }
                    
                    this.saveToLocalStorage();
                    this.showNotification('⭐ ارتقاء سطح', `سطح شما به ${this.gameData.user_level} ارتقاء یافت!`);
                }
                
                this.updateUI();
                
            } catch (error) {
                console.error('❌ خطا در بررسی USDT:', error);
            }
        }
        
        addLocalTransaction(description, amount, type) {
            const transaction = {
                description,
                amount,
                type,
                created_at: new Date().toISOString()
            };
            
            this.transactions.unshift(transaction);
            
            // محدود کردن تعداد
            if (this.transactions.length > 20) {
                this.transactions = this.transactions.slice(0, 20);
            }
            
            localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
            this.renderTransactions();
        }
        
        async buySODPlan(planId) {
            if (!this.user || !this.gameData) {
                this.showNotification('خطا', 'لطفاً ابتدا وارد شوید');
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
                this.showNotification('خطا', 'پنل معتبر نیست');
                return;
            }
            
            const totalSOD = plan.sod + plan.bonus;
            
            const confirmMsg = `آیا مطمئن هستید که می‌خواهید پنل "${plan.name}" را خریداری کنید؟\n\n` +
                              `💰 دریافت: ${this.formatNumber(totalSOD)} SOD\n` +
                              `🎁 شامل: ${this.formatNumber(plan.sod)} SOD اصلی + ${this.formatNumber(plan.bonus)} SOD هدیه`;
            
            if (!confirm(confirmMsg)) return;
            
            try {
                console.log(`🛒 خرید پنل ${plan.name}: ${totalSOD} SOD`);
                
                // بروزرسانی
                this.gameData.sod_balance += totalSOD;
                this.gameData.total_mined += totalSOD;
                
                // ذخیره در دیتابیس
                if (window.GameDB && this.user.id) {
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
                }
                
                // ذخیره محلی
                this.saveToLocalStorage();
                
                // ثبت تراکنش محلی
                this.addLocalTransaction(`خرید پنل ${plan.name}`, totalSOD, 'sod');
                
                this.showNotification('🎉 خرید موفق', `${this.formatNumber(totalSOD)} SOD خریداری شد!`);
                this.updateUI();
                
            } catch (error) {
                console.error('❌ خطا در خرید:', error);
                this.showNotification('خطا', 'مشکلی در خرید پیش آمد');
            }
        }
        
        async claimUSDT() {
            if (!this.user || !this.gameData) {
                this.showNotification('خطا', 'لطفاً ابتدا وارد شوید');
                return;
            }
            
            if (!this.gameData.usdt_balance || this.gameData.usdt_balance <= 0) {
                this.showNotification('اطلاع', 'هنوز USDT پاداش دریافت نکرده‌اید.');
                return;
            }
            
            const usdtToClaim = this.gameData.usdt_balance;
            const sodNeeded = Math.floor(usdtToClaim * 1000000000);
            
            if (this.gameData.sod_balance < sodNeeded) {
                this.showNotification('⚠️ موجودی ناکافی', 
                    `برای دریافت ${usdtToClaim.toFixed(4)} USDT به ${this.formatNumber(sodNeeded)} SOD نیاز دارید.`);
                return;
            }
            
            if (!confirm(`آیا مایل به دریافت ${usdtToClaim.toFixed(4)} USDT هستید؟\n\n${this.formatNumber(sodNeeded)} SOD کسر خواهد شد.`)) {
                return;
            }
            
            try {
                this.gameData.usdt_balance = 0;
                this.gameData.sod_balance -= sodNeeded;
                
                // ذخیره در دیتابیس
                if (window.GameDB && this.user.id) {
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
                }
                
                // ذخیره محلی
                this.saveToLocalStorage();
                
                // ثبت تراکنش‌های محلی
                this.addLocalTransaction('دریافت پاداش USDT', -usdtToClaim, 'usdt');
                this.addLocalTransaction('تبدیل SOD به USDT', -sodNeeded, 'sod');
                
                this.showNotification('✅ پاداش دریافت شد', `${usdtToClaim.toFixed(4)} USDT دریافت کردید.`);
                this.updateUI();
                
            } catch (error) {
                console.error('❌ خطا در دریافت پاداش:', error);
                this.showNotification('خطا', 'مشکلی در دریافت پاداش پیش آمد');
            }
        }
        
        boostMining() {
            if (!this.user || !this.gameData) {
                this.showNotification('خطا', 'لطفاً ابتدا وارد شوید');
                return;
            }
            
            const cost = 5000;
            
            if (this.gameData.sod_balance < cost) {
                this.showNotification('⚠️ موجودی کافی نیست', 'برای افزایش قدرت به ۵۰۰۰ SOD نیاز دارید.');
                return;
            }
            
            this.gameData.sod_balance -= cost;
            this.gameData.boost_active = true;
            this.gameData.boost_end_time = Date.now() + (30 * 60 * 1000);
            
            // ذخیره در دیتابیس
            if (window.GameDB && this.user.id) {
                window.GameDB.updateGameData(this.user.id, {
                    sod_balance: this.gameData.sod_balance,
                    boost_active: true,
                    boost_end_time: this.gameData.boost_end_time
                });
                
                window.GameDB.addTransaction(
                    this.user.id,
                    'خرید افزایش قدرت',
                    -cost,
                    'sod'
                );
            }
            
            // ذخیره محلی
            this.saveToLocalStorage();
            
            // ثبت تراکنش محلی
            this.addLocalTransaction('خرید افزایش قدرت', -cost, 'sod');
            
            this.showNotification('⚡ افزایش قدرت', 'قدرت استخراج شما ۳ برابر شد! (۳۰ دقیقه)');
            
            // تایمر پایان بوست
            setTimeout(() => {
                if (this.gameData) {
                    this.gameData.boost_active = false;
                    
                    if (window.GameDB && this.user.id) {
                        window.GameDB.updateGameData(this.user.id, {
                            boost_active: false
                        });
                    }
                    
                    this.saveToLocalStorage();
                    this.showNotification('پایان بوست', 'زمان افزایش قدرت به پایان رسید.');
                    this.updateUI();
                }
            }, 30 * 60 * 1000);
            
            this.updateUI();
        }
        
        async toggleAutoMine() {
            if (!this.user || !this.gameData) {
                this.showNotification('خطا', 'لطفاً ابتدا وارد شوید');
                return;
            }
            
            if (this.autoMineInterval) {
                clearInterval(this.autoMineInterval);
                this.autoMineInterval = null;
                this.showNotification('⏸️ توقف خودکار', 'استخراج خودکار متوقف شد.');
                this.updateAutoMineButton();
                return;
            }
            
            if (this.gameData.sod_balance < 1000000) {
                this.showNotification('⚠️ موجودی ناکافی', 'برای استخراج خودکار حداقل ۱ میلیون SOD نیاز دارید.');
                return;
            }
            
            this.autoMineInterval = setInterval(async () => {
                if (!this.gameData) return;
                
                const earned = Math.floor((this.gameData.mining_power || 10) * 0.5);
                const boostMultiplier = this.gameData.boost_active ? 3 : 1;
                const totalEarned = earned * boostMultiplier;
                
                this.gameData.sod_balance += totalEarned;
                this.gameData.total_mined += totalEarned;
                this.gameData.today_earnings += totalEarned;
                this.gameData.usdt_progress += totalEarned;
                
                this.saveToLocalStorage();
                this.updateUI();
                await this.checkUSDT();
                
            }, 1000);
            
            this.showNotification('🤖 استخراج خودکار', 'سیستم استخراج خودکار فعال شد.');
            this.updateAutoMineButton();
        }
        
        // ==================== UI FUNCTIONS ====================
        
        updateUI() {
            if (!this.gameData) return;
            
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
            
            // دکمه استخراج خودکار
            this.updateAutoMineButton();
            
            // لینک ادمین
            this.showAdminLink();
            
            // تراکنش‌ها
