// فایل: supabase.js
console.log('🔧 Loading Supabase...');

// این متغیرها بعداً با مقادیر واقعی پر می‌شوند
const SUPABASE_CONFIG = {
    url: '',
    key: '',
    isInitialized: false
};

// تابع برای تنظیم کانفیگ
function setSupabaseConfig(url, key) {
    SUPABASE_CONFIG.url = url;
    SUPABASE_CONFIG.key = key;
    
    try {
        // ایجاد کلاینت Supabase
        window.supabaseClient = window.supabase.createClient(url, key);
        SUPABASE_CONFIG.isInitialized = true;
        
        console.log('✅ Supabase configured successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to configure Supabase:', error);
        return false;
    }
}

// تابع برای تست اتصال
async function testConnection() {
    if (!SUPABASE_CONFIG.isInitialized) {
        console.warn('⚠️ Supabase not initialized');
        return false;
    }
    
    try {
        const { data, error } = await window.supabaseClient.auth.getSession();
        if (error) throw error;
        
        console.log('✅ Supabase connection test passed');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
    }
}

// توابع کمکی برای بازی
const GameDB = {
    // دریافت اطلاعات کاربر
    async getUser(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    },
    
    // دریافت اطلاعات بازی
    async getGameData(userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('game_data')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    },
    
    // آپدیت اطلاعات بازی
    async updateGameData(userId, updates) {
        try {
            const { data, error } = await window.supabaseClient
                .from('game_data')
                .update(updates)
                .eq('user_id', userId)
                .select()
                .single();
            
            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    },
    
    // افزودن تراکنش
    async addTransaction(userId, description, amount, type = 'sod') {
        try {
            const { data, error } = await window.supabaseClient
                .from('transactions')
                .insert([{
                    user_id: userId,
                    description: description,
                    amount: amount,
                    type: type,
                    created_at: new Date().toISOString()
                }]);
            
            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    },
    
    // دریافت لیدربرد
    async getLeaderboard(timeframe = 'daily', limit = 10) {
        try {
            const { data, error } = await window.supabaseClient
                .from('game_data')
                .select(`
                    *,
                    users!inner(full_name, email)
                `)
                .order('today_earnings', { ascending: false })
                .limit(limit);
            
            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    }
};

// صادر کردن برای استفاده جهانی
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.setSupabaseConfig = setSupabaseConfig;
window.testConnection = testConnection;
window.GameDB = GameDB;

console.log('🎮 Game database helpers loaded');
