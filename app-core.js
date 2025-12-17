// ==================== app-core.js ====================
// فایل کامل و اصلاح شده SODmAX Pro

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
        this.supabaseClient = null;
        
        console.log('✅ Game instance created');
    }
    
    // ==================== INITIALIZATION ====================
    
    async init() {
        console.log('🚀 Initializing game...');
        
        try {
            // راه‌اندازی Supabase (اگر موجود باشد)
            await this.setupSupabase();
            
            // چک session موجود
            await this.checkAuthSession();
            
            // تنظیم event listeners
            this.setupEventListeners();
            
            // شروع auto-save
            this.startAutoSave();
            
            // رندر پنل‌های فروش
            this.renderSalePlans();
            
            console.log('✅ Game initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing game:', error);
            this.showLoginPage();
        }
    }
    
    async setupSupabase() {
        try {
            // اگر Supabase در window موجود باشد
            if (window.supabase && window.supabaseClient) {
                this.supabaseClient = window.supabaseClient;
                console.log('✅ Using existing Supabase client');
                return true;
            }
            
            // اگر URL و KEY در localStorage ذخیره شده‌اند
            const supabaseUrl = localStorage.getItem('supabase_url') || 'https://your-project.supabase.co';
            const supabaseKey = localStorage.getItem('supabase_key') || 'your-anon-key';
            
            if (window.supabase) {
                this.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                window.supabaseClient = this.supabaseClient;
                console.log('✅ Created new Supabase client');
                return true;
            }
            
            console.log('⚠️ Supabase not available, using localStorage fallback');
            return false;
            
        } catch (error) {
            console.error('❌ Error setting up Supabase:', error);
            return false;
        }
    }
    
    async checkAuthSession() {
        try {
            console.log('🔐 Checking authentication session...');
            
            // اگر Supabase موجود نباشد، از localStorage استفاده کن
            if (!this.supabaseClient) {
                await this.checkLocalStorageSession();
                return;
            }
            
            const { data: { session }, error } = await this.supabaseClient.auth.getSession();
            
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
    
    async checkLocalStorageSession() {
        const userData = localStorage.getItem('sodmax_user');
        const gameData = localStorage.getItem('sodmax_game');
        
        if (userData && gameData) {
            try {
                this.user = JSON.parse(userData);
                this.gameData = JSON.parse(gameData);
                this.userInfo = { ...this.user };
                
                // بارگذاری تراکنش‌ها
                this.transactions = JSON.parse(localStorage.getItem('sodmax_transactions') || '[]');
                
                console.log('✅ Loaded user from localStorage:', this.user.email);
                this.showMainPage();
                this.updateUI();
                
                // شبیه‌سازی لاگین موفق
                this.showNotification('خوش آمدید', `سلام ${this.userInfo.full_name || this.user.email}!`);
                
            } catch (error) {
                console.error('Error parsing localStorage data:', error);
                this.showLoginPage();
            }
        } else {
            console.log('ℹ️ No localStorage session found');
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
        
        // اگر Supabase موجود نباشد، از localStorage استفاده کن
        if (!this.supabaseClient) {
            return this.localStorageLogin(email, password);
        }
        
        try {
            const { data, error } = await this.supabaseClient.auth.signInWithPassword({
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
    
    localStorageLogin(email, password) {
        // کاربران تست
        const testUsers = {
            'test@example.com': { password: '123456', full_name: 'کاربر تست', sod_balance: 1000000 },
            'hamyarhf@gmail.com': { password: 'admin123', full_name: 'مدیر سیستم', sod_balance: 5000000, isAdmin: true }
        };
        
        if (testUsers[email] && testUsers[email].password === password) {
            const user = {
                id: 'local-' + Date.now(),
                email: email,
                user_metadata: { full_name: testUsers[email].full_name }
            };
            
            this.user = user;
            
            this.gameData = {
                sod_balance: testUsers[email].sod_balance || 1000000,
                usdt_balance: 0,
                today_earnings: 0,
                mining_power: 10,
                user_level: 1,
                usdt_progress: 0,
                total_mined: testUsers[email].sod_balance || 1000000,
                boost_active: false,
                boost_end_time: 0
            };
            
            this.userInfo = {
                full_name: testUsers[email].full_name,
                email: email,
                register_date: new Date().toLocaleDateString('fa-IR'),
                is_admin: testUsers[email].isAdmin || false
            };
            
            // ذخیره در localStorage
            localStorage.setItem('sodmax_user', JSON.stringify(user));
            localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
            localStorage.setItem('sodmax_userinfo', JSON.stringify(this.userInfo));
            
            // بارگذاری تراکنش‌ها
            this.transactions = JSON.parse(localStorage.getItem('sodmax_transactions') || '[]');
            if (this.transactions.length === 0) {
                this.transactions.push({
                    description: 'هدیه ثبت نام',
                    amount: this.gameData.sod_balance,
                    type: 'sod',
                    created_at: new Date().toISOString()
                });
            }
            
            // بررسی ادمین
            this.isAdmin = testUsers[email].isAdmin || false;
            
            console.log('✅ Local login successful:', email);
            this.showMainPage();
            this.updateUI();
            
            this.showNotification('خوش آمدید', `سلام ${testUsers[email].full_name}!`);
            
            return true;
        } else {
            this.showNotification('خطا در ورود', 'ایمیل یا رمز عبور اشتباه است');
            return false;
        }
    }
    
    async register(email, password, fullName) {
        console.log('📝 Attempting registration for:', email);
        
        if (!email || !password) {
            this.showNotification('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
            return false;
        }
        
        // اگر Supabase موجود نباشد، از localStorage استفاده کن
        if (!this.supabaseClient) {
            return this.localStorageRegister(email, password, fullName);
        }
        
        try {
            const { data, error } = await this.supabaseClient.auth.signUp({
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
    
    localStorageRegister(email, password, fullName) {
        const user = {
            id: 'local-' + Date.now(),
            email: email,
            user_metadata: { full_name: fullName || email.split('@')[0] }
        };
        
        this.user = user;
        
        this.gameData = {
            sod_balance: 1000000, // هدیه ثبت نام
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
        
        // ذخیره در localStorage
        localStorage.setItem('sodmax_user', JSON.stringify(user));
        localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
        localStorage.setItem('sodmax_userinfo', JSON.stringify(this.userInfo));
        
        // ایجاد تراکنش اولیه
        this.transactions = [{
            description: 'هدیه ثبت نام',
            amount: 1000000,
            type: 'sod',
            created_at: new Date().toISOString()
        }];
        localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
        
        console.log('✅ Local registration successful:', email);
        this.showMainPage();
        this.updateUI();
        
        this.showNotification('ثبت‌نام موفق', `حساب شما با موفقیت ایجاد شد!`);
        
        return true;
    }
    
    async logout() {
        console.log('🚪 Logging out...');
        
        try {
            // اگر Supabase داریم، logout از آن
            if (this.supabaseClient) {
                const { error } = await this.supabaseClient.auth.signOut();
                if (error) console.error('Logout error:', error);
            }
            
            // پاک کردن داده‌های localStorage
            localStorage.removeItem('sodmax_user');
            localStorage.removeItem('sodmax_game');
            localStorage.removeItem('sodmax_userinfo');
            localStorage.removeItem('sodmax_transactions');
            
            this.user = null;
            this.gameData = null;
            this.userInfo = null;
            this.transactions = [];
            this.isAdmin = false;
            
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
            // اگر Supabase داریم، از دیتابیس لود کن
            if (this.supabaseClient && window.GameDB) {
                const userResult = await window.GameDB.getOrCreateUser(this.user.id, this.user.email);
                if (userResult.error) {
                    console.error('Error getting/creating user:', userResult.error);
                    return;
                }
                this.userInfo = userResult.data;
                
                const gameResult = await window.GameDB.getOrCreateGameData(this.user.id);
                if (gameResult.error) {
                    console.error('Error getting/creating game data:', gameResult.error);
                    return;
                }
                this.gameData = gameResult.data;
            } else {
                // از localStorage لود کن
                const savedGameData = localStorage.getItem('sodmax_game');
                const savedUserInfo = localStorage.getItem('sodmax_userinfo');
                
                if (savedGameData) this.gameData = JSON.parse(savedGameData);
                if (savedUserInfo) this.userInfo = JSON.parse(savedUserInfo);
                
                // اگر داده‌ای وجود نداشت، ایجاد کن
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
                
                if (!this.userInfo) {
                    this.userInfo = {
                        full_name: this.user.email.split('@')[0],
                        email: this.user.email,
                        register_date: new Date().toLocaleDateString('fa-IR'),
                        is_admin: false
                    };
                }
            }
            
            // بارگذاری تراکنش‌ها
            await this.loadTransactions();
            
            // چک ادمین بودن
            this.checkAdminStatus();
            
            // آپدیت UI
            this.updateUI();
            
            console.log('✅ User data loaded successfully');
            
        } catch (error) {
            console.error('Error in loadUserData:', error);
        }
    }
    
    async loadTransactions() {
        if (!this.user) return;
        
        try {
            if (this.supabaseClient && window.GameDB) {
                const { data, error } = await window.GameDB.getTransactions(this.user.id, 15);
                if (!error) this.transactions = data || [];
            } else {
                // از localStorage لود کن
                const savedTransactions = localStorage.getItem('sodmax_transactions');
                this.transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
            }
            
            // اگر تراکنشی نیست، یک تراکنش نمونه اضافه کن
            if (this.transactions.length === 0 && this.gameData) {
                this.transactions.push({
                    description: 'هدیه ثبت نام',
                    amount: this.gameData.sod_balance || 1000000,
                    type: 'sod',
                    created_at: new Date().toISOString()
                });
                
                localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
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
            this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
            return;
        }
        
        try {
            const baseEarned = this.gameData.mining_power || 10;
            const boostMultiplier = this.gameData.boost_active ? 3 : 1;
            const totalEarned = baseEarned * boostMultiplier;
            
            console.log(`⛏️ Mining: ${baseEarned} × ${boostMultiplier} = ${totalEarned} SOD`);
            
            // آپدیت محلی
            this.gameData.sod_balance = (this.gameData.sod_balance || 0) + totalEarned;
            this.gameData.total_mined = (this.gameData.total_mined || 0) + totalEarned;
            this.gameData.today_earnings = (this.gameData.today_earnings || 0) + totalEarned;
            this.gameData.usdt_progress = (this.gameData.usdt_progress || 0) + totalEarned;
            
            // ذخیره در localStorage
            localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
            
            // ثبت تراکنش
            this.addTransaction('استخراج دستی', totalEarned, 'sod');
            
            // افکت بصری
            this.createMiningEffect(totalEarned);
            
            // آپدیت UI
            this.updateUI();
            
            // چک پاداش USDT
            await this.checkUSDT();
            
        } catch (error) {
            console.error('❌ Error in mining:', error);
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
            
            console.log(`💰 USDT reward: ${cycles} cycles = ${totalUSDT} USDT`);
            
            this.gameData.usdt_balance = (this.gameData.usdt_balance || 0) + totalUSDT;
            this.gameData.usdt_progress %= 10000000;
            
            // ذخیره در localStorage
            localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
            
            // ثبت تراکنش
            this.addTransaction('دریافت پاداش USDT', totalUSDT, 'usdt');
            
            // نوتیفیکیشن
            this.showNotification(
                '🎉 پاداش USDT', 
                `${totalUSDT.toFixed(4)} USDT دریافت کردید!`
            );
            
            // شانس ارتقاء سطح (15% شانس)
            if (Math.random() < 0.15) {
                this.gameData.user_level = (this.gameData.user_level || 1) + 1;
                this.gameData.mining_power = 10 * this.gameData.user_level;
                
                localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                
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
    
    addTransaction(description, amount, type) {
        const transaction = {
            description,
            amount,
            type,
            created_at: new Date().toISOString()
        };
        
        this.transactions.unshift(transaction);
        
        // محدود کردن به 20 تراکنش
        if (this.transactions.length > 20) {
            this.transactions = this.transactions.slice(0, 20);
        }
        
        // ذخیره در localStorage
        localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
        
        // آپدیت UI
        this.renderTransactions();
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
        
        // تایید خرید
        if (!confirm(`آیا مطمئن هستید که می‌خواهید پنل "${plan.name}" را خریداری کنید؟\n\n💰 دریافت: ${this.formatNumber(totalSOD)} SOD\n🎁 شامل: ${this.formatNumber(plan.sod)} SOD اصلی + ${this.formatNumber(plan.bonus)} SOD هدیه`)) {
            return;
        }
        
        try {
            // در نسخه واقعی اینجا پرداخت انجام می‌شود
            // فعلاً فقط اضافه می‌کنیم
            this.gameData.sod_balance = (this.gameData.sod_balance || 0) + totalSOD;
            this.gameData.total_mined = (this.gameData.total_mined || 0) + totalSOD;
            
            // ذخیره در localStorage
            localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
            
            // ثبت تراکنش
            this.addTransaction(`خرید پنل ${plan.name}`, totalSOD, 'sod');
            
            this.showNotification(
                '🛒 خرید موفق', 
                `${this.formatNumber(totalSOD)} SOD خریداری شد!\n(اصلی: ${this.formatNumber(plan.sod)} + هدیه: ${this.formatNumber(plan.bonus)})`
            );
            
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error buying plan:', error);
            this.showNotification('خطا', 'مشکلی در خرید پیش آمد');
        }
    }
    
    async claimUSDT() {
        if (!this.gameData || !this.gameData.usdt_balance || this.gameData.usdt_balance <= 0) {
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
                
                // ذخیره در localStorage
                localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                
                // ثبت تراکنش‌ها
                this.addTransaction('دریافت پاداش USDT', -usdtToClaim, 'usdt');
                this.addTransaction('تبدیل SOD به USDT', -sodNeeded, 'sod');
                
                this.showNotification(
                    '✅ پاداش دریافت شد', 
                    `${usdtToClaim.toFixed(4)} USDT دریافت کردید.\n${this.formatNumber(sodNeeded)} SOD کسر شد.`
                );
                
                this.updateUI();
                
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
        
        // نمایش لینک ادمین
        this.showAdminLink();
        
        // آپدیت دکمه استخراج خودکار
        this.updateAutoMineButton();
        
        // آپدیت آخرین زمان دریافت
        this.updateLastClaimTime();
        
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
    
    updateLastClaimTime() {
        const lastClaimElement = document.getElementById('lastClaimTime');
        if (!lastClaimElement) return;
        
        // پیدا کردن آخرین تراکنش USDT
        const lastUSDTTransaction = this.transactions.find(tx => 
            tx.type === 'usdt' && tx.description.includes('دریافت پاداش')
        );
        
        if (lastUSDTTransaction) {
            const date = new Date(lastUSDTTransaction.created_at);
            lastClaimElement.textContent = date.toLocaleDateString('fa-IR') + ' ' + 
                                         date.toLocaleTimeString('fa-IR');
        } else {
            lastClaimElement.textContent = 'هنوز دریافت نکرده‌اید';
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
    
    renderSalePlans() {
        const grid = document.getElementById('salePlansGrid');
        if (!grid) {
            console.warn('⚠️ Sale plans grid not found');
            return;
        }
        
        const plans = [
            {
                id: 1,
                name: "پنل استارتر",
                usdtPrice: 1,
                sodAmount: 5000000,
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
                usdtPrice: 5,
                sodAmount: 30000000,
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
                usdtPrice: 15,
                sodAmount: 100000000,
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
                usdtPrice: 50,
                sodAmount: 500000000,
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
            const totalSOD = plan.sodAmount + plan.bonus;
            
            return `
                <div class="sale-plan-card ${plan.popular ? 'featured' : ''}">
                    ${plan.popular ? `<div class="sale-plan-badge">پیشنهاد ویژه</div>` : ''}
                    ${plan.discount > 0 ? `<div style="position: absolute; top: 16px; right: 16px;"><span class="discount-badge">${plan.discount}% تخفیف</span></div>` : ''}
                    
                    <div class="sale-plan-header">
                        <h3 class="sale-plan-name">${plan.name}</h3>
                        <div class="sale-plan-price">${plan.usdtPrice} <span>USDT</span></div>
                        <div class="sod-amount">${this.formatNumber(totalSOD)} SOD</div>
                    </div>
                    
                    <ul class="sale-plan-features">
                        ${plan.features.map(feature => `<li><i class="fas fa-check" style="color: var(--success);"></i> ${feature}</li>`).join('')}
                    </ul>
                    
                    <button class="btn ${plan.popular ? 'btn-warning' : 'btn-primary'}" 
                            onclick="window.gameInstance.buySODPlan(${plan.id})"
                            data-plan-id="${plan.id}">
                        <i class="fas fa-shopping-cart"></i>
                        خرید پنل
                    </button>
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
        
        setTimeout(() => effect.remove(), 1000);
    }
    
    formatNumber(num) {
        if (!num && num !== 0) return '0';
        
        const n = Math.abs(Number(num));
        if (n >= 1000000000) return (n / 1000000000).toFixed(2) + 'B';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return Math.floor(n).toLocaleString('fa-IR');
    }
    
    showNotification(title, message) {
        const notification = document.getElementById('notification');
        if (!notification) {
            // اگر نوتیفیکیشن وجود نداشت، ایجاد کن
            console.log('📢 ' + title + ': ' + message);
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
            'admin@sodmax.com',
            'test@example.com'
        ];
        
        // بررسی از userInfo
        if (this.userInfo && this.userInfo.is_admin) {
            this.isAdmin = true;
        } else {
            this.isAdmin = adminEmails.includes(this.user.email.toLowerCase());
        }
        
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
            autoBtn.disabled = false;
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
        
        // دکمه خرید SOD
        const buySODBtn = document.querySelector('[onclick="showSODSale()"]');
        if (buySODBtn) {
            buySODBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSODSale();
            });
        }
        
        // دکمه افزایش قدرت
        const boostBtn = document.querySelector('[onclick="boostMining()"]');
        if (boostBtn) {
            boostBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.boostMining();
            });
        }
        
        console.log('✅ Event listeners setup complete');
    }
    
    showSODSale() {
        const saleSection = document.getElementById('sodSaleSection');
        if (saleSection) {
            saleSection.style.display = 'block';
            saleSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    boostMining() {
        if (!this.gameData) return;
        
        const cost = 5000;
        if (this.gameData.sod_balance >= cost) {
            this.gameData.sod_balance -= cost;
            this.gameData.boost_active = true;
            this.gameData.boost_end_time = Date.now() + (30 * 60 * 1000); // 30 دقیقه
            
            localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
            
            this.addTransaction('خرید افزایش قدرت', -cost, 'sod');
            
            this.showNotification('⚡ افزایش قدرت', 'قدرت استخراج شما ۳ برابر شد! (۳۰ دقیقه)');
            
            // تایمر پایان بوست
            setTimeout(() => {
                if (this.gameData) {
                    this.gameData.boost_active = false;
                    localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                    this.showNotification('پایان بوست', 'زمان افزایش قدرت به پایان رسید.');
                    this.updateUI();
                }
            }, 30 * 60 * 1000);
            
            this.updateUI();
            
        } else {
            this.showNotification('⚠️ موجودی کافی نیست', 'برای افزایش قدرت به ۵۰۰۰ SOD نیاز دارید.');
        }
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
            
            const earned = Math.floor((this.gameData.mining_power || 10) * 0.5);
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
        this.autoSaveInterval = setInterval(() => {
            if (this.user && this.gameData) {
                try {
                    localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
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
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 DOM loaded, starting game...');
    
    gameInstance = new SODmaxGame();
    await gameInstance.init();
    
    console.log('🚀 SODmAX Pro is ready!');
});

// ==================== HELPER FUNCTIONS ====================

// افزودن استایل‌های لازم برای انیمیشن‌ها
if (!document.getElementById('game-styles')) {
    const style = document.createElement('style');
    style.id = 'game-styles';
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
        
        .notification.show {
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}
