// Smart Input Parser
export class InputParser {
    constructor() {
        this.rules = this.loadRules();
        this.patterns = this.initPatterns();
    }

    loadRules() {
        // Load custom rules from storage
        const saved = localStorage.getItem('customRules');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default rules
        return [
            {
                id: 'dau',
                pattern: /^(đầu|dau)\s*(\d)\s*[x*×=:-]?\s*(\d+)$/i,
                expand: (match) => {
                    const digit = match[2];
                    const value = match[3];
                    const numbers = [];
                    for (let i = 0; i <= 9; i++) {
                        numbers.push(digit + i.toString());
                    }
                    return { numbers, value };
                }
            },
            {
                id: 'dit',
                pattern: /^(đít|dit)\s*(\d)\s*[x*×=:-]?\s*(\d+)$/i,
                expand: (match) => {
                    const digit = match[2];
                    const value = match[3];
                    const numbers = [];
                    for (let i = 0; i <= 9; i++) {
                        numbers.push(i.toString() + digit);
                    }
                    return { numbers, value };
                }
            },
            {
                id: 'bo',
                keywords: ['bo', 'bộ'],
                numbers: {
                    '34': ['34', '43', '39', '93', '84', '48', '89', '98']
                }
            }
        ];
    }

    initPatterns() {
        return {
            // Single number with value
            single: /^(\d{2,3})\s*[x*×=:-]\s*(\d+)$/,
            
            // Multiple numbers with same value
            multiple: /^((?:\d{2,3}\s+)+)\s*[x*×=:-]\s*(\d+)$/,
            
            // Xien format
            xien: /^(xiên|xien)\s+((?:\d{2}\s*){2,4})\s*[x*×=:-]\s*(\d+)$/i,
            
            // Xien quay format
            xienQuay: /^(xiên\s*quay|xien\s*quay|xq)\s+((?:\d{2}\s*){2,4})\s*[x*×=:-]\s*(\d+)$/i,
            
            // 3 Cang format
            cang3: /^(3c|3\s*càng|3cang|ba\s*số)\s+((?:\d{3}\s*)+)\s*[x*×=:-]\s*(\d+)$/i,
            
            // Type prefix
            typePrefix: /^(lô|lo|đề|de)\s+(.+)$/i
        };
    }

    parseBulkInput(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const results = {
            items: [],
            errors: []
        };

        let currentType = 'lo'; // Default type

        lines.forEach((line, index) => {
            try {
                const parsed = this.parseLine(line.trim(), currentType);
                
                if (parsed.type) {
                    currentType = parsed.type;
                }

                if (parsed.items && parsed.items.length > 0) {
                    results.items.push(...parsed.items);
                } else if (parsed.error) {
                    results.errors.push({
                        line: index + 1,
                        text: line,
                        error: parsed.error
                    });
                }
            } catch (error) {
                results.errors.push({
                    line: index + 1,
                    text: line,
                    error: error.message
                });
            }
        });

        return results;
    }

    parseLine(line, defaultType = 'lo') {
        // Check for type prefix
        const typeMatch = line.match(this.patterns.typePrefix);
        let type = defaultType;
        let content = line;

        if (typeMatch) {
            type = this.normalizeType(typeMatch[1]);
            content = typeMatch[2];
        }

        // Try to parse xien quay
        const xienQuayMatch = content.match(this.patterns.xienQuay);
        if (xienQuayMatch) {
            return this.parseXienQuay(xienQuayMatch);
        }

        // Try to parse regular xien
        const xienMatch = content.match(this.patterns.xien);
        if (xienMatch) {
            return this.parseXien(xienMatch);
        }

        // Try to parse 3 cang
        const cang3Match = content.match(this.patterns.cang3);
        if (cang3Match) {
            return this.parse3Cang(cang3Match);
        }

        // Check custom rules
        const ruleResult = this.applyCustomRules(content, type);
        if (ruleResult) {
            return ruleResult;
        }

        // Parse multiple numbers
        const multipleMatch = content.match(this.patterns.multiple);
        if (multipleMatch) {
            return this.parseMultiple(multipleMatch, type);
        }

        // Parse single number
        const singleMatch = content.match(this.patterns.single);
        if (singleMatch) {
            return this.parseSingle(singleMatch, type);
        }

        return {
            error: `Không thể phân tích: "${line}"`
        };
    }

    parseXienQuay(match) {
        const numbers = match[2].trim().split(/\s+/).map(n => n.padStart(2, '0'));
        const value = parseInt(match[3]);

        // Validate
        if (numbers.length < 2 || numbers.length > 4) {
            return { error: 'Xiên quay phải có 2-4 số' };
        }

        // Check for duplicates
        const unique = [...new Set(numbers)];
        if (unique.length !== numbers.length) {
            return { error: 'Xiên quay không được có số trùng' };
        }

        // Generate all combinations
        const items = [];
        for (let k = 2; k <= numbers.length && k <= 4; k++) {
            const combinations = this.getCombinations(numbers, k);
            combinations.forEach(combo => {
                items.push({
                    so: combo.join(','),
                    giatri: value,
                    loai: 'xien',
                    xienType: k,
                    numbers: combo
                });
            });
        }

        return { items, type: 'xien' };
    }

