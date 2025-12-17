// ==================== supabase-config.js ====================
// فایل پیکربندی Supabase برای SODmAX Pro

console.log('🔧 بارگذاری پیکربندی Supabase...');

// تنظیمات Supabase
const SUPABASE_URL = 'https://utnqkgbmdjilvbkwjqef.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bnFrZ2JtZGppbHZia3dqcWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDM3ODUsImV4cCI6MjA4MTQ3OTc4NX0.-PA0KAaSuQ-ZAJZLdVNe-AafE5fHf8CA5R4uR3TKGDc';

// ایجاد Supabase Client
let supabaseClient = null;

try {
    if (window.supabase) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase Client ایجاد شد');
        
        // تست اتصال
        testConnection();
    } else {
        console.error('❌ کتابخانه Supabase بارگذاری نشده است');
        showFallbackMessage();
    }
} catch (error) {
    console.error('❌ خطا در ایجاد Supabase Client:', error);
    showFallbackMessage();
}

// ==================== توابع دیتابیس ====================

const GameDB = {
    // تست اتصال
    async testConnection() {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('❌ خطا در تست اتصال:', error);
                return false;
            }
            
            console.log('✅ اتصال به Supabase موفقیت‌آمیز بود');
            return true;
            
        } catch (error) {
            console.error('❌ خطا در تست اتصال:', error);
            return false;
        }
    },
    
    // دریافت یا ایجاد کاربر
    async getOrCreateUser(userId, email) {
        try {
            console.log('📝 دریافت/ایجاد کاربر:', email);
            
            // اول سعی کن کاربر را پیدا کنی
            const { data: existingUser, error: fetchError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (!fetchError && existingUser) {
                console.log('✅ کاربر از قبل وجود دارد');
                return { data: existingUser, error: null };
            }
            
            // اگر کاربر وجود نداشت، ایجاد کن
            const newUser = {
                id: userId,
                email: email,
                full_name: email.split('@')[0],
                register_date: new Date().toLocaleDateString('fa-IR'),
                invite_code: 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                is_admin: email.toLowerCase() === 'hamyarhf@gmail.com',
                created_at: new Date().toISOString()
            };
            
            console.log('🆕 ایجاد کاربر جدید:', newUser);
            
            const { data: createdUser, error: createError } = await supabaseClient
                .from('users')
                .insert([newUser])
                .select()
                .single();
            
            if (createError) {
                console.error('❌ خطا در ایجاد کاربر:', createError);
                return { data: null, error: createError };
            }
            
            console.log('✅ کاربر جدید ایجاد شد');
            return { data: createdUser, error: null };
            
        } catch (error) {
            console.error('❌ خطا در getOrCreateUser:', error);
            return { data: null, error: error };
        }
    },
    
    // دریافت یا ایجاد اطلاعات بازی
    async getOrCreateGameData(userId) {
        try {
            console.log('🎮 دریافت/ایجاد اطلاعات بازی برای:', userId);
            
            // اول سعی کن اطلاعات بازی را پیدا کنی
            const { data: existingData, error: fetchError } = await supabaseClient
                .from('game_data')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (!fetchError && existingData) {
                console.log('✅ اطلاعات بازی از قبل وجود دارد');
                return { data: existingData, error: null };
            }
            
            // اگر اطلاعات بازی وجود نداشت، ایجاد کن
            const newGameData = {
                user_id: userId,
                sod_balance: 1000000,
                usdt_balance: 0,
                today_earnings: 0,
                mining_power: 10,
                user_level: 1,
                usdt_progress: 0,
                total_mined: 1000000,
                boost_active: false,
                boost_end_time: null,
                last_active: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('🆕 ایجاد اطلاعات بازی جدید');
            
            const { data: createdData, error: createError } = await supabaseClient
                .from('game_data')
                .insert([newGameData])
                .select()
                .single();
            
            if (createError) {
                console.error('❌ خطا در ایجاد اطلاعات بازی:', createError);
                return { data: null, error: createError };
            }
            
            console.log('✅ اطلاعات بازی جدید ایجاد شد');
            return { data: createdData, error: null };
            
        } catch (error) {
            console.error('❌ خطا در getOrCreateGameData:', error);
            return { data: null, error: error };
        }
    },
    
    // آپدیت اطلاعات بازی
    async updateGameData(userId, updates) {
        try {
            console.log('🔄 آپدیت اطلاعات بازی برای:', userId, updates);
            
            updates.updated_at = new Date().toISOString();
            
            const { data, error } = await supabaseClient
                .from('game_data')
                .update(updates)
                .eq('user_id', userId)
                .select();
            
            if (error) {
                console.error('❌ خطا در آپدیت اطلاعات بازی:', error);
                return { success: false, error };
            }
            
            console.log('✅ اطلاعات بازی آپدیت شد');
            return { success: true, data, error: null };
            
        } catch (error) {
            console.error('❌ خطا در updateGameData:', error);
            return { success: false, error };
        }
    },
    
    // دریافت تراکنش‌ها
    async getTransactions(userId, limit = 15) {
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('❌ خطا در دریافت تراکنش‌ها:', error);
                return { data: null, error };
            }
            
            return { data, error: null };
            
        } catch (error) {
            console.error('❌ خطا در getTransactions:', error);
            return { data: null, error };
        }
    },
    
    // افزودن تراکنش
    async addTransaction(userId, description, amount, type) {
        try {
            const transaction = {
                user_id: userId,
                description: description,
                amount: amount,
                type: type,
                created_at: new Date().toISOString()
            };
            
            console.log('💾 ثبت تراکنش:', transaction);
            
            const { data, error } = await supabaseClient
                .from('transactions')
                .insert([transaction])
                .select();
            
            if (error) {
                console.error('❌ خطا در ثبت تراکنش:', error);
                return { success: false, error };
            }
            
            console.log('✅ تراکنش ثبت شد');
            return { success: true, data, error: null };
            
        } catch (error) {
            console.error('❌ خطا در addTransaction:', error);
            return { success: false, error };
        }
    },
    
    // دریافت کاربران برای لیدربرد
    async getLeaderboard(limit = 50) {
        try {
            const { data, error } = await supabaseClient
                .from('game_data')
                .select(`
                    sod_balance,
                    total_mined,
                    user_level,
                    users (
                        email,
                        full_name,
                        register_date
                    )
                `)
                .order('total_mined', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('❌ خطا در دریافت لیدربرد:', error);
                return { data: null, error };
            }
            
            return { data, error: null };
            
        } catch (error) {
            console.error('❌ خطا در getLeaderboard:', error);
            return { data: null, error };
        }
    },
    
    // دریافت آمار کلی سیستم
    async getSystemStats() {
        try {
            // تعداد کاربران
            const { count: userCount, error: userError } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true });
            
            if (userError) throw userError;
            
            // مجموع SOD
            const { data: sodData, error: sodError } = await supabaseClient
                .from('game_data')
                .select('sod_balance');
            
            if (sodError) throw sodError;
            
            const totalSOD = sodData.reduce((sum, item) => sum + (item.sod_balance || 0), 0);
            
            // مجموع USDT
            const { data: usdtData, error: usdtError } = await supabaseClient
                .from('game_data')
                .select('usdt_balance');
            
            if (usdtError) throw usdtError;
            
            const totalUSDT = usdtData.reduce((sum, item) => sum + (item.usdt_balance || 0), 0);
            
            // مجموع استخراج
            const { data: minedData, error: minedError } = await supabaseClient
                .from('game_data')
                .select('total_mined');
            
            if (minedError) throw minedError;
            
            const totalMined = minedData.reduce((sum, item) => sum + (item.total_mined || 0), 0);
            
            return {
                userCount: userCount || 0,
                totalSOD,
                totalUSDT,
                totalMined,
                averageSOD: totalSOD / (userCount || 1),
                averageMined: totalMined / (userCount || 1)
            };
            
        } catch (error) {
            console.error('❌ خطا در دریافت آمار سیستم:', error);
            return null;
        }
    }
};

