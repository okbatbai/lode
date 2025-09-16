// Calculation Module for money calculations
export class CalculationModule {
    constructor(dataManager, lotteryAPI) {
        this.dataManager = dataManager;
        this.lotteryAPI = lotteryAPI;
        this.calculator = null;
    }

    async render() {
        const container = document.getElementById('calculation-tab');
        if (!container) return;

        // Load Calculator if not loaded
        if (!this.calculator) {
            const { Calculator } = await import('./Calculator.js');
            this.calculator = new Calculator();
        }

        container.innerHTML = `
            <div class="calculation-layout">
                <!-- Lottery Result Input -->
                <div class="lottery-result-section card">
                    <h3><i class="fas fa-trophy"></i> Kết quả xổ số</h3>
                    <div class="result-input-area">
                        <div class="date-selector">
                            <label>Chọn ngày:</label>
                            <input type="date" id="lottery-date" value="${this.getTodayDate()}" max="${this.getTodayDate()}">
                            <button class="btn btn-primary" onclick="app.calcModule.fetchLotteryResult()">
                                <i class="fas fa-download"></i> Lấy kết quả
                            </button>
                        </div>
                        
                        <div id="lottery-result-display" class="result-display">
                            <!-- Will be populated with lottery results -->
                        </div>
                        
                        <div class="manual-input-toggle">
                            <button class="btn btn-secondary" onclick="app.calcModule.toggleManualInput()">
                                <i class="fas fa-keyboard"></i> Nhập thủ công
                            </button>
                        </div>
                        
                        <div id="manual-result-input" class="manual-input" style="display: none;">
                            <div class="form-group">
                                <label>Giải đặc biệt:</label>
                                <input type="text" id="special-prize" placeholder="12345">
                            </div>
                            <!-- Add more prize inputs as needed -->
                        </div>
                    </div>
                </div>

                <!-- Data Selection -->
                <div class="data-selection-section card">
                    <h3><i class="fas fa-list-check"></i> Chọn dữ liệu tính toán</h3>
                    <div class="selection-controls">
                        <button class="btn btn-secondary" onclick="app.calcModule.selectAll()">
                            <i class="fas fa-check-square"></i> Chọn tất cả
                        </button>
                        <button class="btn btn-secondary" onclick="app.calcModule.deselectAll()">
                            <i class="fas fa-square"></i> Bỏ chọn tất cả
                        </button>
                        <button class="btn btn-secondary" onclick="app.calcModule.selectToday()">
                            <i class="fas fa-calendar-day"></i> Hôm nay
                        </button>
                    </div>
                    
                    <div id="data-list" class="data-selection-list">
                        <!-- Will be populated with selectable data items -->
                    </div>
                </div>

                <!-- Calculation Settings -->
                <div class="calc-settings-section card">
                    <h3><i class="fas fa-sliders-h"></i> Cài đặt tính toán</h3>
                    <div class="settings-grid">
                        <div class="setting-group">
                            <label>Vai trò:</label>
                            <select id="calc-role">
                                <option value="owner">Chủ</option>
                                <option value="player">Người chơi</option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>Tỷ lệ lô (xác):</label>
                            <input type="number" id="rate-lo-xac" value="21.75" step="0.01">
                        </div>
                        
                        <div class="setting-group">
                            <label>Tỷ lệ lô (ăn):</label>
                            <input type="number" id="rate-lo-an" value="80" step="1">
                        </div>
                        
                        <div class="setting-group">
                            <label>Tỷ lệ đề (xác):</label>
                            <input type="number" id="rate-de-xac" value="0.83" step="0.01">
                        </div>
                        
                        <div class="setting-group">
                            <label>Tỷ lệ đề (ăn):</label>
                            <input type="number" id="rate-de-an" value="80" step="1">
                        </div>
                    </div>
                </div>

                <!-- Calculation Button -->
                <div class="calc-action">
                    <button class="btn btn-primary btn-large" onclick="app.calcModule.calculate()">
                        <i class="fas fa-calculator"></i> Tính tiền
                    </button>
                </div>

                <!-- Results Display -->
                <div id="calculation-results" class="results-section" style="display: none;">
                    <!-- Will be populated with calculation results -->
                </div>
            </div>
        `;

        this.loadDataList();
        this.setupEventListeners();
    }

