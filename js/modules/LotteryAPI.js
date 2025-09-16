// Lottery API Service
export class LotteryAPI {
    constructor() {
        this.baseUrl = 'https://lode.sontruog.cloud/lottery-proxy-sheets-v3.php';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchResult(date) {
        // Check cache first
        const cacheKey = `lottery-${date}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(`${this.baseUrl}?date=${date}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data && data.success) {
                const result = this.parseAPIResponse(data);
                this.setCache(cacheKey, result);
                return result;
            } else {
                throw new Error(data.message || 'Failed to fetch lottery result');
            }

        } catch (error) {
            console.error('Lottery API error:', error);
            
            // Try alternative date format
            if (error.message.includes('Không tìm thấy')) {
                const altDate = this.convertDateFormat(date);
                return this.fetchResult(altDate);
            }
            
            throw error;
        }
    }

    parseAPIResponse(data) {
        if (!data.t || !data.t.issueList || data.t.issueList.length === 0) {
            throw new Error('Invalid API response structure');
        }

        const issue = data.t.issueList[0];
        const detailArray = JSON.parse(issue.detail);

        // Parse to standard format
        const result = {
            date: issue.turnNum,
            specialPrize: detailArray[0] || '',
            firstPrize: detailArray[1] || '',
            prizes: {
                second: [],
                third: [],
                fourth: [],
                fifth: [],
                sixth: [],
                seventh: []
            },
            allNumbers: []
        };

        // Parse remaining prizes
        let currentIndex = 2;
        const prizeStructure = [2, 6, 4, 6, 3, 4]; // Number of prizes for each level
        const prizeNames = ['second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];

        prizeNames.forEach((name, idx) => {
            const count = prizeStructure[idx];
            for (let i = 0; i < count && currentIndex < detailArray.length; i++) {
                const prize = detailArray[currentIndex];
                if (prize) {
                    if (typeof prize === 'string' && prize.includes(',')) {
                        result.prizes[name].push(...prize.split(',').map(p => p.trim()));
                    } else {
                        result.prizes[name].push(prize.toString());
                    }
                }
                currentIndex++;
            }
        });

        // Collect all 2-digit numbers
        result.allNumbers = this.extractAllNumbers(result);

        return result;
    }

    extractAllNumbers(result) {
        const numbers = [];
        
        // Add special prize (last 2 digits)
        if (result.specialPrize) {
            numbers.push(result.specialPrize.slice(-2));
        }

        // Add all other prizes (last 2 digits)
        [result.firstPrize, ...Object.values(result.prizes).flat()].forEach(prize => {
            if (prize) {
                numbers.push(prize.toString().slice(-2));
            }
        });

        return numbers;
    }

    async fetchLatest() {
        const today = this.getTodayDate();
        return this.fetchResult(today);
    }

    async fetchRange(startDate, endDate) {
        const results = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            const dateStr = this.formatDate(current);
            try {
                const result = await this.fetchResult(dateStr);
                results.push(result);
            } catch (error) {
                console.error(`Failed to fetch ${dateStr}:`, error);
            }
            current.setDate(current.getDate() + 1);
        }

        return results;
    }

    getTodayDate() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // If before 18:35, get yesterday's result
        if (hour < 18 || (hour === 18 && minute < 35)) {
            now.setDate(now.getDate() - 1);
        }

        return this.formatDate(now);
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    convertDateFormat(date) {
        // Convert from yyyy-mm-dd to dd-mm-yyyy or vice versa
        const parts = date.split('-');
        if (parts.length !== 3) return date;

        if (parts[0].length === 4) {
            // yyyy-mm-dd to dd-mm-yyyy
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
            // dd-mm-yyyy to yyyy-mm-dd
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // Statistical methods
    calculateFrequency(results) {
        const frequency = {};
        
        for (let i = 0; i <= 99; i++) {
            const num = i.toString().padStart(2, '0');
            frequency[num] = 0;
        }

        results.forEach(result => {
            result.allNumbers.forEach(num => {
                if (frequency[num] !== undefined) {
                    frequency[num]++;
                }
            });
        });

        return frequency;
    }

    findHotNumbers(results, limit = 10) {
        const frequency = this.calculateFrequency(results);
        const sorted = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
        
        return sorted.map(([num, count]) => ({ number: num, count }));
    }

    findColdNumbers(results, limit = 10) {
        const frequency = this.calculateFrequency(results);
        const sorted = Object.entries(frequency)
            .sort((a, b) => a[1] - b[1])
            .slice(0, limit);
        
        return sorted.map(([num, count]) => ({ number: num, count }));
    }

    analyzePairs(results) {
        const pairs = {};
        
        results.forEach(result => {
            const numbers = result.allNumbers;
            for (let i = 0; i < numbers.length - 1; i++) {
                for (let j = i + 1; j < numbers.length; j++) {
                    const pair = [numbers[i], numbers[j]].sort().join('-');
                    pairs[pair] = (pairs[pair] || 0) + 1;
                }
            }
        });

        return Object.entries(pairs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([pair, count]) => ({ pair, count }));
    }
}