// ==================== توابع کمکی ====================

async function testConnection() {
    const isConnected = await GameDB.testConnection();
    
    if (!isConnected) {
        console.warn('⚠️ اتصال به دیتابیس برقرار نیست. حالت آفلاین فعال می‌شود.');
        localStorage.setItem('sodmax_offline_mode', 'true');
    } else {
        localStorage.removeItem('sodmax_offline_mode');
    }
    
    return isConnected;
}

function showFallbackMessage() {
    console.warn('⚠️ Supabase در دسترس نیست. حالت آفلاین فعال می‌شود.');
    
    // نمایش پیام به کاربر (اگر در صفحه اصلی هستیم)
    if (document.getElementById('authOverlay')) {
        setTimeout(() => {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                background: rgba(255, 107, 53, 0.1);
                border: 1px solid rgba(255, 107, 53, 0.3);
                border-radius: 8px;
                padding: 10px 15px;
                margin-top: 15px;
                font-size: 12px;
                color: #FF6B35;
            `;
            messageDiv.innerHTML = '⚠️ حالت آفلاین - داده‌ها موقتاً در مرورگر ذخیره می‌شوند';
            
            const authContainer = document.querySelector('.auth-container');
            if (authContainer) {
                authContainer.appendChild(messageDiv);
            }
        }, 1000);
    }
}

// ==================== حالت آفلاین ====================

const OfflineDB = {
    // ذخیره در localStorage
    saveUserData(userId, data) {
        try {
            const key = `sodmax_user_${userId}`;
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ خطا در ذخیره آفلاین:', error);
            return false;
        }
    },
    
    // بارگذاری از localStorage
    loadUserData(userId) {
        try {
            const key = `sodmax_user_${userId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ خطا در بارگذاری آفلاین:', error);
            return null;
        }
    },
    
    // دریافت تمام کاربران آفلاین
    getAllUsers() {
        const users = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('sodmax_user_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.email) {
                        users.push(data);
                    }
                } catch (error) {
                    console.warn('⚠️ خطا در خواندن کاربر آفلاین:', key);
                }
            }
        }
        
        return users;
    }
};

// ==================== قرار دادن در window ====================

window.GameDB = GameDB;
window.OfflineDB = OfflineDB;
window.testDBConnection = testConnection;

console.log('✅ پیکربندی Supabase بارگذاری شد');

// تست خودکار اتصال
setTimeout(testConnection, 2000);
