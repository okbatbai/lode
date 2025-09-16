// Application Configuration
export const Config = {
    APP_NAME: 'Lô Đề Pro',
    VERSION: '2.0.0',
    
    // API Configuration
    API: {
        BASE_URL: 'https://lode.sontruog.cloud',
        TIMEOUT: 10000,
        RETRY_ATTEMPTS: 3
    },
    
    // Storage Configuration
    STORAGE: {
        PREFIX: 'lode_pro_',
        VERSION: 1,
        AUTO_SAVE_INTERVAL: 30000, // 30 seconds
        MAX_HISTORY_SIZE: 100,
        MAX_UNDO_STACK: 50
    },
    
    // UI Configuration
    UI: {
        THEME_DEFAULT: 'auto',
        NOTIFICATION_DURATION: 3000,
        MAX_NOTIFICATIONS: 5,
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300
    },
    
    // Data Configuration
    DATA: {
        TYPES: ['lo', 'de', 'xien', 'cang3'],
        MAX_NUMBER: 99,
        MAX_XIEN_NUMBERS: 4,
        MIN_VALUE: 1,
        MAX_VALUE: 1000000000
    },
    
    // Calculation Configuration
    CALCULATION: {
        DEFAULT_RATES: {
            lo: { xac: 21.75, win: 80 },
            de: { xac: 0.83, win: 80 },
            xien: { 
                xac: 0.65, 
                win: { 2: 11, 3: 45, 4: 140 },
                nhay: true 
            },
            cang3: { xac: 0.7, win: 400 }
        }
    },
    
    // Export Configuration
    EXPORT: {
        FORMATS: ['json', 'csv', 'excel', 'pdf'],
        MAX_EXPORT_ROWS: 10000,
        DATE_FORMAT: 'DD/MM/YYYY',
        CURRENCY_FORMAT: 'vi-VN'
    },
    
    // Feature Flags
    FEATURES: {
        DARK_MODE: true,
        PWA: true,
        CLOUD_SYNC: false,
        ADVANCED_STATISTICS: true,
        AI_PREDICTIONS: false
    }
};