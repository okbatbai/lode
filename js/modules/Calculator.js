// Advanced Calculator Module
export class Calculator {
    constructor(config) {
        this.config = config;
        this.rates = this.loadRates();
    }

    loadRates() {
        const saved = localStorage.getItem('calculationRates');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return {
            lo: {
                xac: 21.75,
                win: 80
            },
            de: {
                xac: 0.83,
                win: 80
            },
            xien: {
                xac: 0.65,
                win: {
                    2: 11,
                    3: 45,
                    4: 140
                },
                nhay: true
            },
            cang3: {
                xac: 0.7,
                win: 400
            }
        };
    }

    saveRates(rates) {
        this.rates = rates;
        localStorage.setItem('calculationRates', JSON.stringify(rates));
    }

    calculate(data, lotteryResult, role = 'owner') {
        const results = {
            lo: this.calculateLo(data, lotteryResult),
            de: this.calculateDe(data, lotteryResult),
            xien: this.calculateXien(data, lotteryResult),
            cang3: this.calculate3Cang(data, lotteryResult)
        };

        const summary = this.calculateSummary(results, role);
        
        return {
            results,
            summary,
            details: this.generateDetails(results)
        };
    }

    calculateLo(data, lotteryResult) {
        const loData = data.filter(item => item.loai === 'lo');
        const allNumbers = this.extractAllNumbers(lotteryResult);
        
        // Count occurrences
        const numberCount = {};
        allNumbers.forEach(num => {
            numberCount[num] = (numberCount[num] || 0) + 1;
        });

        let totalBet = 0;
        let totalWin = 0;
        const details = [];

        loData.forEach(item => {
            const num = item.so.padStart(2, '0');
            const value = item.giatri;
            const hitCount = numberCount[num] || 0;
            const winAmount = hitCount * value;

            totalBet += value;
            totalWin += winAmount;

            details.push({
                number: num,
                value,
                hitCount,
                winAmount,
                profit: winAmount - value
            });
        });

        return {
            totalBet,
            totalWin,
            xac: totalBet * this.rates.lo.xac,
            an: totalWin * this.rates.lo.win,
            details
        };
    }

    calculateDe(data, lotteryResult) {
        const deData = data.filter(item => item.loai === 'de');
        const specialNumber = this.getSpecialNumber(lotteryResult);

        let totalBet = 0;
        let totalWin = 0;
        const details = [];

        deData.forEach(item => {
            const num = item.so.padStart(2, '0');
            const value = item.giatri;
            const isHit = num === specialNumber;
            const winAmount = isHit ? value : 0;

            totalBet += value;
            totalWin += winAmount;

            details.push({
                number: num,
                value,
                isHit,
                winAmount,
                profit: winAmount - value
            });
        });

        return {
            totalBet,
            totalWin,
            xac: totalBet * this.rates.de.xac,
            an: totalWin * this.rates.de.win,
            details,
            specialNumber
        };
    }

    calculateXien(data, lotteryResult) {
        const xienData = data.filter(item => item.loai === 'xien');
        const allNumbers = this.extractAllNumbers(lotteryResult);
        
        // Count occurrences
        const numberCount = {};
        allNumbers.forEach(num => {
            numberCount[num] = (numberCount[num] || 0) + 1;
        });

        let totalBet = 0;
        let totalWin = 0;
        const details = [];

        xienData.forEach(item => {
            const numbers = item.numbers || item.so.split(',');
            const value = item.giatri;
            const xienType = item.xienType || numbers.length;

            totalBet += value;

            let hitCount = 0;
            
            if (this.rates.xien.nhay) {
                // Calculate with "nhảy" (multiple hits)
                const counts = numbers.map(num => numberCount[num] || 0);
                const allPresent = counts.every(count => count > 0);
                
                if (allPresent) {
                    hitCount = Math.min(...counts);
                }
            } else {
                // Simple hit (once only)
                const allPresent = numbers.every(num => numberCount[num] > 0);
                hitCount = allPresent ? 1 : 0;
            }

            const winRate = this.rates.xien.win[xienType] || 0;
            const winAmount = hitCount * value * winRate;
            totalWin += winAmount;

            details.push({
                numbers: numbers.join(','),
                type: xienType,
                value,
                hitCount,
                winRate,
                winAmount,
                profit: winAmount - value
            });
        });

        return {
            totalBet,
            totalWin,
            xac: totalBet * this.rates.xien.xac,
            an: totalWin, // Already calculated with rate
            details
        };
    }

    calculate3Cang(data, lotteryResult) {
        const cang3Data = data.filter(item => item.loai === 'cang3');
        const specialNumber = this.getSpecial3Digits(lotteryResult);

        let totalBet = 0;
        let totalWin = 0;
        const details = [];

        cang3Data.forEach(item => {
            const num = item.so;
            const value = item.giatri;
            const isHit = num === specialNumber;
            const winAmount = isHit ? value * this.rates.cang3.win : 0;

            totalBet += value;
            totalWin += winAmount;

            details.push({
                number: num,
                value,
                isHit,
                winAmount,
                profit: winAmount - value
            });
        });

        return {
            totalBet,
            totalWin,
            xac: totalBet * this.rates.cang3.xac,
            an: totalWin, // Already calculated with rate
            details,
            specialNumber
        };
    }