    loadDataList() {
        const container = document.getElementById('data-list');
        if (!container) return;

        const data = this.dataManager.getAll();
        
        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">Không có dữ liệu để tính toán</div>';
            return;
        }

        container.innerHTML = `
            <div class="selection-list">
                ${data.map(item => `
                    <div class="selection-item">
                        <label class="checkbox-label">
                            <input type="checkbox" class="data-checkbox" value="${item.id}" checked>
                            <span class="item-info">
                                <span class="badge-${item.loai}">${item.loai.toUpperCase()}</span>
                                <span class="item-number">${item.so}</span>
                                <span class="item-value">${this.formatMoney(item.giatri)}</span>
                            </span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async fetchLotteryResult() {
        const date = document.getElementById('lottery-date').value;
        if (!date) {
            window.app.notification.show('Vui lòng chọn ngày', 'warning');
            return;
        }

        try {
            const result = await this.lotteryAPI.fetchResult(date);
            this.displayLotteryResult(result);
            window.app.notification.show('Đã tải kết quả xổ số', 'success');
        } catch (error) {
            window.app.notification.show('Không thể tải kết quả: ' + error.message, 'error');
        }
    }

    displayLotteryResult(result) {
        const container = document.getElementById('lottery-result-display');
        if (!container) return;

        container.innerHTML = `
            <div class="lottery-result">
                <div class="result-header">
                    <h4>Kết quả ngày ${result.date}</h4>
                </div>
                <div class="result-prizes">
                    <div class="prize-row special">
                        <span class="prize-label">Đặc biệt:</span>
                        <span class="prize-value">${result.specialPrize}</span>
                    </div>
                    <div class="prize-row">
                        <span class="prize-label">Giải nhất:</span>
                        <span class="prize-value">${result.firstPrize}</span>
                    </div>
                    ${Object.entries(result.prizes).map(([name, values]) => `
                        <div class="prize-row">
                            <span class="prize-label">Giải ${this.getPrizeName(name)}:</span>
                            <span class="prize-value">${values.join(' - ')}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Store result for calculation
        this.currentLotteryResult = result;
    }

    getPrizeName(name) {
        const names = {
            'second': 'nhì',
            'third': 'ba',
            'fourth': 'tư',
            'fifth': 'năm',
            'sixth': 'sáu',
            'seventh': 'bảy'
        };
        return names[name] || name;
    }

    calculate() {
        if (!this.currentLotteryResult) {
            window.app.notification.show('Vui lòng nhập kết quả xổ số', 'warning');
            return;
        }

        // Get selected data
        const selectedIds = Array.from(document.querySelectorAll('.data-checkbox:checked'))
            .map(cb => cb.value);

        if (selectedIds.length === 0) {
            window.app.notification.show('Vui lòng chọn dữ liệu để tính', 'warning');
            return;
        }

        const selectedData = this.dataManager.getAll()
            .filter(item => selectedIds.includes(item.id));

        // Get rates
        const rates = this.getRatesFromForm();
        this.calculator.saveRates(rates);

        // Get role
        const role = document.getElementById('calc-role').value;

        // Calculate
        const results = this.calculator.calculate(selectedData, this.currentLotteryResult, role);

        // Display results
        this.displayResults(results);
    }

    getRatesFromForm() {
        return {
            lo: {
                xac: parseFloat(document.getElementById('rate-lo-xac').value),
                win: parseFloat(document.getElementById('rate-lo-an').value)
            },
            de: {
                xac: parseFloat(document.getElementById('rate-de-xac').value),
                win: parseFloat(document.getElementById('rate-de-an').value)
            },
            xien: this.calculator.rates.xien,
            cang3: this.calculator.rates.cang3
        };
    }

