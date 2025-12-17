// ==================== app-core.js ====================
// فایل کامل SODmAX Pro - نسخه اصلاح شده
// تاریخ: ۱۴۰۳/۱۰/۰۵

console.log('🎮 Loading SODmAX Pro game engine...');

class SODmaxGame {
    constructor() {
        this.user = null;
        this.gameData = null;
        this.userInfo = null;
        this.transactions = [];
        this.isAdmin = false;
        this.autoMineInterval = null;
        this.autoSaveInterval = null;
        this.supabaseClient = null;
        this.isInitialized = false;
        
        console.log('✅ Game instance created');
        
        // توابع دیباگ عمومی
        window.debugGame = () => this.debugGame();
        window.resetGame = () => this.resetGame();
        window.quickLogin = (email, password) => this.quickLogin(email, password);
    }
    
    // ==================== SYSTEM INITIALIZATION ====================
    
    async init() {
        console.log('🚀 Initializing SODmAX Pro...');
        
        try {
            // 1. نمایش وضعیت اولیه
            this.showLoadingMessage('در حال راه‌اندازی سیستم...');
            
            // 2. بررسی و تنظیم Supabase
            await this.setupDatabase();
            
            // 3. بررسی وضعیت کاربر
            const hasUser = await this.loadUserSession();
            
            // 4. نمایش صفحه مناسب
            if (hasUser) {
                console.log('✅ کاربر وارد شده است - نمایش صفحه اصلی');
                this.showMainPage();
                this.updateUI();
                this.showNotification('خوش آمدید', `سلام ${this.userInfo?.full_name || this.user?.email}!`);
            } else {
                console.log('⚠️ کاربر وارد نشده - نمایش صفحه ورود');
                this.showLoginPage();
                this.addTestButtons();
            }
            
            // 5. تنظیم رویدادها
            this.setupEventListeners();
            
            // 6. رندر پنل‌ها
            this.renderSalePlans();
            
            // 7. شروع ذخیره خودکار
            this.startAutoSave();
            
            // 8. علامت‌گذاری به عنوان راه‌اندازی شده
            this.isInitialized = true;
            
            console.log('✅ Game initialized successfully');
            this.hideLoadingMessage();
            
        } catch (error) {
            console.error('❌ Error initializing game:', error);
            this.showLoginPage();
            this.addEmergencyButtons();
        }
    }
    
    async setupDatabase() {
        try {
            // بررسی وجود Supabase
            if (typeof supabase !== 'undefined') {
                const supabaseUrl = localStorage.getItem('supabase_url') || 'https://your-project.supabase.co';
                const supabaseKey = localStorage.getItem('supabase_key') || 'your-anon-key';
                
                this.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                window.supabaseClient = this.supabaseClient;
                console.log('✅ Supabase client created');
                return true;
            }
            
            console.log('⚠️ Supabase not available, using localStorage');
            return false;
            
        } catch (error) {
            console.error('❌ Error setting up database:', error);
            return false;
        }
    }
    
