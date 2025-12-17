// ==================== app-core.js ====================
// نسخه ساده‌شده بدون تعریف تکراری

console.log('🎮 Loading SODmAX Pro Game Core...');

// اگر کلاس قبلاً تعریف نشده باشد
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
            
            console.log('✅ Game instance created');
        }
        
        async init() {
            console.log('🚀 Initializing game...');
            
            try {
                // 1. Check for existing user session
                const hasSession = await this.checkAuthSession();
                
                if (hasSession) {
                    console.log('✅ User session found');
                    this.showMainPage();
                    this.updateUI();
                } else {
                    console.log('⚠️ No user session');
                    this.showLoginPage();
                }
                
                // 2. Setup event listeners
                this.setupEventListeners();
                
                // 3. Render sale plans
                this.renderSalePlans();
                
                console.log('✅ Game initialized successfully');
                
            } catch (error) {
                console.error('❌ Error initializing game:', error);
                this.showLoginPage();
            }
        }
        
        async checkAuthSession() {
            try {
                if (window.supabaseClient) {
                    const { data: { session } } = await window.supabaseClient.auth.getSession();
                    
                    if (session) {
                        this.user = session.user;
                        await this.loadUserData();
                        return true;
                    }
                }
                
                // Fallback to localStorage
                const savedUser = localStorage.getItem('sodmax_user');
                if (savedUser) {
                    this.user = JSON.parse(savedUser);
                    this.gameData = JSON.parse(localStorage.getItem('sodmax_game') || '{}');
                    this.userInfo = JSON.parse(localStorage.getItem('sodmax_userinfo') || '{}');
                    this.transactions = JSON.parse(localStorage.getItem('sodmax_transactions') || '[]');
                    return true;
                }
                
                return false;
                
            } catch (error) {
                console.error('❌ Error checking auth session:', error);
                return false;
            }
        }
        
        async loadUserData() {
            if (!this.user) return;
            
            try {
                // Try to load from database
                if (window.GameDB) {
                    const userResult = await window.GameDB.getOrCreateUser(this.user.id, this.user.email);
                    const gameResult = await window.GameDB.getOrCreateGameData(this.user.id);
                    
                    if (!userResult.error) this.userInfo = userResult.data;
                    if (!gameResult.error) this.gameData = gameResult.data;
                }
                
                // Fallback to localStorage
                if (!this.gameData) {
                    this.gameData = JSON.parse(localStorage.getItem('sodmax_game') || '{}');
                }
                
                if (!this.userInfo) {
                    this.userInfo = JSON.parse(localStorage.getItem('sodmax_userinfo') || '{}');
                }
                
                // Load transactions
                this.transactions = JSON.parse(localStorage.getItem('sodmax_transactions') || '[]');
                
                // Check admin status
                this.checkAdminStatus();
                
                console.log('✅ User data loaded:', this.user.email);
                
            } catch (error) {
                console.error('❌ Error loading user data:', error);
            }
        }
        
        // ==================== GAME LOGIC ====================
        
        async mine() {
            if (!this.user || !this.gameData) {
                console.error('❌ Cannot mine: Please login first');
                this.showNotification('خطا', 'لطفاً ابتدا وارد شوید');
                return;
            }
            
            try {
                const baseEarned = this.gameData.mining_power || 10;
                const boostMultiplier = this.gameData.boost_active ? 3 : 1;
                const totalEarned = baseEarned * boostMultiplier;
                
                console.log(`⛏️ Mining: ${totalEarned} SOD`);
                
                // Update game data
                this.gameData.sod_balance = (this.gameData.sod_balance || 0) + totalEarned;
                this.gameData.total_mined = (this.gameData.total_mined || 0) + totalEarned;
                this.gameData.today_earnings = (this.gameData.today_earnings || 0) + totalEarned;
                this.gameData.usdt_progress = (this.gameData.usdt_progress || 0) + totalEarned;
                
                // Save to database
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
                
                // Save to localStorage
                localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                
                // Add transaction locally
                this.addTransaction('استخراج دستی', totalEarned, 'sod');
                
                // Visual effects
                this.createMiningEffect(totalEarned);
                
                // Update UI
                this.updateUI();
                
                // Check USDT reward
                await this.checkUSDT();
                
            } catch (error) {
                console.error('❌ Error mining:', error);
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
                
                console.log(`💰 USDT Reward: ${totalUSDT.toFixed(4)} USDT`);
                
                // Update balances
                this.gameData.usdt_balance = (this.gameData.usdt_balance || 0) + totalUSDT;
                this.gameData.usdt_progress = (this.gameData.usdt_progress || 0) % 10000000;
                
                // Save to database
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
                
                // Save to localStorage
                localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                
                // Add transaction locally
                this.addTransaction('دریافت پاداش USDT', totalUSDT, 'usdt');
                
                // Level up chance (15%)
                if (Math.random() < 0.15) {
                    this.gameData.user_level = (this.gameData.user_level || 1) + 1;
                    this.gameData.mining_power = 10 * this.gameData.user_level;
                    
                    localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                    
                    if (window.GameDB && this.user.id) {
                        await window.GameDB.updateGameData(this.user.id, {
                            user_level: this.gameData.user_level,
                            mining_power: this.gameData.mining_power
                        });
                    }
                    
                    this.showNotification('⭐ ارتقاء سطح', `سطح شما به ${this.gameData.user_level} ارتقاء یافت!`);
                }
                
                this.showNotification('🎉 پاداش USDT', `${totalUSDT.toFixed(4)} USDT دریافت کردید!`);
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
            
            // Keep only last 20 transactions
            if (this.transactions.length > 20) {
                this.transactions = this.transactions.slice(0, 20);
            }
            
            // Save to localStorage
            localStorage.setItem('sodmax_transactions', JSON.stringify(this.transactions));
            
            // Update UI
            this.renderTransactions();
        }
        
        async buySODPlan(planId) {
            if (!this.user || !this.gameData) {
                this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
                return;
            }
            
            const plans = {
                1: { price: 1, sod: 5000000, bonus: 500000, name: 'استارتر' },
                2: { price: 5, sod: 30000000, bonus: 3000000, name: 'پرو' },
                3: { price: 15, sod: 100000000, bonus: 10000000, name: 'پلاتینیوم' },
                4: { price: 50, sod: 500000000, bonus: 50000000, name: 'الماس' }
            };
            
            const plan = plans[planId];
            if (!plan) return;
            
            const totalSOD = plan.sod + plan.bonus;
            
            const confirmMsg = `آیا مطمئن هستید که می‌خواهید پنل "${plan.name}" را خریداری کنید؟\n\n` +
                              `💰 دریافت: ${this.formatNumber(totalSOD)} SOD\n` +
                              `🎁 شامل: ${this.formatNumber(plan.sod)} SOD اصلی + ${this.formatNumber(plan.bonus)} SOD هدیه`;
            
            if (!confirm(confirmMsg)) return;
            
            try {
                console.log(`🛒 Buying plan ${planId}: ${totalSOD} SOD`);
                
                // Update game data
                this.gameData.sod_balance = (this.gameData.sod_balance || 0) + totalSOD;
                this.gameData.total_mined = (this.gameData.total_mined || 0) + totalSOD;
                
                // Save to database
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
                
                // Save to localStorage
                localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                
                // Add transaction locally
                this.addTransaction(`خرید پنل ${plan.name}`, totalSOD, 'sod');
                
                this.showNotification('🎉 خرید موفق', `${this.formatNumber(totalSOD)} SOD خریداری شد!`);
                this.updateUI();
                
            } catch (error) {
                console.error('❌ Error buying plan:', error);
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
            
            if (this.gameData.sod_balance >= sodNeeded) {
                const confirmMsg = `آیا مایل به دریافت ${usdtToClaim.toFixed(4)} USDT هستید؟\n\n` +
                                  `${this.formatNumber(sodNeeded)} SOD از موجودی شما کسر خواهد شد.`;
                
                if (confirm(confirmMsg)) {
                    try {
                        this.gameData.usdt_balance = 0;
                        this.gameData.sod_balance -= sodNeeded;
                        
                        // Save to database
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
                        
                        // Save to localStorage
                        localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                        
                        // Add transactions locally
                        this.addTransaction('دریافت پاداش USDT', -usdtToClaim, 'usdt');
                        this.addTransaction('تبدیل SOD به USDT', -sodNeeded, 'sod');
                        
                        this.showNotification('✅ پاداش دریافت شد', `${usdtToClaim.toFixed(4)} USDT دریافت کردید.`);
                        this.updateUI();
                        
                    } catch (error) {
                        console.error('❌ Error claiming USDT:', error);
                        this.showNotification('خطا', 'مشکلی در دریافت پاداش پیش آمد');
                    }
                }
            } else {
                this.showNotification('⚠️ موجودی ناکافی', 
                    `برای دریافت ${usdtToClaim.toFixed(4)} USDT به ${this.formatNumber(sodNeeded)} SOD نیاز دارید.\n` +
                    `موجودی فعلی شما: ${this.formatNumber(this.gameData.sod_balance)} SOD`);
            }
        }
        
        boostMining() {
            if (!this.user || !this.gameData) {
                this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
                return;
            }
            
            const cost = 5000;
            
            if (this.gameData.sod_balance >= cost) {
                this.gameData.sod_balance -= cost;
                this.gameData.boost_active = true;
                this.gameData.boost_end_time = Date.now() + (30 * 60 * 1000);
                
                // Save to localStorage
                localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                
                // Save to database
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
                
                // Add transaction locally
                this.addTransaction('خرید افزایش قدرت', -cost, 'sod');
                
                this.showNotification('⚡ افزایش قدرت', 'قدرت استخراج شما ۳ برابر شد! (۳۰ دقیقه)');
                
                // Timer for boost end
                setTimeout(() => {
                    if (this.gameData) {
                        this.gameData.boost_active = false;
                        localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                        
                        if (window.GameDB && this.user.id) {
                            window.GameDB.updateGameData(this.user.id, {
                                boost_active: false
                            });
                        }
                        
                        this.showNotification('پایان بوست', 'زمان افزایش قدرت به پایان رسید.');
                        this.updateUI();
                    }
                }, 30 * 60 * 1000);
                
                this.updateUI();
            } else {
                this.showNotification('⚠️ موجودی کافی نیست', 'برای افزایش قدرت به ۵۰۰۰ SOD نیاز دارید.');
            }
        }
        
        // ==================== UI FUNCTIONS ====================
        
        updateUI() {
            if (!this.gameData) {
                console.warn('⚠️ Cannot update UI: no game data');
                return;
            }
            
            // Balances
            this.updateElement('sodBalance', this.formatNumber(this.gameData.sod_balance) + ' <span>SOD</span>');
            this.updateElement('usdtBalance', (this.gameData.usdt_balance || 0).toFixed(4) + ' <span>USDT</span>');
            
            // Stats
            this.updateElement('todayEarnings', this.formatNumber(this.gameData.today_earnings || 0) + ' SOD');
            this.updateElement('miningPower', (this.gameData.mining_power || 10) + 'x');
            this.updateElement('clickReward', '+' + (this.gameData.mining_power || 10) + ' SOD');
            this.updateElement('userLevel', this.gameData.user_level || 1);
            
            // USDT Reward
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
            
            // Last claim time
            this.updateLastClaimTime();
            
            // Auto mine button
            this.updateAutoMineButton();
            
            // Admin link
            this.showAdminLink();
            
            // Transactions
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
                button.classList.remove('btn-primary');
                button.classList.add('btn-warning');
            } else {
                button.innerHTML = '<i class="fas fa-robot"></i> استخراج خودکار';
                button.classList.remove('btn-warning');
                button.classList.add('btn-primary');
                
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
            if (!grid) return;
            
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
                        
                        <div class="sale-plan-header">
                            <h3 class="sale-plan-name">${plan.name}</h3>
                            <div class="sale-plan-price">${plan.usdtPrice} <span>USDT</span></div>
                            <div class="sod-amount">${this.formatNumber(totalSOD)} SOD</div>
                        </div>
                        
                        <ul class="sale-plan-features">
                            ${plan.features.map(feature => `<li><i class="fas fa-check" style="color: var(--success);"></i> ${feature}</li>`).join('')}
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
            
            const adminEmails = ['hamyarhf@gmail.com'];
            this.isAdmin = adminEmails.includes(this.user.email.toLowerCase());
        }
        
        showAdminLink() {
            const adminLink = document.getElementById('adminLink');
            if (adminLink) {
                adminLink.style.display = this.isAdmin ? 'flex' : 'none';
            }
        }
        
        setupEventListeners() {
            // Miner click
            const minerCore = document.getElementById('minerCore');
            if (minerCore) {
                minerCore.addEventListener('click', () => this.mine());
            }
            
            // Claim USDT button
            const claimBtn = document.getElementById('claimUSDTBtn');
            if (claimBtn) {
                claimBtn.addEventListener('click', () => this.claimUSDT());
            }
            
            // Auto mine button
            const autoMineBtn = document.getElementById('autoMineBtn');
            if (autoMineBtn) {
                autoMineBtn.addEventListener('click', () => this.toggleAutoMine());
            }
        }
        
        async toggleAutoMine() {
            if (!this.user || !this.gameData) {
                this.showNotification('خطا', 'لطفاً ابتدا وارد حساب خود شوید');
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
                
                localStorage.setItem('sodmax_game', JSON.stringify(this.gameData));
                this.updateUI();
                await this.checkUSDT();
                
            }, 1000);
            
            this.showNotification('🤖 استخراج خودکار', 'سیستم استخراج خودکار فعال شد.');
            this.updateAutoMineButton();
        }
    }
    
    // Define the class globally
    window.SODmaxGame = SODmaxGame;
}

// ==================== GLOBAL INSTANCE ====================

let gameInstance = null;

// Global functions for HTML access
window.loginUser = async function() {
    const email = document.getElementById('authEmail')?.value || 'test@example.com';
    const password = document.getElementById('authPassword')?.value || '123456';
    
    if (!gameInstance) {
        gameInstance = new window.SODmaxGame();
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
        gameInstance = new window.SODmaxGame();
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

// Initialize the game
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 DOM loaded - Starting SODmAX Pro...');
    
    try {
        gameInstance = new window.SODmaxGame();
        await gameInstance.init();
        
        console.log('🚀 SODmAX Pro is ready!');
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
    }
});

console.log('✅ app-core.js loaded successfully');
