// Formatting Utilities
export class Formatter {
    static money(amount, options = {}) {
        const {
            currency = 'VND',
            locale = 'vi-VN',
            decimals = 0,
            compact = false
        } = options;

        if (compact) {
            return this.compactNumber(amount, currency);
        }

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    }

    static compactNumber(num, suffix = '') {
        const units = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
        
        if (tier === 0) return num + suffix;
        
        const scale = Math.pow(10, tier * 3);
        const scaled = num / scale;
        
        return scaled.toFixed(1).replace(/\.0$/, '') + units[tier] + suffix;
    }

    static number(num, options = {}) {
        const {
            locale = 'vi-VN',
            decimals = 0
        } = options;

        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    static date(date, options = {}) {
        const {
            locale = 'vi-VN',
            format = 'short'
        } = options;

        const d = new Date(date);
        
        if (format === 'relative') {
            return this.relativeTime(d);
        }

        const formatOptions = {
            short: { dateStyle: 'short' },
            medium: { dateStyle: 'medium' },
            long: { dateStyle: 'long' },
            full: { dateStyle: 'full' },
            custom: options.custom || { dateStyle: 'short' }
        };

        return new Intl.DateTimeFormat(locale, formatOptions[format]).format(d);
    }

    static relativeTime(date) {
        const now = new Date();
        const d = new Date(date);
        const diffMs = now - d;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay < 7) return `${diffDay} ngày trước`;
        if (diffDay < 30) return `${Math.floor(diffDay / 7)} tuần trước`;
        if (diffDay < 365) return `${Math.floor(diffDay / 30)} tháng trước`;
        return `${Math.floor(diffDay / 365)} năm trước`;
    }

    static percentage(value, total, decimals = 1) {
        if (total === 0) return '0%';
        const percent = (value / total) * 100;
        return `${percent.toFixed(decimals)}%`;
    }

    static fileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    static duration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ngày`;
        if (hours > 0) return `${hours} giờ`;
        if (minutes > 0) return `${minutes} phút`;
        return `${seconds} giây`;
    }

    static phoneNumber(phone, format = 'vietnam') {
        const cleaned = phone.replace(/\D/g, '');
        
        if (format === 'vietnam') {
            if (cleaned.length === 10) {
                return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
            }
            if (cleaned.length === 11) {
                return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
            }
        }
        
        return phone;
    }

    static truncate(str, length = 50, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }

    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static titleCase(str) {
        return str.replace(/\w\S*/g, txt => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    static slug(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    static padNumber(num, length = 2) {
        return String(num).padStart(length, '0');
    }

    static ordinal(num) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = num % 100;
        return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }

    static pluralize(count, singular, plural = null) {
        if (count === 1) return `${count} ${singular}`;
        return `${count} ${plural || singular + 's'}`;
    }
}