// ==================== supabase-config.js ====================
// فایل پیکربندی Supabase برای SODmAX Pro

console.log('🔧 بارگذاری پیکربندی Supabase...');

// تنظیمات Supabase (از پروژه شما)
const SUPABASE_URL = 'https://utnqkgbmdjilvbkwjqef.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bnFrZ2JtZGppbHZia3dqcWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMzIwMDksImV4cCI6MjA1MDgwODAwOX0.E0rR6NfU4C_v6DSLPdPieC4uQQa6K4T0w8Jj3K0Y6eE';

// ایجاد Supabase Client
let supabaseClient = null;

try {
    if (window.supabase) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase Client ایجاد شد');
    } else {
        console.error('❌ کتابخانه Supabase بارگذاری نشده است');
    }
} catch (error) {
    console.error('❌ خطا در ایجاد Supabase Client:', error);
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
            
            return !error;
        } catch (error) {
            console.error('❌ خطا در تست اتصال:', error);
            return false;
        }
    },
    
    // دریافت یا ایجاد کاربر
    async getOrCreateUser(userId, email) {
        try {
            // اول سعی کن کاربر را پیدا کنی
            const { data: existingUser, error: fetchError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (!fetchError && existingUser) {
                return { data: existingUser, error: null };
            }
            
            // اگر کاربر وجود نداشت، ایجاد کن
            const newUser = {
                id: userId,
                email: email,
                full_name: email.split('@')[0],
                register_date: new Date().toLocaleDateString('fa-IR'),
                invite_code: 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                is_admin: email.toLowerCase() === 'hamyarhf@gmail.com'
            };
            
            const { data: createdUser, error: createError } = await supabaseClient
                .from('users')
                .insert([newUser])
                .select()
                .single();
            
            if (createError) {
                console.error('❌ خطا در ایجاد کاربر:', createError);
                return { data: null, error: createError };
            }
            
            return { data: createdUser, error: null };
            
        } catch (error) {
            console.error('❌ خطا در getOrCreateUser:', error);
            return { data: null, error: error };
        }
    },
    
    // دریافت یا ایجاد اطلاعات بازی
    async getOrCreateGameData(userId) {
        try {
            // اول سعی کن اطلاعات بازی را پیدا کنی
            const { data: existingData, error: fetchError } = await supabaseClient
                .from('game_data')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (!fetchError && existingData) {
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
                boost_end_time: 0,
                created_at: new Date().toISOString()
            };
            
            const { data: createdData, error: createError } = await supabaseClient
                .from('game_data')
                .insert([newGameData])
                .select()
                .single();
            
            if (createError) {
                console.error('❌ خطا در ایجاد اطلاعات بازی:', createError);
                return { data: null, error: createError };
            }
            
            return { data: createdData, error: null };
            
        } catch (error) {
            console.error('❌ خطا در getOrCreateGameData:', error);
            return { data: null, error: error };
        }
    },
    
    // آپدیت اطلاعات بازی
    async updateGameData(userId, updates) {
        try {
            const { error } = await supabaseClient
                .from('game_data')
                .update(updates)
                .eq('user_id', userId);
            
            if (error) {
                console.error('❌ خطا در آپدیت اطلاعات بازی:', error);
                return { success: false, error };
            }
            
            return { success: true, error: null };
            
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
            
            const { error } = await supabaseClient
                .from('transactions')
                .insert([transaction]);
            
            if (error) {
                console.error('❌ خطا در ثبت تراکنش:', error);
                return { success: false, error };
            }
            
            return { success: true, error: null };
            
        } catch (error) {
            console.error('❌ خطا در addTransaction:', error);
            return { success: false, error };
        }
    }
};

// قرار دادن در window برای دسترسی جهانی
window.GameDB = GameDB;

console.log('✅ پیکربندی Supabase بارگذاری شد');