    parseXien(match) {
        const numbers = match[2].trim().split(/\s+/).map(n => n.padStart(2, '0'));
        const value = parseInt(match[3]);

        // Validate
        if (numbers.length < 2 || numbers.length > 4) {
            return { error: 'Xiên phải có 2-4 số' };
        }

        // Check for duplicates
        const unique = [...new Set(numbers)];
        if (unique.length !== numbers.length) {
            return { error: 'Xiên không được có số trùng' };
        }

        return {
            items: [{
                so: numbers.join(','),
                giatri: value,
                loai: 'xien',
                xienType: numbers.length,
                numbers: numbers
            }],
            type: 'xien'
        };
    }

    parse3Cang(match) {
        const numbers = match[2].trim().split(/\s+/);
        const value = parseInt(match[3]);

        const items = [];
        numbers.forEach(num => {
            if (num.length === 3) {
                items.push({
                    so: num,
                    giatri: value,
                    loai: 'cang3'
                });
            }
        });

        if (items.length === 0) {
            return { error: '3 Càng phải có đúng 3 chữ số' };
        }

        return { items, type: 'cang3' };
    }

    parseMultiple(match, type) {
        const numbers = match[1].trim().split(/\s+/);
        const value = parseInt(match[2]);

        const items = [];
        numbers.forEach(num => {
            if (num.length === 2) {
                items.push({
                    so: num,
                    giatri: value,
                    loai: type
                });
            } else if (num.length === 3 && type !== 'cang3') {
                // Expand 3-digit number to pairs
                const pairs = this.expand3Digit(num);
                pairs.forEach(pair => {
                    items.push({
                        so: pair,
                        giatri: value,
                        loai: type
                    });
                });
            }
        });

        return { items };
    }

    parseSingle(match, type) {
        const num = match[1];
        const value = parseInt(match[2]);

        if (num.length === 2) {
            return {
                items: [{
                    so: num,
                    giatri: value,
                    loai: type
                }]
            };
        } else if (num.length === 3 && type !== 'cang3') {
            const pairs = this.expand3Digit(num);
            return {
                items: pairs.map(pair => ({
                    so: pair,
                    giatri: value,
                    loai: type
                }))
            };
        } else if (num.length === 3 && type === 'cang3') {
            return {
                items: [{
                    so: num,
                    giatri: value,
                    loai: 'cang3'
                }]
            };
        }

        return { error: 'Số không hợp lệ' };
    }

    applyCustomRules(content, type) {
        for (const rule of this.rules) {
            // Check pattern rules
            if (rule.pattern) {
                const match = content.match(rule.pattern);
                if (match && rule.expand) {
                    const result = rule.expand(match);
                    return {
                        items: result.numbers.map(num => ({
                            so: num.padStart(2, '0'),
                            giatri: parseInt(result.value),
                            loai: type
                        }))
                    };
                }
            }

            // Check keyword rules
            if (rule.keywords && rule.numbers) {
                for (const keyword of rule.keywords) {
                    const pattern = new RegExp(`^${keyword}\\s*(\\d+)?\\s*[x*×=:-]?\\s*(\\d+)$`, 'i');
                    const match = content.match(pattern);
                    if (match) {
                        const subset = match[1] || '';
                        const value = parseInt(match[2]);
                        const numbers = rule.numbers[subset] || rule.numbers[''] || [];
                        
                        if (numbers.length > 0) {
                            return {
                                items: numbers.map(num => ({
                                    so: num.padStart(2, '0'),
                                    giatri: value,
                                    loai: type
                                }))
                            };
                        }
                    }
                }
            }
        }

        return null;
    }

    expand3Digit(num) {
        const first = num.substring(0, 2);
        const last = num.substring(1, 3);
        return [...new Set([first, last])];
    }

    getCombinations(arr, k) {
        const result = [];
        
        function backtrack(start, combo) {
            if (combo.length === k) {
                result.push([...combo]);
                return;
            }
            
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                backtrack(i + 1, combo);
                combo.pop();
            }
        }
        
        backtrack(0, []);
        return result;
    }

    normalizeType(type) {
        const normalized = type.toLowerCase();
        if (normalized === 'lô' || normalized === 'lo') return 'lo';
        if (normalized === 'đề' || normalized === 'de') return 'de';
        return 'lo';
    }

    // Smart features
    detectPattern(numbers) {
        // Detect patterns like arithmetic sequence, etc.
        if (numbers.length < 2) return null;

        const diffs = [];
        for (let i = 1; i < numbers.length; i++) {
            diffs.push(parseInt(numbers[i]) - parseInt(numbers[i-1]));
        }

        // Check if arithmetic sequence
        if (diffs.every(d => d === diffs[0])) {
            return {
                type: 'arithmetic',
                difference: diffs[0]
            };
        }

        return null;
    }

    suggestNext(numbers) {
        const pattern = this.detectPattern(numbers);
        if (!pattern) return [];

        const suggestions = [];
        const last = parseInt(numbers[numbers.length - 1]);

        if (pattern.type === 'arithmetic') {
            for (let i = 1; i <= 3; i++) {
                const next = last + (pattern.difference * i);
                if (next >= 0 && next <= 99) {
                    suggestions.push(next.toString().padStart(2, '0'));
                }
            }
        }

        return suggestions;
    }
}