    displayResults(results) {
        const container = document.getElementById('calculation-results');
        if (!container) return;

        container.style.display = 'block';
        container.innerHTML = `
            <div class="results-card">
                <h3><i class="fas fa-receipt"></i> Kết quả tính toán</h3>
                
                <!-- Summary -->
                <div class="result-summary ${results.summary.profit >= 0 ? 'profit' : 'loss'}">
                    <div class="summary-row">
                        <span>Vai trò:</span>
                        <strong>${results.summary.role === 'owner' ? 'Chủ' : 'Người chơi'}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Tổng đặt:</span>
                        <strong>${this.formatMoney(results.summary.totalBet)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Tổng xác:</span>
                        <strong>${this.formatMoney(results.summary.totalXac)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Tổng ăn:</span>
                        <strong>${this.formatMoney(results.summary.totalAn)}</strong>
                    </div>
                    <div class="summary-row highlight">
                        <span>Lãi/Lỗ:</span>
                        <strong class="${results.summary.profit >= 0 ? 'text-success' : 'text-danger'}">
                            ${results.summary.profit >= 0 ? '+' : ''}${this.formatMoney(results.summary.profit)}
                        </strong>
                    </div>
                </div>

                <!-- Detailed Results -->
                <div class="result-details">
                    ${results.details.map(detail => this.renderDetailSection(detail)).join('')}
                </div>

                <!-- Export Options -->
                <div class="result-actions">
                    <button class="btn btn-secondary" onclick="app.calcModule.exportResults()">
                        <i class="fas fa-download"></i> Xuất báo cáo
                    </button>
                    <button class="btn btn-secondary" onclick="app.calcModule.shareResults()">
                        <i class="fas fa-share"></i> Chia sẻ
                    </button>
                </div>
            </div>
        `;
    }

    renderDetailSection(detail) {
        return `
            <div class="detail-section">
                <h4>${detail.type.toUpperCase()}</h4>
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Số</th>
                            <th>Giá trị</th>
                            <th>Trúng</th>
                            <th>Thắng</th>
                            <th>Lãi/Lỗ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detail.items.map(item => `
                            <tr class="${item.winAmount > 0 ? 'win-row' : ''}">
                                <td>${item.number || item.numbers}</td>
                                <td>${this.formatMoney(item.value)}</td>
                                <td>${item.hitCount || (item.isHit ? '✓' : '✗')}</td>
                                <td>${this.formatMoney(item.winAmount)}</td>
                                <td class="${item.profit >= 0 ? 'text-success' : 'text-danger'}">
                                    ${item.profit >= 0 ? '+' : ''}${this.formatMoney(item.profit)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2">Tổng</td>
                            <td>-</td>
                            <td>${this.formatMoney(detail.summary.totalWin)}</td>
                            <td class="${detail.summary.totalWin - detail.summary.totalBet >= 0 ? 'text-success' : 'text-danger'}">
                                ${this.formatMoney(detail.summary.totalWin - detail.summary.totalBet)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    toggleManualInput() {
        const manualInput = document.getElementById('manual-result-input');
        if (manualInput) {
            manualInput.style.display = manualInput.style.display === 'none' ? 'block' : 'none';
        }
    }

    selectAll() {
        document.querySelectorAll('.data-checkbox').forEach(cb => cb.checked = true);
    }

    deselectAll() {
        document.querySelectorAll('.data-checkbox').forEach(cb => cb.checked = false);
    }

    selectToday() {
        const today = new Date().toDateString();
        const data = this.dataManager.getAll();
        
        document.querySelectorAll('.data-checkbox').forEach(cb => {
            const item = data.find(d => d.id === cb.value);
            if (item) {
                const itemDate = new Date(item.createdAt).toDateString();
                cb.checked = itemDate === today;
            }
        });
    }

    setupEventListeners() {
        // Setup any additional event listeners
    }

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    formatMoney(value) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value).replace('₫', 'đ');
    }

    async exportResults() {
        // Implement export functionality
        window.app.notification.show('Tính năng đang phát triển', 'info');
    }

    async shareResults() {
        // Implement share functionality
        window.app.notification.show('Tính năng đang phát triển', 'info');
    }
}

// Make it available globally for onclick handlers
window.app = window.app || {};
window.app.calcModule = null;