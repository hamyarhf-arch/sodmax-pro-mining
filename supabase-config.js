// فایل: supabase-config.js
// تنظیمات Supabase - این فایل را جداگانه نگه دارید

const SUPABASE_CONFIG = {
    URL: 'https://utnqkgbmdjilvbkwjqef.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bnFrZ2JtZGppbHZia3dqcWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDM3ODUsImV4cCI6MjA4MTQ3OTc4NX0.-PA0KAaSuQ-ZAJZLdVNe-AafE5fHf8CA5R4uR3TKGDc'
};

// ایجاد کلاینت Supabase
const supabaseClient = window.supabase.createClient(
    SUPABASE_CONFIG.URL, 
    SUPABASE_CONFIG.ANON_KEY
);

// توابع کمکی
const GameDB = {
    // دریافت اطلاعات کاربر
    async getUser(userId) {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        return { data, error };
    },
    
    // دریافت یا ایجاد کاربر
    async getOrCreateUser(userId, email) {
        let user = await this.getUser(userId);
        
        if (!user.data) {
            // ایجاد کاربر جدید
            const { data, error } = await supabaseClient
                .from('users')
                .insert([{
                    id: userId,
                    email: email,
                    full_name: email.split('@')[0],
                    register_date: new Date().toLocaleDateString('fa-IR'),
                    invite_code: 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            return { data, error };
        }
        
        return user;
    },
    
    // دریافت اطلاعات بازی
    async getGameData(userId) {
        const { data, error } = await supabaseClient
            .from('game_data')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        return { data, error };
    },
    
    // ایجاد یا دریافت اطلاعات بازی
    async getOrCreateGameData(userId) {
        let gameData = await this.getGameData(userId);
        
        if (!gameData.data) {
            // ایجاد داده‌های بازی جدید
            const { data, error } = await supabaseClient
                .from('game_data')
                .insert([{
                    user_id: userId,
                    sod_balance: 1000000,
                    usdt_balance: 0,
                    user_level: 1,
                    total_mined: 1000000,
                    today_earnings: 0,
                    mining_power: 10,
                    usdt_progress: 0,
                    last_active: new Date().toISOString(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            return { data, error };
        }
        
        return gameData;
    },
    
    // آپدیت اطلاعات بازی
    async updateGameData(userId, updates) {
        const { data, error } = await supabaseClient
            .from('game_data')
            .update({
                ...updates,
                last_active: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single();
        
        return { data, error };
    },
    
    // افزودن تراکنش
    async addTransaction(userId, description, amount, type = 'sod') {
        const { data, error } = await supabaseClient
            .from('transactions')
            .insert([{
                user_id: userId,
                description: description,
                amount: amount,
                type: type,
                created_at: new Date().toISOString()
            }]);
        
        return { data, error };
    },
    
    // دریافت تراکنش‌ها
    async getTransactions(userId, limit = 10) {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        return { data, error };
    },
    
    // دریافت لیدربرد
    async getLeaderboard(timeframe = 'daily', limit = 20) {
        let orderBy = 'today_earnings';
        
        if (timeframe === 'weekly') orderBy = 'total_mined';
        if (timeframe === 'monthly') orderBy = 'total_mined';
        
        const { data, error } = await supabaseClient
            .from('game_data')
            .select(`
                *,
                users!inner(full_name, email, register_date)
            `)
            .order(orderBy, { ascending: false })
            .limit(limit);
        
        return { data, error };
    },
    
    // دریافت تمام کاربران (برای ادمین)
    async getAllUsers(limit = 100) {
        const { data, error } = await supabaseClient
            .from('users')
            .select(`
                *,
                game_data!left(sod_balance, usdt_balance, user_level, total_mined)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        return { data, error };
    },
    
    // آپدیت کاربر (برای ادمین)
    async updateUser(userId, updates) {
        const { data, error } = await supabaseClient
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        return { data, error };
    },
    
    // آپدیت بازی کاربر (برای ادمین)
    async updateUserGameData(userId, updates) {
        const { data, error } = await supabaseClient
            .from('game_data')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();
        
        return { data, error };
    }
};

// صادر کردن برای استفاده جهانی
window.supabaseClient = supabaseClient;
window.GameDB = GameDB;

console.log('✅ Supabase configured successfully');
