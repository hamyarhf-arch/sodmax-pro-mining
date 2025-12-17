// ==================== supabase-config.js ====================
// فایل پیکربندی Supabase برای SODmAX Pro - نسخه اصلاح شده

console.log('🔧 بارگذاری پیکربندی Supabase...');

// تنظیمات Supabase
const SUPABASE_URL = 'https://utnqkgbmdjilvbkwjqef.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bnFrZ2JtZGppbHZia3dqcWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDM3ODUsImV4cCI6MjA4MTQ3OTc4NX0.-PA0KAaSuQ-ZAJZLdVNe-AafE5fHf8CA5R4uR3TKGDc';

// منتظر بارگذاری کامل صفحه می‌مانیم
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeSupabase, 500);
});

// ==================== تابع اصلی بارگذاری ====================

async function initializeSupabase() {
    try {
        console.log('🔄 شروع بارگذاری Supabase...');
        
        // اگر supabase موجود نیست، بارگذاری کن
        if (typeof supabase === 'undefined') {
            console.log('📚 در حال بارگذاری کتابخانه Supabase...');
            await loadSupabaseLibrary();
        }
        
        // ایجاد Supabase Client
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase Client ایجاد شد');
        
        // تست اتصال
        await testConnection();
        
        // فعال کردن توابع auth
        enableAuthFunctions();
        
    } catch (error) {
        console.error('❌ خطا در بارگذاری Supabase:', error);
        showFallbackMessage();
    }
}

// ==================== توابع کمکی ====================

function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof supabase !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.crossOrigin = 'anonymous';
        
        script.onload = function() {
            console.log('✅ کتابخانه Supabase بارگذاری شد');
            resolve();
        };
        
        script.onerror = function() {
            console.error('❌ خطا در بارگذاری کتابخانه Supabase');
            reject(new Error('Failed to load Supabase library'));
        };
        
        document.head.appendChild(script);
    });
}

function enableAuthFunctions() {
    // اضافه کردن توابع auth به window
    window.supabaseAuth = window.supabaseClient.auth;
    
    // اضافه کردن توابع ثبت‌نام و ورود
    window.registerUser = async function(email, password) {
        try {
            const { data, error } = await window.supabaseAuth.signUp({
                email: email,
                password: password
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطا در ثبت‌نام:', error);
            return { success: false, error };
        }
    };
    
    window.loginUser = async function(email, password) {
        try {
            const { data, error } = await window.supabaseAuth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ خطا در ورود:', error);
            return { success: false, error };
        }
    };
    
    console.log('✅ توابع auth فعال شدند');
}

// ==================== توابع دیتابیس ====================

const GameDB = {
    // تست اتصال
    async testConnection() {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase Client هنوز ایجاد نشده است');
            }
            
            const { data, error } = await window.supabaseClient
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
    
    // بقیه توابع بدون تغییر...
    // ... [بقیه توابع GameDB مانند قبل]
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
    
    // ایجاد توابع جعلی برای جلوگیری از خطا
    window.supabaseAuth = {
        signUp: async () => ({ success: false, error: 'آفلاین مود' }),
        signInWithPassword: async () => ({ success: false, error: 'آفلاین مود' })
    };
    
    // نمایش پیام به کاربر
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
            messageDiv.innerHTML = '⚠️ حالت آفلاین فعال شد. داده‌ها در مرورگر ذخیره می‌شوند.<br><small>وقتی آنلاین شوید، داده‌ها همگام‌سازی می‌شوند.</small>';
            
            const authContainer = document.querySelector('.auth-container');
            if (authContainer) {
                authContainer.appendChild(messageDiv);
            }
        }, 1000);
    }
}

// ==================== قرار دادن در window ====================

window.GameDB = GameDB;
window.OfflineDB = OfflineDB;
window.testDBConnection = testConnection;

console.log('✅ پیکربندی Supabase بارگذاری شد');