    async loadUserSession() {
        console.log('🔍 Checking user session...');
        
        try {
            // اول از localStorage چک کن
            const localStorageUser = this.loadFromLocalStorage();
            if (localStorageUser) {
                return true;
            }
            
            // اگر Supabase داریم، از session آن چک کن
            if (this.supabaseClient) {
                const { data: { session } } = await this.supabaseClient.auth.getSession();
                if (session?.user) {
                    this.user = session.user;
                    await this.createUserData();
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error loading user session:', error);
            return false;
        }
    }
    
    loadFromLocalStorage() {
        try {
            const userData = localStorage.getItem('sodmax_user');
            const gameData = localStorage.getItem('sodmax_game');
            
            if (!userData || !gameData) {
                console.log('ℹ️ No user data in localStorage');
                return false;
            }
            
            this.user = JSON.parse(userData);
            this.gameData = JSON.parse(gameData);
            this.userInfo = JSON.parse(localStorage.getItem('sodmax_userinfo') || '{}');
            this.transactions = JSON.parse(localStorage.getItem('sodmax_transactions') || '[]');
            
            // چک ادمین
            this.checkAdminStatus();
            
            console.log('✅ User loaded from localStorage:', this.user?.email);
            return true;
            
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            return false;
        }
    }
    
    async createUserData() {
        if (!this.user) return;
        
        // ایجاد داده‌های اولیه
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
            full_name: this.user.email.split('@')[0],
            email: this.user.email,
            register_date: new Date().toLocaleDateString('fa-IR'),
            is_admin: false
        };
        
        this.transactions = [{
            description: 'هدیه ثبت نام',
            amount: 1000000,
            type: 'sod',
            created_at: new Date().toISOString()
        }];
        
        // ذخیره در localStorage
        this.saveToLocalStorage();
        
        console.log('✅ New user data created');
    }
    
    saveToLocalStorage() {
        try {
            if (this.user) localStorage.setItem('sodmax_user', JSON.stringify(this.user));
            if (this.gameData) localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
            if (this.userInfo) localStorage.setItem('sodmax_userinfo', JSON.stringify(this.userInfo));
            if (this.transactions) localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
            
            console.log('💾 Data saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    }
    
    // ==================== USER MANAGEMENT ====================
    
    async login(email, password) {
        console.log(`🔑 Attempting login for: ${email}`);
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        // لیست کاربران تست
        const testUsers = {
            'test@example.com': { 
                password: '123456', 
                full_name: 'کاربر تست',
                sod_balance: 1000000 
            },
            'hamyarhf@gmail.com': { 
                password: 'admin123', 
                full_name: 'مدیر سیستم',
                sod_balance: 5000000,
                is_admin: true 
            },
            'user@example.com': { 
                password: '123456', 
                full_name: 'کاربر نمونه',
                sod_balance: 500000 
            }
        };
        
        try {
            // بررسی کاربر تست
            if (testUsers[email] && testUsers[email].password === password) {
                console.log('✅ Test user login successful');
                
                // ایجاد کاربر
                this.user = {
                    id: 'test-' + Date.now(),
                    email: email,
                    user_metadata: { full_name: testUsers[email].full_name }
                };
                
                // ایجاد داده بازی
                this.gameData = {
                    sod_balance: testUsers[email].sod_balance,
                    usdt_balance: 0,
                    today_earnings: 0,
                    mining_power: 10,
                    user_level: 1,
                    usdt_progress: 0,
                    total_mined: testUsers[email].sod_balance,
                    boost_active: false,
                    boost_end_time: 0
                };
                
                this.userInfo = {
                    full_name: testUsers[email].full_name,
                    email: email,
                    register_date: new Date().toLocaleDateString('fa-IR'),
                    is_admin: testUsers[email].is_admin || false
                };
                
                this.transactions = [{
                    description: 'هدیه ورود',
                    amount: testUsers[email].sod_balance,
                    type: 'sod',
                    created_at: new Date().toISOString()
                }];
                
                // ذخیره
                this.saveToLocalStorage();
                
                // بروزرسانی UI
                this.showMainPage();
                this.updateUI();
                this.checkAdminStatus();
                
                this.showNotification('خوش آمدید', `سلام ${testUsers[email].full_name}!`);
                
                return true;
            }
            
            // اگر کاربر تست نیست و Supabase داریم
            if (this.supabaseClient) {
                const { data, error } = await this.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    this.showNotification('خطا در ورود', 'ایمیل یا رمز عبور اشتباه است');
                    return false;
                }
                
                this.user = data.user;
                await this.createUserData();
                this.showMainPage();
                this.updateUI();
                
                this.showNotification('خوش آمدید', 'با موفقیت وارد شدید!');
                
                return true;
            }
            
            // اگر نه تست هست و نه Supabase
            this.showNotification('خطا', 'سیستم ورود در دسترس نیست');
            return false;
            
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showNotification('خطا', 'مشکلی در ورود پیش آمد');
            return false;
        }
    }
    
    async register(email, password, fullName) {
        console.log(`📝 Attempting registration for: ${email}`);
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        try {
            // ایجاد کاربر محلی
            this.user = {
                id: 'user-' + Date.now(),
                email: email,
                user_metadata: { full_name: fullName || email.split('@')[0] }
            };
            
            // ایجاد داده بازی
            this.gameData = {
                sod_balance: 1000000,
                usdt_balance: 0,
                today_earnings: 0,
                mining_power: 10,
                user_level: 1,
                usdt_progress: 1000000,
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
            
            // ذخیره
            this.saveToLocalStorage();
            
            // نمایش صفحه اصلی
            this.showMainPage();
            this.updateUI();
            
            this.showNotification('ثبت‌نام موفق', 'حساب شما با موفقیت ایجاد شد!');
            
            // اگر Supabase داریم، ثبت‌نام در آن
            if (this.supabaseClient) {
                await this.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: { full_name: fullName || email.split('@')[0] }
                    }
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            this.showNotification('خطا', 'مشکلی در ثبت‌نام پیش آمد');
            return false;
        }
    }
    
    async logout() {
        console.log('🚪 Logging out...');
        
        try {
            // خروج از Supabase اگر موجود باشد
            if (this.supabaseClient) {
                await this.supabaseClient.auth.signOut();
            }
            
            // توقف intervalها
            if (this.autoMineInterval) {
                clearInterval(this.autoMineInterval);
                this.autoMineInterval = null;
            }
            
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
            
            // نمایش صفحه ورود
            this.showLoginPage();
            this.addTestButtons();
            
            this.showNotification('خروج', 'با موفقیت از حساب خود خارج شدید.');
            
            console.log('✅ Logout successful');
            
        } catch (error) {
            console.error('❌ Logout error:', error);
        }
    }
    
    quickLogin(email, password) {
        console.log(`⚡ Quick login: ${email}`);
        return this.login(email, password);
    }
    
    // ==================== GAME LOGIC ====================
    
    async mine() {
        // بررسی اولیه
        if (!this.isInitialized) {
            console.log('🔄 Game not initialized, initializing now...');
            await this.init();
        }
        
        if (!this.user || !this.gameData) {
            console.error('❌ Cannot mine: user or game data not loaded');
            console.log('🔄 Attempting to load user data...');
            
            await this.loadUserSession();
            
            if (!this.user || !this.gameData) {
                this.showNotification(
                    'خطای سیستم', 
                    'لطفاً ابتدا وارد حساب خود شوید.\n\n' +
                    'راه‌حل: روی دکمه "ورود با کاربر تست" کلیک کنید.'
                );
                this.showLoginPage();
                return;
            }
        }
        
        console.log('⛏️ Starting mining process...');
        
        try {
            // محاسبه درآمد
            const baseEarned = this.gameData.mining_power || 10;
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = baseEarned * boostMultiplier;
            
            console.log(`💰 Earning: ${baseEarned} × ${boostMultiplier} = ${totalEarned} SOD`);
            
            // آپدیت داده‌ها
            this.gameData.sod_balance += totalEarned;
            this.gameData.total_mined += totalEarned;
            this.gameData.today_earnings += totalEarned;
            this.gameData.usdt_progress += totalEarned;
            
            // ثبت تراکنش
            this.addTransaction('استخراج دستی', totalEarned, 'sod');
            
            // ذخیره
            this.saveToLocalStorage();
            
            // افکت بصری
            this.createMiningEffect(totalEarned);
            
            // افکت کلیک
            const minerCore = document.getElementById('minerCore');
            if (minerCore) {
                minerCore.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    minerCore.style.transform = 'scale(1)';
                }, 150);
            }
            
            // آپدیت UI
            this.updateUI();
            
            // چک پاداش USDT
            await this.checkUSDT();
            
            console.log('✅ Mining successful');
            
        } catch (error) {
            console.error('❌ Mining error:', error);
            this.showNotification('خطا', 'مشکلی در استخراج پیش آمد');
        }
    }
    
    async checkUSDT() {
        if (!this.gameData || !this.gameData.usdt_progress || this.gameData.usdt_progress < 10000000) {
            return;
        }
        
        try {
            const usdtEarned = 0.01;
            const cycles = Math.floor(this.gameData.usdt_progress / 10000000);
            const totalUSDT = usdtEarned * cycles;
            
            console.log(`🎁 USDT reward: ${cycles} cycles = ${totalUSDT} USDT`);
            
            // آپدیت موجودی
            this.gameData.usdt_balance += totalUSDT;
            this.gameData.usdt_progress %= 10000000;
            
            // ثبت تراکنش
            this.addTransaction('دریافت پاداش USDT', totalUSDT, 'usdt');
            
            // ذخیره
            this.saveToLocalStorage();
            
            // نوتیفیکیشن
            this.showNotification(
                '🎉 پاداش USDT دریافت شد!', 
                `${totalUSDT.toFixed(4)} USDT به موجودی شما اضافه شد.`
            );
            
            // شانس ارتقاء سطح
            if (Math.random() < 0.15) {
                this.gameData.user_level += 1;
                this.gameData.mining_power = 10 * this.gameData.user_level;
                
                this.saveToLocalStorage();
                
                this.showNotification(
                    '⭐ ارتقاء سطح!', 
                    `سطح شما به ${this.gameData.user_level} ارتقاء یافت!\nقدرت استخراج: ${this.gameData.mining_power}x`
                );
            }
            
            // آپدیت UI
            this.updateUI();
            
        } catch (error) {
            console.error('❌ USDT check error:', error);
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
        
        // محدود کردن به 15 تراکنش
        if (this.transactions.length > 15) {
            this.transactions = this.transactions.slice(0, 15);
        }
        
        // ذخیره
        localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
        
        // آپدیت UI
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
                name: 'استارتر',
                features: ['۵,۰۰۰,۰۰۰ SOD', 'هدیه ۵۰۰,۰۰۰ SOD', '+۵٪ قدرت استخراج']
            },
            2: { 
                price: 5, 
                sod: 30000000, 
                bonus: 3000000, 
                name: 'پرو',
                features: ['۳۰,۰۰۰,۰۰۰ SOD', 'هدیه ۳,۰۰۰,۰۰۰ SOD', '+۱۵٪ قدرت استخراج']
            },
            3: { 
                price: 15, 
                sod: 100000000, 
                bonus: 10000000, 
                name: 'پلاتینیوم',
                features: ['۱۰۰,۰۰۰,۰۰۰ SOD', 'هدیه ۱۰,۰۰۰,۰۰۰ SOD', '+۳۰٪ قدرت استخراج']
            },
            4: { 
                price: 50, 
                sod: 500000000, 
                bonus: 50000000, 
                name: 'الماس',
                features: ['۵۰۰,۰۰۰,۰۰۰ SOD', 'هدیه ۵۰,۰۰۰,۰۰۰ SOD', '+۵۰٪ قدرت استخراج']
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
                              `💰 مبلغ: ${plan.price} USDT\n` +
                              `🎁 دریافت: ${this.formatNumber(totalSOD)} SOD\n` +
                              `📊 شامل: ${this.formatNumber(plan.sod)} SOD اصلی + ${this.formatNumber(plan.bonus)} SOD هدیه`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            // در نسخه واقعی اینجا پرداخت انجام می‌شود
            // فعلاً فقط اضافه می‌کنیم
            
            console.log(`🛒 Buying ${plan.name} plan: ${totalSOD} SOD`);
            
            this.gameData.sod_balance += totalSOD;
            this.gameData.total_mined += totalSOD;
            
            // ذخیره
            this.saveToLocalStorage();
            
            // ثبت تراکنش
            this.addTransaction(`خرید پنل ${plan.name}`, totalSOD, 'sod');
            
            // نوتیفیکیشن
            this.showNotification(
                '🎉 خرید موفق!', 
                `${this.formatNumber(totalSOD)} SOD به موجودی شما اضافه شد.\n` +
                `(اصلی: ${this.formatNumber(plan.sod)} + هدیه: ${this.formatNumber(plan.bonus)})`
            );
            
            // آپدیت UI
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Purchase error:', error);
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
        const sodNeeded = Math.floor(usdtToClaim * 1000000000); // 1B SOD per USDT
        
        // بررسی موجودی SOD
        if (this.gameData.sod_balance < sodNeeded) {
            this.showNotification(
                'موجودی ناکافی', 
                `برای دریافت ${usdtToClaim.toFixed(4)} USDT به ${this.formatNumber(sodNeeded)} SOD نیاز دارید.\n` +
                `موجودی فعلی شما: ${this.formatNumber(this.gameData.sod_balance)} SOD`
            );
            return;
        }
        
        // تایید دریافت
        const confirmMessage = `آیا مایل به دریافت ${usdtToClaim.toFixed(4)} USDT هستید؟\n\n` +
                              `⚠️ ${this.formatNumber(sodNeeded)} SOD از موجودی شما کسر خواهد شد.\n` +
                              `✅ دریافت: ${usdtToClaim.toFixed(4)} USDT`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            console.log(`💸 Claiming ${usdtToClaim} USDT, costing ${sodNeeded} SOD`);
            
            // آپدیت موجودی‌ها
            this.gameData.usdt_balance = 0;
            this.gameData.sod_balance -= sodNeeded;
            
            // ذخیره
            this.saveToLocalStorage();
            
            // ثبت تراکنش‌ها
            this.addTransaction('دریافت پاداش USDT', -usdtToClaim, 'usdt');
            this.addTransaction('تبدیل SOD به USDT', -sodNeeded, 'sod');
            
            // نوتیفیکیشن
            this.showNotification(
                '✅ پاداش دریافت شد!', 
                `${usdtToClaim.toFixed(4)} USDT دریافت کردید.\n` +
                `${this.formatNumber(sodNeeded)} SOD از موجودی کسر شد.`
            );
            
            // آپدیت UI
            this.updateUI();
            
        } catch (error) {
            console.error('❌ USDT claim error:', error);
            this.showNotification('خطا', 'مشکلی در دریافت پاداش پیش آمد');
        }
    }
    
    boostMining() {
        if (!this.user || !this.gameData) {
            this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
            return;
        }
        
        const cost = 5000; // هزینه افزایش قدرت
        
        if (this.gameData.sod_balance < cost) {
            this.showNotification('موجودی ناکافی', `برای افزایش قدرت به ${cost} SOD نیاز دارید.`);
            return;
        }
        
        try {
            console.log('⚡ Activating mining boost');
            
            // کسر هزینه
            this.gameData.sod_balance -= cost;
            this.gameData.boost_active = true;
            this.gameData.boost_end_time = Date.now() + (30 * 60 * 1000); // 30 دقیقه
            
            // ذخیره
            this.saveToLocalStorage();
            
            // ثبت تراکنش
            this.addTransaction('خرید افزایش قدرت', -cost, 'sod');
            
            // نوتیفیکیشن
            this.showNotification(
                '⚡ افزایش قدرت فعال شد!', 
                'قدرت استخراج شما ۳ برابر شد.\nمدت زمان: ۳۰ دقیقه'
            );
            
            // تایمر پایان بوست
            setTimeout(() => {
                if (this.gameData) {
                    this.gameData.boost_active = false;
                    this.saveToLocalStorage();
                    this.showNotification('پایان بوست', 'زمان افزایش قدرت به پایان رسید.');
                    this.updateUI();
                }
            }, 30 * 60 * 1000);
            
            // آپدیت UI
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Boost error:', error);
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
            
            this.showNotification('⏸️ استخراج خودکار متوقف شد', 'سیاست استخراج خودکار غیرفعال شد.');
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
        console.log('🤖 Starting auto-mining');
        
        this.autoMineInterval = setInterval(async () => {
            if (!this.gameData) return;
            
            const baseEarned = Math.floor((this.gameData.mining_power || 10) * 0.5);
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = baseEarned * boostMultiplier;
            
            this.gameData.sod_balance += totalEarned;
            this.gameData.total_mined += totalEarned;
            this.gameData.today_earnings += totalEarned;
            this.gameData.usdt_progress += totalEarned;
            
            this.saveToLocalStorage();
            this.updateUI();
            
            // چک پاداش USDT هر 10 ثانیه
            if (Math.random() < 0.1) {
                await this.checkUSDT();
            }
            
        }, 1000); // هر ثانیه
        
        this.showNotification('🤖 استخراج خودکار فعال شد', 'سیستم در حال استخراج خودکار است.');
        this.updateAutoMineButton();
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
        this.updateElement('usdtBalance', (this.gameData.usdt_balance || 0).toFixed(4) + ' <span>USDT</span>');
        
        // آمار
        this.updateElement('todayEarnings', this.formatNumber(this.gameData.today_earnings || 0) + ' SOD');
        this.updateElement('miningPower', (this.gameData.mining_power || 10) + 'x');
        this.updateElement('clickReward', '+' + (this.gameData.mining_power || 10) + ' SOD');
        this.updateElement('userLevel', this.gameData.user_level || 1);
        
        // پاداش USDT
        this.updateElement('availableUSDT', (this.gameData.usdt_balance || 0).toFixed(4) + ' USDT');
        
        // Progress bar
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
        
        console.log('✅ UI updated');
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
            element.textContent = date.toLocaleDateString('fa-IR') + ' ' + 
                                 date.toLocaleTimeString('fa-IR');
        } else {
            element.textContent = 'هنوز دریافت نکرده‌اید';
        }
    }
    
    updateAutoMineButton() {
        const button = document.getElementById('autoMineBtn');
        if (!button) return;
        
        if (this.autoMineInterval) {
            button.innerHTML = '<i class="fas fa-pause"></i> توقف خودکار';
            button.style.background = 'var(--error)';
        } else {
            button.innerHTML = '<i class="fas fa-robot"></i> استخراج خودکار';
            button.style.background = '';
            
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
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <i class="fas fa-history"></i><br>
                        هنوز تراکنشی ثبت نشده است
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
            
            // انتخاب آیکون مناسب
            let icon = '⛏️';
            if (tx.type === 'usdt') icon = '💰';
            if (tx.description.includes('خرید')) icon = '🛒';
            if (tx.amount < 0) icon = '📤';
            if (tx.description.includes('هدیه')) icon = '🎁';
            
            // انتخاب رنگ
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
                            <div style="font-weight: bold; font-size: 13px;">${tx.description}</div>
                            <div style="color: var(--text-secondary); font-size: 11px;">
                                ${dateString} - ${timeString}
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
                    ${plan.popular ? `<div class="sale-plan-badge">پیشنهاد ویژه</div>` : ''}
                    ${plan.discount > 0 ? `
                        <div style="position: absolute; top: 16px; right: 16px;">
                            <span class="discount-badge">${plan.discount}% تخفیف</span>
                        </div>
                    ` : ''}
                    
                    <div class="sale-plan-header">
                        <h3 class="sale-plan-name">${plan.name}</h3>
                        <div class="sale-plan-price">${plan.price} <span>USDT</span></div>
                        <div class="sod-amount">${this.formatNumber(totalSOD)} SOD</div>
                    </div>
                    
                    <ul class="sale-plan-features">
                        ${plan.features.map(f => `<li><i class="fas fa-check" style="color: var(--success);"></i> ${f}</li>`).join('')}
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
    
    // ==================== UI CONTROLS ====================
    
    showMainPage() {
        const loginPage = document.getElementById('registerOverlay');
        const mainPage = document.getElementById('mainContainer');
        
        if (loginPage) loginPage.style.display = 'none';
        if (mainPage) mainPage.style.display = 'block';
        
        console.log('📱 Main page displayed');
    }
    
    showLoginPage() {
        const loginPage = document.getElementById('registerOverlay');
        const mainPage = document.getElementById('mainContainer');
        
        if (loginPage) loginPage.style.display = 'flex';
        if (mainPage) mainPage.style.display = 'none';
        
        console.log('🔐 Login page displayed');
    }
    
    addTestButtons() {
        const loginContainer = document.getElementById('registerOverlay');
        if (!loginContainer) return;
        
        // حذف دکمه‌های قبلی
        const oldButtons = loginContainer.querySelector('.test-buttons');
        if (oldButtons) oldButtons.remove();
        
        // ایجاد دکمه‌های تست
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'test-buttons';
        buttonContainer.style.cssText = `
            margin-top: 25px;
            padding: 20px;
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            border: 1px solid var(--glass-border);
        `;
        
        buttonContainer.innerHTML = `
            <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 15px; text-align: center;">
                <i class="fas fa-bolt"></i> ورود سریع برای تست:
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="window.gameInstance.quickLogin('test@example.com', '123456')" 
                        style="padding: 14px; background: var(--primary); color: white; 
                               border: none; border-radius: 10px; cursor: pointer; font-weight: 600;
                               display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="fas fa-user"></i>
                    ورود با کاربر تست (1M SOD)
                </button>
                
                <button onclick="window.gameInstance.quickLogin('hamyarhf@gmail.com', 'admin123')" 
                        style="padding: 14px; background: var(--accent); color: white; 
                               border: none; border-radius: 10px; cursor: pointer; font-weight: 600;
                               display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="fas fa-user-shield"></i>
                    ورود با ادمین (5M SOD)
                </button>
                
                <button onclick="window.gameInstance.register('new@user.com', '123456', 'کاربر جدید')" 
                        style="padding: 14px; background: var(--secondary); color: white; 
                               border: none; border-radius: 10px; cursor: pointer; font-weight: 600;
                               display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <i class="fas fa-user-plus"></i>
                    ایجاد کاربر جدید
                </button>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); 
                        border-radius: 8px; text-align: center; font-size: 11px; color: var(--text-secondary);">
                <div style="margin-bottom: 5px;">🎮 دستورات دیباگ در کنسول:</div>
                <div style="font-family: monospace; font-size: 10px; color: var(--primary-light);">
                    debugGame() - نمایش وضعیت<br>
                    resetGame() - ریست کامل
                </div>
            </div>
        `;
        
        // اضافه کردن به صفحه
        const registerContainer = loginContainer.querySelector('.register-container');
        if (registerContainer) {
            registerContainer.appendChild(buttonContainer);
        }
    }
    
    addEmergencyButtons() {
        // دکمه‌های اضطراری در صفحه اصلی
        const mainContainer = document.getElementById('mainContainer');
        if (!mainContainer) return;
        
        const emergencyDiv = document.createElement('div');
        emergencyDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        emergencyDiv.innerHTML = `
            <button onclick="window.gameInstance.debugGame()" 
                    style="padding: 10px 15px; background: #FF6B35; color: white; 
                           border: none; border-radius: 8px; cursor: pointer; font-size: 12px;">
                🐞 دیباگ
            </button>
            <button onclick="window.resetGame()" 
                    style="padding: 10px 15px; background: #FF3D00; color: white; 
                           border: none; border-radius: 8px; cursor: pointer; font-size: 12px;">
                🔄 ریست
            </button>
        `;
        
        mainContainer.appendChild(emergencyDiv);
    }
    
    showLoadingMessage(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'gameLoading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(5, 9, 20, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-size: 16px;
        `;
        
        loadingDiv.innerHTML = `
            <div style="width: 60px; height: 60px; border: 4px solid var(--primary);
                        border-top-color: transparent; border-radius: 50%;
                        animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <div>${message}</div>
            <div style="margin-top: 20px; font-size: 12px; color: var(--text-secondary);">
                SODmAX Pro در حال راه‌اندازی...
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
        
        // اضافه کردن استایل انیمیشن
        if (!document.querySelector('#loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    hideLoadingMessage() {
        const loadingDiv = document.getElementById('gameLoading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    createMiningEffect(amount) {
        const effect = document.createElement('div');
        effect.textContent = '+' + this.formatNumber(amount);
        effect.style.cssText = `
            position: fixed;
            color: #0066FF;
            font-weight: 900;
            font-size: 24px;
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
        }
        
        document.body.appendChild(effect);
        
        // حذف بعد از انیمیشن
        setTimeout(() => effect.remove(), 1000);
    }
    
    showNotification(title, message) {
        const notification = document.getElementById('notification');
        if (!notification) {
            // ایجاد نوتیفیکیشن موقت
            const tempNotification = document.createElement('div');
            tempNotification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, var(--primary), var(--secondary));
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 300px;
                animation: slideIn 0.3s ease;
            `;
            
            tempNotification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">${title}</div>
                <div style="font-size: 13px;">${message}</div>
            `;
            
            document.body.appendChild(tempNotification);
            
            setTimeout(() => {
                tempNotification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => tempNotification.remove(), 300);
            }, 4000);
            
            return;
        }
        
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
        
        const adminEmails = [
            'hamyarhf@gmail.com',
            'admin@sodmax.com',
            'admin@example.com'
        ];
        
        // بررسی از userInfo
        if (this.userInfo && this.userInfo.is_admin) {
            this.isAdmin = true;
        } else {
            this.isAdmin = adminEmails.includes(this.user.email.toLowerCase());
        }
        
        console.log(`👑 Admin: ${this.isAdmin ? 'YES' : 'NO'}`);
    }
    
    showAdminLink() {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = this.isAdmin ? 'flex' : 'none';
        }
    }
    
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
        
        // دکمه خرید SOD
        const buyButtons = document.querySelectorAll('[onclick*="showSODSale"]');
        buyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSODSale();
            });
        });
        
        // دکمه افزایش قدرت
        const boostBtn = document.querySelector('[onclick*="boostMining"]');
        if (boostBtn) {
            boostBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.boostMining();
            });
        }
        
        console.log('✅ Event listeners setup complete');
    }
    
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.user && this.gameData) {
                this.saveToLocalStorage();
            }
        }, 30000); // هر 30 ثانیه
        
        console.log('💾 Auto-save enabled');
    }
    
    // ==================== DEBUG & UTILITY ====================
    
    debugGame() {
        console.log('=== 🐞 SODmAX DEBUG INFO ===');
        console.log('Game State:', {
            isInitialized: this.isInitialized,
            hasUser: !!this.user,
            hasGameData: !!this.gameData,
            userEmail: this.user?.email,
            sodBalance: this.gameData?.sod_balance,
            usdtBalance: this.gameData?.usdt_balance,
            isAdmin: this.isAdmin
        });
        
        console.log('LocalStorage:', {
            user: localStorage.getItem('sodmax_user') ? '✅ Found' : '❌ Not found',
            game: localStorage.getItem('sodmax_game') ? '✅ Found' : '❌ Not found',
            userinfo: localStorage.getItem('sodmax_userinfo') ? '✅ Found' : '❌ Not found',
            transactions: localStorage.getItem('sodmax_transactions') ? '✅ Found' : '❌ Not found'
        });
        
        console.log('Quick Commands:', [
            'gameInstance.mine() - استخراج',
            'gameInstance.buySODPlan(1) - خرید پنل 1',
            'gameInstance.claimUSDT() - دریافت پاداش',
            'gameInstance.boostMining() - افزایش قدرت',
            'gameInstance.toggleAutoMine() - استخراج خودکار'
        ]);
    }
    
    resetGame() {
        if (confirm('⚠️ آیا مطمئن هستید که می‌خواهید بازی را ریست کنید؟\nتمام داده‌ها پاک خواهند شد!')) {
            localStorage.clear();
            console.log('🗑️ All game data cleared');
            alert('بازی ریست شد. در حال بارگذاری مجدد...');
            location.reload();
        }
    }
}

// ==================== GLOBAL INSTANCE ====================

// ایجاد نمونه اصلی بازی
let gameInstance = null;

// تابع‌های عمومی برای دسترسی از HTML
window.loginUser = async function() {
    const email = document.getElementById('authEmail')?.value || 'test@example.com';
    const password = document.getElementById('authPassword')?.value || '123456';
    
    if (!gameInstance) {
        console.log('🔄 Creating new game instance...');
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

window.debugGame = function() {
    if (gameInstance) {
        gameInstance.debugGame();
    } else {
        console.log('⚠️ gameInstance not created yet');
    }
};

window.resetGame = function() {
    if (gameInstance) {
        gameInstance.resetGame();
    }
};

// ==================== INITIALIZATION ====================

// راه‌اندازی هنگامی که DOM آماده است
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 DOM Content Loaded - Starting SODmAX Pro...');
    
    try {
        // ایجاد نمونه بازی
        gameInstance = new SODmaxGame();
        
        // شروع بازی
        await gameInstance.init();
        
        console.log('🚀 SODmAX Pro is fully loaded and ready!');
        console.log('🔧 Commands available:');
        console.log('  • debugGame() - نمایش وضعیت بازی');
        console.log('  • resetGame() - ریست کامل');
        console.log('  • mineSOD() - استخراج دستی');
        console.log('  • claimUSDT() - دریافت پاداش');
        
        // نمایش پیام خوش‌آمدگویی در کنسول
        console.log('%c✨ SODmAX Pro Activated ✨', 'color: #0066FF; font-size: 16px; font-weight: bold;');
        
    } catch (error) {
        console.error('❌ Fatal error during initialization:', error);
        alert('خطای شدید در راه‌اندازی بازی. لطفاً کنسول مرورگر را چک کنید (F12).');
    }
});

// بارگذاری مجدد در صورت خطا
setTimeout(() => {
    if (!gameInstance) {
        console.log('⚠️ Game not initialized after 3 seconds, retrying...');
        gameInstance = new SODmaxGame();
        gameInstance.init();
    }
}, 3000);

console.log('✅ app-core.js loaded successfully');
