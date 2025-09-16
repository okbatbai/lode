// Rules Module for custom rules and patterns
export class RulesModule {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.rules = this.loadRules();
    }

    loadRules() {
        const saved = localStorage.getItem('customRules');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Default rules
        return [
            {
                id: 'dau',
                name: 'Đầu',
                description: 'Tất cả số có đầu X (VD: đầu 3 = 30-39)',
                pattern: /^(đầu|dau)\s*(\d)$/i,
                enabled: true
            },
            {
                id: 'dit',
                name: 'Đít',
                description: 'Tất cả số có đít X (VD: đít 5 = 05,15,25...95)',
                pattern: /^(đít|dit)\s*(\d)$/i,
                enabled: true
            },
            {
                id: 'bo',
                name: 'Bộ',
                description: 'Các bộ số đặc biệt',
                keywords: ['bo', 'bộ'],
                enabled: true
            }
        ];
    }

    render() {
        const container = document.getElementById('rules-tab');
        if (!container) return;

        container.innerHTML = `
            <div class="rules-layout">
                <!-- Rules List -->
                <div class="rules-section card">
                    <div class="section-header">
                        <h3><i class="fas fa-list-ul"></i> Danh sách quy tắc</h3>
                        <button class="btn btn-primary" onclick="app.rulesModule.addRule()">
                            <i class="fas fa-plus"></i> Thêm quy tắc
                        </button>
                    </div>
                    
                    <div id="rules-list" class="rules-list">
                        ${this.renderRulesList()}
                    </div>
                </div>

                <!-- Predefined Sets -->
                <div class="sets-section card">
                    <h3><i class="fas fa-layer-group"></i> Bộ số định sẵn</h3>
                    
                    <div class="sets-grid">
                        ${this.renderPredefinedSets()}
                    </div>
                    
                    <button class="btn btn-secondary" onclick="app.rulesModule.addSet()">
                        <i class="fas fa-plus"></i> Thêm bộ số
                    </button>
                </div>

                <!-- Quick Patterns -->
                <div class="patterns-section card">
                    <h3><i class="fas fa-magic"></i> Mẫu nhanh</h3>
                    
                    <div class="patterns-list">
                        ${this.renderQuickPatterns()}
                    </div>
                </div>

                <!-- Import/Export -->
                <div class="import-export-section card">
                    <h3><i class="fas fa-exchange-alt"></i> Nhập/Xuất quy tắc</h3>
                    
                    <div class="ie-buttons">
                        <button class="btn btn-secondary" onclick="app.rulesModule.exportRules()">
                            <i class="fas fa-download"></i> Xuất quy tắc
                        </button>
                        <button class="btn btn-secondary" onclick="app.rulesModule.importRules()">
                            <i class="fas fa-upload"></i> Nhập quy tắc
                        </button>
                        <button class="btn btn-warning" onclick="app.rulesModule.resetRules()">
                            <i class="fas fa-undo"></i> Khôi phục mặc định
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    renderRulesList() {
        return this.rules.map(rule => `
            <div class="rule-item ${rule.enabled ? '' : 'disabled'}" data-id="${rule.id}">
                <div class="rule-content">
                    <div class="rule-header">
                        <h4>${rule.name}</h4>
                        <div class="rule-controls">
                            <label class="switch">
                                <input type="checkbox" ${rule.enabled ? 'checked' : ''} 
                                       onchange="app.rulesModule.toggleRule('${rule.id}')">
                                <span class="switch-slider"></span>
                            </label>
                            <button class="btn-icon-small" onclick="app.rulesModule.editRule('${rule.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon-small" onclick="app.rulesModule.deleteRule('${rule.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="rule-description">${rule.description}</p>
                    ${rule.pattern ? `<code class="rule-pattern">${rule.pattern.source}</code>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderPredefinedSets() {
        const sets = this.getPredefinedSets();
        
        return sets.map(set => `
            <div class="set-card">
                <h4>${set.name}</h4>
                <div class="set-numbers">
                    ${set.numbers.slice(0, 5).join(', ')}${set.numbers.length > 5 ? '...' : ''}
                </div>
                <div class="set-count">${set.numbers.length} số</div>
                <button class="btn btn-sm" onclick="app.rulesModule.applySet('${set.id}')">
                    <i class="fas fa-play"></i> Áp dụng
                </button>
            </div>
        `).join('');
    }

    renderQuickPatterns() {
        const patterns = [
            { name: 'Chẵn', description: 'Tất cả số chẵn', action: 'even' },
            { name: 'Lẻ', description: 'Tất cả số lẻ', action: 'odd' },
            { name: 'Nhỏ', description: 'Số từ 00-49', action: 'small' },
            { name: 'Lớn', description: 'Số từ 50-99', action: 'large' },
            { name: 'Tổng chẵn', description: 'Số có tổng chẵn', action: 'sumEven' },
            { name: 'Tổng lẻ', description: 'Số có tổng lẻ', action: 'sumOdd' }
        ];

        return patterns.map(pattern => `
            <div class="pattern-item">
                <div class="pattern-info">
                    <strong>${pattern.name}</strong>
                    <span>${pattern.description}</span>
                </div>
                <button class="btn btn-sm" onclick="app.rulesModule.applyPattern('${pattern.action}')">
                    Áp dụng
                </button>
            </div>
        `).join('');
    }

    getPredefinedSets() {
        return [
            {
                id: 'kepbang',
                name: 'Kép bằng',
                numbers: ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99']
            },
            {
                id: 'keplech',
                name: 'Kép lệch',
                numbers: ['05', '50', '16', '61', '27', '72', '38', '83', '49', '94']
            },
            {
                id: 'bo34',
                name: 'Bộ 34',
                numbers: ['34', '43', '39', '93', '37', '73', '33', '44']
            },
            {
                id: 'dantotruot',
                name: 'Dàn tổ trượt',
                numbers: ['01', '10', '06', '60', '51', '15', '56', '65']
            }
        ];
    }

    addRule() {
        const modal = this.createModal({
            title: 'Thêm quy tắc mới',
            content: `
                <div class="rule-form">
                    <div class="form-group">
                        <label>Tên quy tắc:</label>
                        <input type="text" id="rule-name" placeholder="VD: Đầu">
                    </div>
                    <div class="form-group">
                        <label>Mô tả:</label>
                        <textarea id="rule-description" rows="3" 
                                  placeholder="VD: Tất cả số có đầu X"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Pattern (RegEx):</label>
                        <input type="text" id="rule-pattern" 
                               placeholder="VD: ^(đầu|dau)\\s*(\\d)$">
                    </div>
                    <div class="form-group">
                        <label>Từ khóa (cách nhau bởi dấu phẩy):</label>
                        <input type="text" id="rule-keywords" placeholder="VD: dau, đầu">
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="app.rulesModule.closeModal()">Hủy</button>
                <button class="btn btn-primary" onclick="app.rulesModule.saveRule()">
                    <i class="fas fa-save"></i> Lưu
                </button>
            `
        });
    }

    saveRule(ruleId = null) {
        const name = document.getElementById('rule-name').value;
        const description = document.getElementById('rule-description').value;
        const pattern = document.getElementById('rule-pattern').value;
        const keywords = document.getElementById('rule-keywords').value;

        if (!name) {
            window.app.notification.show('Vui lòng nhập tên quy tắc', 'warning');
            return;
        }

        const rule = {
            id: ruleId || this.generateId(),
            name,
            description,
            pattern: pattern ? new RegExp(pattern, 'i') : null,
            keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
            enabled: true
        };

        if (ruleId) {
            const index = this.rules.findIndex(r => r.id === ruleId);
            if (index !== -1) {
                this.rules[index] = rule;
            }
        } else {
            this.rules.push(rule);
        }

        this.saveRules();
        this.closeModal();
        this.render();
        window.app.notification.show('Đã lưu quy tắc', 'success');
    }

    editRule(ruleId) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (!rule) return;

        const modal = this.createModal({
            title: 'Chỉnh sửa quy tắc',
            content: `
                <div class="rule-form">
                    <div class="form-group">
                        <label>Tên quy tắc:</label>
                        <input type="text" id="rule-name" value="${rule.name}">
                    </div>
                    <div class="form-group">
                        <label>Mô tả:</label>
                        <textarea id="rule-description" rows="3">${rule.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Pattern (RegEx):</label>
                        <input type="text" id="rule-pattern" 
                               value="${rule.pattern ? rule.pattern.source : ''}">
                    </div>
                    <div class="form-group">
                        <label>Từ khóa:</label>
                        <input type="text" id="rule-keywords" 
                               value="${rule.keywords ? rule.keywords.join(', ') : ''}">
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="app.rulesModule.closeModal()">Hủy</button>
                <button class="btn btn-primary" onclick="app.rulesModule.saveRule('${ruleId}')">
                    <i class="fas fa-save"></i> Lưu
                </button>
            `
        });
    }

    deleteRule(ruleId) {
        if (confirm('Bạn có chắc muốn xóa quy tắc này?')) {
            this.rules = this.rules.filter(r => r.id !== ruleId);
            this.saveRules();
            this.render();
            window.app.notification.show('Đã xóa quy tắc', 'success');
        }
    }

    toggleRule(ruleId) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule) {
            rule.enabled = !rule.enabled;
            this.saveRules();
        }
    }

    applySet(setId) {
        const sets = this.getPredefinedSets();
        const set = sets.find(s => s.id === setId);
        
        if (!set) return;

        // Show modal to input value
        const modal = this.createModal({
            title: `Áp dụng ${set.name}`,
            content: `
                <div class="apply-set-form">
                    <p>Bộ số: ${set.numbers.join(', ')}</p>
                    <div class="form-group">
                        <label>Giá trị cho mỗi số:</label>
                        <input type="number" id="set-value" min="1" placeholder="VD: 50000">
                    </div>
                    <div class="form-group">
                        <label>Loại:</label>
                        <select id="set-type">
                            <option value="lo">Lô</option>
                            <option value="de">Đề</option>
                        </select>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="app.rulesModule.closeModal()">Hủy</button>
                <button class="btn btn-primary" onclick="app.rulesModule.confirmApplySet('${setId}')">
                    <i class="fas fa-check"></i> Áp dụng
                </button>
            `
        });
    }

    confirmApplySet(setId) {
        const value = parseInt(document.getElementById('set-value').value);
        const type = document.getElementById('set-type').value;
        
        if (!value || value <= 0) {
            window.app.notification.show('Vui lòng nhập giá trị hợp lệ', 'warning');
            return;
        }

        const sets = this.getPredefinedSets();
        const set = sets.find(s => s.id === setId);
        
        if (!set) return;

        // Add numbers to data
        const items = set.numbers.map(num => ({
            so: num,
            giatri: value,
            loai: type
        }));

        const result = this.dataManager.bulkAdd(items);
        
        this.closeModal();
        window.app.notification.show(`Đã thêm ${result.added.length} số`, 'success');
        window.app.ui.refresh();
    }

    applyPattern(action) {
        const numbers = this.getNumbersByPattern(action);
        
        const modal = this.createModal({
            title: `Áp dụng mẫu ${this.getPatternName(action)}`,
            content: `
                <div class="apply-pattern-form">
                    <p>Số lượng: ${numbers.length} số</p>
                    <p>Các số: ${numbers.slice(0, 10).join(', ')}${numbers.length > 10 ? '...' : ''}</p>
                    <div class="form-group">
                        <label>Giá trị cho mỗi số:</label>
                        <input type="number" id="pattern-value" min="1" placeholder="VD: 50000">
                    </div>
                    <div class="form-group">
                        <label>Loại:</label>
                        <select id="pattern-type">
                            <option value="lo">Lô</option>
                            <option value="de">Đề</option>
                        </select>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="app.rulesModule.closeModal()">Hủy</button>
                <button class="btn btn-primary" onclick="app.rulesModule.confirmApplyPattern('${action}')">
                    <i class="fas fa-check"></i> Áp dụng
                </button>
            `
        });
    }

    confirmApplyPattern(action) {
        const value = parseInt(document.getElementById('pattern-value').value);
        const type = document.getElementById('pattern-type').value;
        
        if (!value || value <= 0) {
            window.app.notification.show('Vui lòng nhập giá trị hợp lệ', 'warning');
            return;
        }

        const numbers = this.getNumbersByPattern(action);
        
        // Add numbers to data
        const items = numbers.map(num => ({
            so: num,
            giatri: value,
            loai: type
        }));

        const result = this.dataManager.bulkAdd(items);
        
        this.closeModal();
        window.app.notification.show(`Đã thêm ${result.added.length} số`, 'success');
        window.app.ui.refresh();
    }

    getNumbersByPattern(action) {
        const numbers = [];
        
        for (let i = 0; i < 100; i++) {
            const num = i.toString().padStart(2, '0');
            const d1 = parseInt(num[0]);
            const d2 = parseInt(num[1]);
            const sum = d1 + d2;
            
            switch (action) {
                case 'even':
                    if (i % 2 === 0) numbers.push(num);
                    break;
                case 'odd':
                    if (i % 2 === 1) numbers.push(num);
                    break;
                case 'small':
                    if (i < 50) numbers.push(num);
                    break;
                case 'large':
                    if (i >= 50) numbers.push(num);
                    break;
                case 'sumEven':
                    if (sum % 2 === 0) numbers.push(num);
                    break;
                case 'sumOdd':
                    if (sum % 2 === 1) numbers.push(num);
                    break;
            }
        }
        
        return numbers;
    }

    getPatternName(action) {
        const names = {
            'even': 'Chẵn',
            'odd': 'Lẻ',
            'small': 'Nhỏ',
            'large': 'Lớn',
            'sumEven': 'Tổng chẵn',
            'sumOdd': 'Tổng lẻ'
        };
        return names[action] || action;
    }

    addSet() {
        // Implement add custom set
        window.app.notification.show('Tính năng đang phát triển', 'info');
    }

    exportRules() {
        const dataStr = JSON.stringify(this.rules, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lode-rules.json';
        a.click();
        URL.revokeObjectURL(url);
        
        window.app.notification.show('Đã xuất quy tắc', 'success');
    }

    importRules() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const rules = JSON.parse(text);
                
                if (Array.isArray(rules)) {
                    this.rules = rules;
                    this.saveRules();
                    this.render();
                    window.app.notification.show('Đã nhập quy tắc', 'success');
                } else {
                    throw new Error('Invalid rules format');
                }
            } catch (error) {
                window.app.notification.show('Lỗi nhập quy tắc: ' + error.message, 'error');
            }
        };
        
        input.click();
    }

    resetRules() {
        if (confirm('Bạn có chắc muốn khôi phục quy tắc mặc định?')) {
            localStorage.removeItem('customRules');
            this.rules = this.loadRules();
            this.render();
            window.app.notification.show('Đã khôi phục mặc định', 'success');
        }
    }

    saveRules() {
        // Convert RegExp to string for storage
        const rulesForStorage = this.rules.map(rule => ({
            ...rule,
            pattern: rule.pattern ? rule.pattern.source : null
        }));
        
        localStorage.setItem('customRules', JSON.stringify(rulesForStorage));
    }

    bindEvents() {
        // Additional event bindings if needed
    }

    createModal(options) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal ${options.size || 'medium'}">
                <div class="modal-header">
                    <h3>${options.title}</h3>
                    <button class="modal-close" onclick="app.rulesModule.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${options.content}
                </div>
                <div class="modal-footer">
                    ${options.footer}
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        return modal;
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    generateId() {
        return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Make it available globally
window.app = window.app || {};
window.app.rulesModule = null;