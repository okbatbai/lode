// Main Application Entry Point
import { Config } from './config/constants.js';
import { DataManager } from './core/DataManager.js';
import { StorageManager } from './core/StorageManager.js';
import { EventBus } from './core/EventBus.js';
import { UIController } from './ui/UIController.js';
import { TabManager } from './ui/TabManager.js';
import { NotificationManager } from './ui/NotificationManager.js';
import { ThemeManager } from './ui/ThemeManager.js';
import { LotteryAPI } from './modules/LotteryAPI.js';
import { Calculator } from './modules/Calculator.js';
import { registerServiceWorker } from './utils/helpers.js';

class LodeApp {
    constructor() {
        this.config = Config;
        this.eventBus = new EventBus();
        this.storage = new StorageManager();
        this.dataManager = new DataManager(this.storage, this.eventBus);
        this.notification = new NotificationManager();
        this.theme = new ThemeManager();
        this.lotteryAPI = new LotteryAPI();
        this.calculator = new Calculator(this.config);
        
        this.ui = new UIController({
            dataManager: this.dataManager,
            eventBus: this.eventBus,
            notification: this.notification
        });
        
        this.tabManager = new TabManager(this.eventBus);
    }

    async initialize() {
        try {
            // Show loading screen
            this.showLoading(true);

            // Register service worker for PWA
            await registerServiceWorker();

            // Load saved data
            await this.dataManager.loadData();

            // Initialize UI
            await this.ui.initialize();

            // Setup event listeners
            this.setupEventListeners();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Initialize theme
            this.theme.initialize();

            // Check for updates
            this.checkForUpdates();

            // Hide loading screen
            this.showLoading(false);

            // Show welcome message
            this.notification.show('Chào mừng bạn đến với Lô Đề Pro!', 'success');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.notification.show('Lỗi khởi động ứng dụng!', 'error');
        }
    }

    setupEventListeners() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.notification.show('Đã xảy ra lỗi không mong muốn!', 'error');
        });

        // Handle online/offline
        window.addEventListener('online', () => {
            this.notification.show('Đã kết nối mạng', 'success');
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.notification.show('Mất kết nối mạng', 'warning');
        });

        // Auto-save
        setInterval(() => {
            this.autoSave();
        }, this.config.AUTO_SAVE_INTERVAL);

        // Custom events
        this.eventBus.on('data:changed', () => {
            this.ui.refresh();
            this.setSyncStatus('pending');
        });

        this.eventBus.on('tab:changed', (tabName) => {
            this.handleTabChange(tabName);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }

            // Ctrl/Cmd + N: New entry
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.ui.showQuickInput();
            }

            // Ctrl/Cmd + F: Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.ui.focusSearch();
            }

            // Ctrl/Cmd + Z: Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                this.dataManager.undo();
            }

            // Ctrl/Cmd + Y: Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.dataManager.redo();
            }

            // ESC: Close modals
            if (e.key === 'Escape') {
                this.ui.closeAllModals();
            }

            // Alt + 1-4: Switch tabs
            if (e.altKey && e.key >= '1' && e.key <= '4') {
                const tabIndex = parseInt(e.key) - 1;
                this.tabManager.switchToIndex(tabIndex);
            }
        });
    }

    handleTabChange(tabName) {
        switch (tabName) {
            case 'calculation':
                this.loadCalculationTab();
                break;
            case 'statistics':
                this.loadStatisticsTab();
                break;
            case 'rules':
                this.loadRulesTab();
                break;
            default:
                this.loadManagementTab();
        }
    }

    async loadCalculationTab() {
        // Lazy load calculation module
        const { CalculationModule } = await import('./modules/CalculationModule.js');
        const calcModule = new CalculationModule(this.dataManager, this.lotteryAPI);
        window.app.calcModule = calcModule;
        calcModule.render();
    }

    async loadStatisticsTab() {
        // Lazy load statistics module
        const { StatisticsModule } = await import('./modules/StatisticsModule.js');
        const statsModule = new StatisticsModule(this.dataManager);
        window.app.statsModule = statsModule;
        statsModule.render();
    }

    async loadRulesTab() {
        // Lazy load rules module
        const { RulesModule } = await import('./modules/RulesModule.js');
        const rulesModule = new RulesModule(this.dataManager);
        window.app.rulesModule = rulesModule;
        rulesModule.render();
    }

    loadManagementTab() {
        this.ui.renderManagementTab();
    }

    async autoSave() {
        try {
            await this.dataManager.save();
            this.setSyncStatus('saved');
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.setSyncStatus('error');
        }
    }

    async save() {
        try {
            await this.dataManager.save();
            this.notification.show('Đã lưu dữ liệu!', 'success');
            this.setSyncStatus('saved');
        } catch (error) {
            console.error('Save failed:', error);
            this.notification.show('Lỗi khi lưu dữ liệu!', 'error');
            this.setSyncStatus('error');
        }
    }

    setSyncStatus(status) {
        const statusEl = document.getElementById('sync-status');
        if (!statusEl) return;

        const statusConfig = {
            'saved': { icon: 'fa-check-circle', text: 'Đã lưu', class: 'saved' },
            'pending': { icon: 'fa-clock', text: 'Đang lưu...', class: 'pending' },
            'error': { icon: 'fa-exclamation-circle', text: 'Lỗi', class: 'error' }
        };

        const config = statusConfig[status] || statusConfig['saved'];
        statusEl.innerHTML = `<i class="fas ${config.icon}"></i> ${config.text}`;
        statusEl.className = `sync-status ${config.class}`;
    }

    async syncData() {
        // Implement cloud sync if needed
        console.log('Syncing data...');
    }

    checkForUpdates() {
        // Check for app updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.notification.show('Có bản cập nhật mới! Tải lại trang để cập nhật.', 'info');
            });
        }
    }

    showLoading(show) {
        const loadingScreen = document.getElementById('loading-screen');
        const appContainer = document.getElementById('app');
        
        if (show) {
            loadingScreen.style.display = 'flex';
            appContainer.style.display = 'none';
        } else {
            loadingScreen.style.display = 'none';
            appContainer.style.display = 'block';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LodeApp();
    window.app.initialize();
});