    calculateSummary(results, role) {
        let totalXac = 0;
        let totalAn = 0;
        let totalBet = 0;
        let totalWin = 0;

        Object.values(results).forEach(result => {
            totalXac += result.xac || 0;
            totalAn += result.an || 0;
            totalBet += result.totalBet || 0;
            totalWin += result.totalWin || 0;
        });

        const profit = role === 'owner' 
            ? (totalXac - totalAn) 
            : (totalAn - totalXac);

        return {
            totalBet,
            totalWin,
            totalXac,
            totalAn,
            profit,
            profitRate: totalBet > 0 ? (profit / totalBet * 100) : 0,
            role
        };
    }

    generateDetails(results) {
        const details = [];

        // Format details for display
        Object.entries(results).forEach(([type, result]) => {
            if (result.details && result.details.length > 0) {
                details.push({
                    type,
                    items: result.details,
                    summary: {
                        totalBet: result.totalBet,
                        totalWin: result.totalWin,
                        xac: result.xac,
                        an: result.an
                    }
                });
            }
        });

        return details;
    }

    extractAllNumbers(lotteryResult) {
        const numbers = [];
        
        // Add all 2-digit endings from lottery result
        Object.values(lotteryResult).forEach(value => {
            if (typeof value === 'string' && value.length >= 2) {
                numbers.push(value.slice(-2));
            }
        });

        return numbers;
    }

    getSpecialNumber(lotteryResult) {
        // Get last 2 digits of special prize
        if (lotteryResult.specialPrize) {
            return lotteryResult.specialPrize.slice(-2);
        }
        return '';
    }

    getSpecial3Digits(lotteryResult) {
        // Get last 3 digits of special prize
        if (lotteryResult.specialPrize && lotteryResult.specialPrize.length >= 3) {
            return lotteryResult.specialPrize.slice(-3);
        }
        return '';
    }

    // Advanced calculation methods
    calculateExpectedValue(data, historicalResults) {
        // Calculate expected value based on historical data
        const frequency = this.calculateFrequency(historicalResults);
        let expectedValue = 0;

        data.forEach(item => {
            const prob = frequency[item.so] / historicalResults.length;
            const value = item.giatri;
            
            if (item.loai === 'lo') {
                expectedValue += (prob * value * this.rates.lo.win) - (value * this.rates.lo.xac);
            } else if (item.loai === 'de') {
                expectedValue += (prob * value * this.rates.de.win) - (value * this.rates.de.xac);
            }
        });

        return expectedValue;
    }

    calculateFrequency(results) {
        const frequency = {};
        
        for (let i = 0; i <= 99; i++) {
            const num = i.toString().padStart(2, '0');
            frequency[num] = 0;
        }

        results.forEach(result => {
            const numbers = this.extractAllNumbers(result);
            numbers.forEach(num => {
                if (frequency[num] !== undefined) {
                    frequency[num]++;
                }
            });
        });

        return frequency;
    }

    suggestOptimalBet(budget, historicalResults) {
        // Suggest optimal betting strategy based on budget and historical data
        const frequency = this.calculateFrequency(historicalResults);
        const suggestions = [];

        // Find hot numbers
        const hotNumbers = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        // Calculate optimal distribution
        const totalFreq = hotNumbers.reduce((sum, [_, freq]) => sum + freq, 0);
        
        hotNumbers.forEach(([num, freq]) => {
            const allocation = Math.floor(budget * (freq / totalFreq));
            if (allocation > 0) {
                suggestions.push({
                    number: num,
                    type: 'lo',
                    amount: allocation,
                    expectedReturn: this.calculateExpectedReturn(num, freq, historicalResults.length)
                });
            }
        });

        return suggestions;
    }

    calculateExpectedReturn(number, frequency, totalGames) {
        const probability = frequency / totalGames;
        const loReturn = probability * this.rates.lo.win - this.rates.lo.xac;
        return loReturn;
    }

    // Risk analysis
    analyzeRisk(data) {
        const totalValue = data.reduce((sum, item) => sum + item.giatri, 0);
        
        const distribution = {
            lo: 0,
            de: 0,
            xien: 0,
            cang3: 0
        };

        data.forEach(item => {
            distribution[item.loai] += item.giatri;
        });

        // Calculate risk metrics
        const concentration = Math.max(...Object.values(distribution)) / totalValue;
        const diversity = Object.values(distribution).filter(v => v > 0).length / 4;
        
        const riskScore = (concentration * 0.6 + (1 - diversity) * 0.4) * 100;

        return {
            totalValue,
            distribution,
            concentration,
            diversity,
            riskScore,
            riskLevel: this.getRiskLevel(riskScore)
        };
    }

    getRiskLevel(score) {
        if (score < 30) return 'low';
        if (score < 60) return 'medium';
        return 'high';
    }
}