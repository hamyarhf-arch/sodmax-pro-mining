// فایل: supabase-config.js
// تنظیمات Supabase برای SODmAX Pro

console.log('🚀 Loading SODmAX Supabase configuration...');

const SUPABASE_CONFIG = {
    URL: 'https://utnqkgbmdjilvbkwjqef.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bnFrZ2JtZGppbHZia3dqcWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDM3ODUsImV4cCI6MjA4MTQ3OTc4NX0.-PA0KAaSuQ-ZAJZLdVNe-AafE5fHf8CA5R4uR3TKGDc'
};

// ایجاد کلاینت Supabase
try {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_CONFIG.URL, 
        SUPABASE_CONFIG.ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
    
    console.log('✅ Supabase client created successfully');
} catch (error) {
    console.error('❌ Error creating Supabase client:', error);
}

// توابع کمکی دیتابیس
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
            console.error('Error getting user:', error);
            return { data: null, error };
        }
    },
    
    // دریافت یا ایجاد کاربر
    async getOrCreateUser(userId, email) {
        try {
            // اول بررسی کن کاربر وجود دارد یا نه
            let { data: user, error: userError } = await this.getUser(userId);
            
            if (userError || !user) {
                console.log('👤 Creating new user:', email);
                
                // ایجاد کاربر جدید
                const { data, error } = await window.supabaseClient
                    .from('users')
                    .insert([{
                        id: userId,
                        email: email,
                        full_name: email.split('@')[0],
                        register_date: new Date().toLocaleDateString('fa-IR'),
                        invite_code: 'INV' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Error creating user:', error);
                    return { data: null, error };
                }
                
                console.log('✅ New user created:', data.email);
                return { data, error: null };
            }
            
            console.log('✅ User found:', user.email);
            return { data: user, error: null };
            
        } catch (error) {
            console.error('Error in getOrCreateUser:', error);
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
            console.error('Error getting game data:', error);
            return { data: null, error };
        }
    },
    
    // ایجاد یا دریافت اطلاعات بازی
    async getOrCreateGameData(userId) {
        try {
            let { data: gameData, error: gameError } = await this.getGameData(userId);
            
            if (gameError || !gameData) {
                console.log('🎮 Creating new game data for user:', userId);
                
                // ایجاد داده‌های بازی جدید
                const { data, error } = await window.supabaseClient
                    .from('game_data')
                    .insert([{
                        user_id: userId,
                        sod_balance: 1000000, // هدیه ثبت نام
                        usdt_balance: 0,
                        user_level: 1,
                        total_mined: 1000000,
                        today_earnings: 0,
                        mining_power: 10,
                        usdt_progress: 0,
                        boost_active: false,
                        last_active: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Error creating game data:', error);
                    return { data: null, error };
                }
                
                console.log('✅ New game data created');
                return { data, error: null };
            }
            
            console.log('✅ Game data found');
            return { data: gameData, error: null };
            
        } catch (error) {
            console.error('Error in getOrCreateGameData:', error);
            return { data: null, error };
        }
    },
    
    // آپدیت اطلاعات بازی
    async updateGameData(userId, updates) {
        try {
            const { data, error } = await window.supabaseClient
                .from('game_data')
                .update({
                    ...updates,
                    last_active: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .select()
                .single();
            
            return { data, error };
        } catch (error) {
            console.error('Error updating game data:', error);
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
            console.error('Error adding transaction:', error);
            return { data: null, error };
        }
    },
    
    // دریافت تراکنش‌ها
    async getTransactions(userId, limit = 10) {
        try {
            const { data, error } = await window.supabaseClient
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            return { data, error };
        } catch (error) {
            console.error('Error getting transactions:', error);
            return { data: null, error };
        }
    },
    
    // دریافت لیدربرد
    async getLeaderboard(timeframe = 'daily', limit = 20) {
        try {
            let orderBy = 'today_earnings';
            if (timeframe === 'weekly' || timeframe === 'monthly') {
                orderBy = 'total_mined';
            }
            
            const { data, error } = await window.supabaseClient
                .from('game_data')
                .select(`
                    *,
                    users!inner(full_name, email, register_date, invite_code)
                `)
                .order(orderBy, { ascending: false })
                .limit(limit);
            
            return { data, error };
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { data: null, error };
        }
    },
    
    // دریافت تمام کاربران (برای ادمین)
    async getAllUsers(limit = 100) {
        try {
            const { data, error } = await window.supabaseClient
                .from('users')
                .select(`
                    *,
                    game_data!left(sod_balance, usdt_balance, user_level, total_mined, today_earnings)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            return { data, error };
        } catch (error) {
            console.error('Error getting all users:', error);
            return { data: null, error };
        }
    },
    
    // آپدیت کاربر (برای ادمین)
    async updateUser(userId, updates) {
        try {
            const { data, error } = await window.supabaseClient
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
            
            return { data, error };
        } catch (error) {
            console.error('Error updating user:', error);
            return { data: null, error };
        }
    },
    
    // تست اتصال
    async testConnection() {
        try {
            const { data, error } = await window.supabaseClient
                .from('users')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            
            console.log('✅ Database connection test passed');
            return true;
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
            return false;
        }
    }
};

// صادر کردن برای استفاده جهانی
window.GameDB = GameDB;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

console.log('🎮 SODmAX database helpers loaded successfully!');
