// Security Utilities
export class Security {
    static sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static validateInput(input, rules) {
        const errors = [];

        if (rules.required && !input) {
            errors.push('Field is required');
        }

        if (rules.minLength && input.length < rules.minLength) {
            errors.push(`Minimum length is ${rules.minLength}`);
        }

        if (rules.maxLength && input.length > rules.maxLength) {
            errors.push(`Maximum length is ${rules.maxLength}`);
        }

        if (rules.pattern && !rules.pattern.test(input)) {
            errors.push('Invalid format');
        }

        if (rules.min !== undefined && parseFloat(input) < rules.min) {
            errors.push(`Minimum value is ${rules.min}`);
        }

        if (rules.max !== undefined && parseFloat(input) > rules.max) {
            errors.push(`Maximum value is ${rules.max}`);
        }

        if (rules.custom) {
            const customError = rules.custom(input);
            if (customError) errors.push(customError);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    static generateHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    static encrypt(text, key) {
        // Simple XOR encryption for demo
        // In production, use proper encryption library
        return text.split('').map((char, i) => 
            String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
        ).join('');
    }

    static decrypt(encrypted, key) {
        // XOR is reversible
        return this.encrypt(encrypted, key);
    }

    static generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        
        for (let i = 0; i < length; i++) {
            token += chars[array[i] % chars.length];
        }
        
        return token;
    }

    static isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    static cleanObject(obj) {
        const cleaned = {};
        
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value !== null && value !== undefined && value !== '') {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    cleaned[key] = this.cleanObject(value);
                } else {
                    cleaned[key] = value;
                }
            }
        });
        
        return cleaned;
    }

    static rateLimiter(func, limit = 10, window = 60000) {
        const calls = [];
        
        return function(...args) {
            const now = Date.now();
            
            // Remove old calls outside the window
            while (calls.length > 0 && calls[0] < now - window) {
                calls.shift();
            }
            
            if (calls.length >= limit) {
                throw new Error('Rate limit exceeded');
            }
            
            calls.push(now);
            return func.apply(this, args);
        };
    }
}