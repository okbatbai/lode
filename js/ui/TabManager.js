// Tab Management
export class TabManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentTab = 'management';
        this.tabs = ['management', 'calculation', 'statistics', 'rules'];
        this.initialize();
    }

    initialize() {
        this.bindTabEvents();
        this.checkUrlParams();
    }

    bindTabEvents() {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        if (!this.tabs.includes(tabName)) return;
        if (tabName === this.currentTab) return;

        // Update UI
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;
        
        // Update URL
        this.updateUrl(tabName);
        
        // Emit event
        this.eventBus.emit('tab:changed', tabName);
    }

    switchToIndex(index) {
        if (index >= 0 && index < this.tabs.length) {
            this.switchTab(this.tabs[index]);
        }
    }

    updateUrl(tabName) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
    }

    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        
        if (tab && this.tabs.includes(tab)) {
            this.switchTab(tab);
        }
    }

    getCurrentTab() {
        return this.currentTab;
    }
}