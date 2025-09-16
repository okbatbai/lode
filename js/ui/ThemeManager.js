// Theme Management with Dark Mode
export class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = 'light';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }

    initialize() {
        this.loadTheme();
        this.bindEvents();
        this.watchSystemTheme();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'auto';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        if (!this.themes.includes(theme)) return;

        this.currentTheme = theme;
        localStorage.setItem('theme', theme);

        if (theme === 'auto') {
            this.applySystemTheme();
        } else {
            this.applyTheme(theme);
        }

        this.updateThemeToggle();
    }

    applyTheme(theme) {
        document.documentElement.className = theme === 'dark' ? 'dark-mode' : '';
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#1a1a2e' : '#667eea';
        }
    }

    applySystemTheme() {
        const isDark = this.mediaQuery.matches;
        this.applyTheme(isDark ? 'dark' : 'light');
    }

    bindEvents() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    updateThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        const icons = {
            'light': 'fa-sun',
            'dark': 'fa-moon',
            'auto': 'fa-adjust'
        };

        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = `fas ${icons[this.currentTheme]}`;
        }

        toggleBtn.title = `Theme: ${this.currentTheme}`;
    }

    watchSystemTheme() {
        this.mediaQuery.addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applySystemTheme();
            }
        });
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.mediaQuery.matches ? 'dark' : 'light';
        }
        return this.currentTheme;
    }
}