// Main UI Controller
export class UIController {
    constructor({ dataManager, eventBus, notification }) {
        this.dataManager = dataManager;
        this.eventBus = eventBus;
        this.notification = notification;
        this.currentView = 'grid';
        this.filters = {
            type: 'all',
            search: '',
            dateRange: null
        };
    }

    async initialize() {
        this.renderManagementTab();
        this.bindGlobalEvents();
        this.initializeComponents();
    }

    renderManagementTab() {
        const container = document.getElementById('management-tab');
        if (!container) return;

        container.innerHTML = `
            <div class="management-layout">
                <!-- Statistics Overview -->
                <div class="stats-overview">
                    ${this.renderStatistics()}
                </div>

                <!-- Toolbar -->
                <div class="toolbar">
                    <div class="toolbar-left">
                        <button class="btn btn-primary" onclick="app.ui.showQuickInput()">
                            <i class="fas fa-plus"></i> Thêm mới
                        </button>
                        <button class="btn btn-secondary" onclick="app.ui.showBulkInput()">
                            <i class="fas fa-list"></i> Nhập hàng loạt
                        </button>
                        <div class="view-switcher">
                            <button class="view-btn ${this.currentView === 'grid' ? 'active' : ''}" 
                                    onclick="app.ui.switchView('grid')">
                                <i class="fas fa-th"></i>
                            </button>
                            <button class="view-btn ${this.currentView === 'list' ? 'active' : ''}" 
                                    onclick="app.ui.switchView('list')">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="search-input" placeholder="Tìm kiếm..." 
                                   value="${this.filters.search}">
                        </div>
                        <select id="filter-type" class="filter-select">
                            <option value="all">Tất cả</option>
                            <option value="lo">Lô</option>
                            <option value="de">Đề</option>
                            <option value="xien">Xiên</option>
                            <option value="cang3">3 Càng</option>
                        </select>
                        <button class="btn btn-icon" onclick="app.ui.showMoreFilters()">
                            <i class="fas fa-filter"></i>
                        </button>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="content-area">
                    <div class="content-grid">
                        <!-- Number Grid -->
                        <div class="number-grid-section">
                            <h3><i class="fas fa-th"></i> Bảng 100 số</h3>
                            <div id="number-grid" class="number-grid">
                                ${this.renderNumberGrid()}
                            </div>
                        </div>

                        <!-- Data Display -->
                        <div class="data-display-section">
                            <h3><i class="fas fa-table"></i> Danh sách dữ liệu</h3>
                            <div id="data-display" class="data-display">
                                ${this.renderDataDisplay()}
                            </div>
                        </div>
                    </div>

                    <!-- Side Panel -->
                    <div class="side-panel">
                        <!-- Quick Stats -->
                        <div class="panel-section">
                            <h4><i class="fas fa-chart-pie"></i> Thống kê nhanh</h4>
                            <div id="quick-stats">
                                ${this.renderQuickStats()}
                            </div>
                        </div>

                        <!-- Recent History -->
                        <div class="panel-section">
                            <h4><i class="fas fa-history"></i> Lịch sử gần đây</h4>
                            <div id="recent-history" class="recent-history">
                                ${this.renderRecentHistory()}
                            </div>
                        </div>

                        <!-- Export Options -->
                        <div class="panel-section">
                            <h4><i class="fas fa-download"></i> Xuất dữ liệu</h4>
                            <div class="export-options">
                                ${this.renderExportOptions()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindManagementEvents();
    }

    renderStatistics() {
        const stats = this.dataManager.getStatistics();
        
        return `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-database"></i></div>
                <div class="stat-content">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Tổng mục</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-coins"></i></div>
                <div class="stat-content">
                    <div class="stat-value">${this.formatMoney(stats.totalValue)}</div>
                    <div class="stat-label">Tổng tiền</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-dice"></i></div>
                <div class="stat-content">
                    <div class="stat-value">${stats.byType.lo?.count || 0}</div>
                    <div class="stat-label">Lô</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-star"></i></div>
                <div class="stat-content">
                    <div class="stat-value">${stats.byType.de?.count || 0}</div>
                    <div class="stat-label">Đề</div>
                </div>
            </div>
        `;
    }

    renderNumberGrid() {
        const data = this.dataManager.getAll();
        const numberMap = new Map();

        // Group data by number
        data.forEach(item => {
            const key = item.so;
            if (!numberMap.has(key)) {
                numberMap.set(key, { lo: 0, de: 0, xien: 0, cang3: 0 });
            }
            numberMap.get(key)[item.loai] += item.giatri;
        });

        let html = '';
        for (let i = 0; i < 100; i++) {
            const num = i.toString().padStart(2, '0');
            const values = numberMap.get(num) || { lo: 0, de: 0, xien: 0, cang3: 0 };
            const hasData = Object.values(values).some(v => v > 0);
            
            html += `
                <div class="number-cell ${hasData ? 'has-data' : ''}" data-number="${num}">
                    <div class="number-value">${num}</div>
                    ${hasData ? `
                        <div class="number-info">
                            ${values.lo > 0 ? `<span class="badge-lo">${this.formatShortMoney(values.lo)}</span>` : ''}
                            ${values.de > 0 ? `<span class="badge-de">${this.formatShortMoney(values.de)}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        return html;
    }

    renderDataDisplay() {
        const data = this.getFilteredData();
        
        if (this.currentView === 'grid') {
            return this.renderDataGrid(data);
        } else {
            return this.renderDataList(data);
        }
    }

    renderDataGrid(data) {
        if (data.length === 0) {
            return '<div class="empty-state">Không có dữ liệu</div>';
        }

        return `
            <div class="data-grid">
                ${data.map(item => `
                    <div class="data-card" data-id="${item.id}">
                        <div class="card-header">
                            <span class="card-type badge-${item.loai}">${item.loai.toUpperCase()}</span>
                            <div class="card-actions">
                                <button onclick="app.ui.editItem('${item.id}')" class="btn-icon-small">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="app.ui.deleteItem('${item.id}')" class="btn-icon-small">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="card-number">${item.so}</div>
                            <div class="card-value">${this.formatMoney(item.giatri)}</div>
                        </div>
                        <div class="card-footer">
                            <small>${this.formatDate(item.createdAt)}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDataList(data) {
        if (data.length === 0) {
            return '<div class="empty-state">Không có dữ liệu</div>';
        }

        return `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Loại</th>
                            <th>Số</th>
                            <th>Giá trị</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((item, index) => `
                            <tr data-id="${item.id}">
                                <td>${index + 1}</td>
                                <td><span class="badge-${item.loai}">${item.loai.toUpperCase()}</span></td>
                                <td class="number-cell">${item.so}</td>
                                <td class="value-cell">${this.formatMoney(item.giatri)}</td>
                                <td>${this.formatDate(item.createdAt)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button onclick="app.ui.editItem('${item.id}')" class="btn-icon-small">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="app.ui.deleteItem('${item.id}')" class="btn-icon-small">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderQuickStats() {
        const stats = this.dataManager.getStatistics();
        const todayStats = stats.byDate[new Date().toLocaleDateString()] || { count: 0, value: 0 };

        return `
            <div class="quick-stat-item">
                <span class="stat-label">Hôm nay:</span>
                <span class="stat-value">${todayStats.count} mục</span>
            </div>
            <div class="quick-stat-item">
                <span class="stat-label">Giá trị:</span>
                <span class="stat-value">${this.formatMoney(todayStats.value)}</span>
            </div>
            <div class="chart-container">
                <canvas id="mini-chart"></canvas>
            </div>
        `;
    }

    renderRecentHistory() {
        const history = this.dataManager.getHistory(10);
        
        if (history.length === 0) {
            return '<div class="empty-state">Chưa có lịch sử</div>';
        }

        return `
            <div class="history-list">
                ${history.map(entry => `
                    <div class="history-item">
                        <div class="history-icon">
                            <i class="fas fa-${this.getActionIcon(entry.action)}"></i>
                        </div>
                        <div class="history-content">
                            <div class="history-action">${this.getActionText(entry.action)}</div>
                            <div class="history-time">${this.formatRelativeTime(entry.timestamp)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderExportOptions() {
        return `
            <div class="export-grid">
                <button class="export-btn" onclick="app.ui.exportData('clipboard')">
                    <i class="fas fa-clipboard"></i>
                    <span>Sao chép</span>
                </button>
                <button class="export-btn" onclick="app.ui.exportData('json')">
                    <i class="fas fa-file-code"></i>
                    <span>JSON</span>
                </button>
                <button class="export-btn" onclick="app.ui.exportData('csv')">
                    <i class="fas fa-file-csv"></i>
                    <span>CSV</span>
                </button>
                <button class="export-btn" onclick="app.ui.exportData('excel')">
                    <i class="fas fa-file-excel"></i>
                    <span>Excel</span>
                </button>
            </div>
            <div class="export-settings">
                <label class="checkbox-label">
                    <input type="checkbox" id="export-filter" checked>
                    <span>Chỉ xuất dữ liệu đã lọc</span>
                </label>
            </div>
        `;
    }

    // Event Handlers
    bindGlobalEvents() {
        // Search input
        document.addEventListener('input', (e) => {
            if (e.target.id === 'search-input') {
                this.filters.search = e.target.value;
                this.debounce(() => this.refresh(), 300)();
            }
        });

        // Filter select
        document.addEventListener('change', (e) => {
            if (e.target.id === 'filter-type') {
                this.filters.type = e.target.value;
                this.refresh();
            }
        });

        // Click outside to close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    }

    bindManagementEvents() {
        // Implement specific event bindings for management tab
    }

    // Quick Input Modal
    showQuickInput() {
        const modal = this.createModal({
            title: 'Thêm nhanh',
            content: `
                <div class="quick-input-form">
                    <div class="input-tabs">
                        <button class="input-tab active" data-type="single">Đơn lẻ</button>
                        <button class="input-tab" data-type="xien">Xiên</button>
                        <button class="input-tab" data-type="3cang">3 Càng</button>
                    </div>
                    
                    <div class="input-panel active" data-panel="single">
                        <div class="form-group">
                            <label>Số (00-99):</label>
                            <input type="text" id="quick-number" maxlength="2" 
                                   placeholder="VD: 12" autocomplete="off">
                        </div>
                        <div class="form-group">
                            <label>Giá trị:</label>
                            <input type="number" id="quick-value" min="1" 
                                   placeholder="VD: 50000">
                        </div>
                        <div class="form-group">
                            <label>Loại:</label>
                            <div class="radio-group">
                                <label>
                                    <input type="radio" name="quick-type" value="lo" checked>
                                    <span>Lô</span>
                                </label>
                                <label>
                                    <input type="radio" name="quick-type" value="de">
                                    <span>Đề</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="input-panel" data-panel="xien">
                        <div class="form-group">
                            <label>Nhập số (cách nhau bởi dấu cách):</label>
                            <input type="text" id="xien-numbers" 
                                   placeholder="VD: 12 34 56">
                        </div>
                        <div class="form-group">
                            <label>Giá trị:</label>
                            <input type="number" id="xien-value" min="1" 
                                   placeholder="VD: 50000">
                        </div>
                    </div>
                    
                    <div class="input-panel" data-panel="3cang">
                        <div class="form-group">
                            <label>Số 3 chữ số:</label>
                            <input type="text" id="cang3-number" maxlength="3" 
                                   placeholder="VD: 123">
                        </div>
                        <div class="form-group">
                            <label>Giá trị:</label>
                            <input type="number" id="cang3-value" min="1" 
                                   placeholder="VD: 50000">
                        </div>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="app.ui.closeModal()">Hủy</button>
                <button class="btn btn-primary" onclick="app.ui.submitQuickInput()">
                    <i class="fas fa-plus"></i> Thêm
                </button>
            `
        });

        // Bind tab switching
        modal.querySelectorAll('.input-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchInputTab(type);
            });
        });

        // Focus first input
        setTimeout(() => {
            modal.querySelector('input').focus();
        }, 100);
    }

    switchInputTab(type) {
        // Switch tabs
        document.querySelectorAll('.input-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        // Switch panels
        document.querySelectorAll('.input-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === type);
        });
    }

    submitQuickInput() {
        const activePanel = document.querySelector('.input-panel.active');
        const panelType = activePanel.dataset.panel;

        try {
            let item;

            switch (panelType) {
                case 'single':
                    item = {
                        so: document.getElementById('quick-number').value.padStart(2, '0'),
                        giatri: parseInt(document.getElementById('quick-value').value),
                        loai: document.querySelector('input[name="quick-type"]:checked').value
                    };
                    this.dataManager.add(item);
                    break;

                case 'xien':
                    const xienNumbers = document.getElementById('xien-numbers').value.trim().split(/\s+/);
                    const xienValue = parseInt(document.getElementById('xien-value').value);
                    
                    if (xienNumbers.length < 2 || xienNumbers.length > 4) {
                        throw new Error('Xiên phải có từ 2-4 số');
                    }

                    item = {
                        so: xienNumbers.map(n => n.padStart(2, '0')).join(','),
                        giatri: xienValue,
                        loai: 'xien',
                        xienType: xienNumbers.length
                    };
                    this.dataManager.add(item);
                    break;

                case '3cang':
                    const cang3Number = document.getElementById('cang3-number').value;
                    if (cang3Number.length !== 3) {
                        throw new Error('3 Càng phải có đúng 3 chữ số');
                    }

                    item = {
                        so: cang3Number,
                        giatri: parseInt(document.getElementById('cang3-value').value),
                        loai: 'cang3'
                    };
                    this.dataManager.add(item);
                    break;
            }

            this.notification.show('Đã thêm thành công!', 'success');
            this.closeModal();
            this.refresh();

        } catch (error) {
            this.notification.show(error.message, 'error');
        }
    }

    // Bulk Input Modal
    showBulkInput() {
        const modal = this.createModal({
            title: 'Nhập hàng loạt',
            size: 'large',
            content: `
                <div class="bulk-input-form">
                    <div class="form-group">
                        <label>Nhập dữ liệu (mỗi dòng một mục):</label>
                        <textarea id="bulk-input-text" rows="15" 
                                  placeholder="Ví dụ:\nlô 12x50000 34x30000\nđề 56x40000\nxiên 12 34x20000\n3c 789x10000"></textarea>
                    </div>
                    <div class="input-help">
                        <h4>Hướng dẫn:</h4>
                        <ul>
                            <li>Lô/Đề: <code>lô 12x50000</code> hoặc <code>đề 34x30000</code></li>
                            <li>Xiên: <code>xiên 12 34x20000</code> hoặc <code>xiên 12 34 56x30000</code></li>
                            <li>3 Càng: <code>3c 789x10000</code></li>
                            <li>Nhiều số cùng giá: <code>lô 12 34 56x50000</code></li>
                            <li>Quy tắc: <code>lô đầu9x50000</code> (90-99)</li>
                        </ul>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="app.ui.closeModal()">Hủy</button>
                <button class="btn btn-primary" onclick="app.ui.submitBulkInput()">
                    <i class="fas fa-upload"></i> Nhập dữ liệu
                </button>
            `
        });

        // Focus textarea
        setTimeout(() => {
            document.getElementById('bulk-input-text').focus();
        }, 100);
    }

    async submitBulkInput() {
        const text = document.getElementById('bulk-input-text').value.trim();
        if (!text) {
            this.notification.show('Vui lòng nhập dữ liệu', 'warning');
            return;
        }

        try {
            // Import InputParser module
            const { InputParser } = await import('../modules/InputParser.js');
            const parser = new InputParser();
            
            const results = parser.parseBulkInput(text);
            
            if (results.errors.length > 0) {
                const errorMessages = results.errors.map(e => `Dòng ${e.line}: ${e.error}`).join('\n');
                this.notification.show(`Có ${results.errors.length} lỗi:\n${errorMessages}`, 'warning');
            }

            if (results.items.length > 0) {
                const bulkResult = this.dataManager.bulkAdd(results.items);
                this.notification.show(`Đã thêm ${bulkResult.added.length} mục`, 'success');
                this.closeModal();
                this.refresh();
            }

        } catch (error) {
            this.notification.show(`Lỗi: ${error.message}`, 'error');
        }
    }

    // Edit Item
    async editItem(id) {
        const item = this.dataManager.findById(id);
        if (!item) {
            this.notification.show('Không tìm thấy mục này', 'error');
            return;
        }

        const modal = this.createModal({
            title: 'Chỉnh sửa',
            content: `
                <div class="edit-form">
                    <div class="form-group">
                        <label>Số:</label>
                        <input type="text" id="edit-number" value="${item.so}" 
                               ${item.loai === 'xien' ? 'readonly' : ''}>
                    </div>
                    <div class="form-group">
                        <label>Giá trị:</label>
                        <input type="number" id="edit-value" value="${item.giatri}" min="1">
                    </div>
                    <div class="form-group">
                        <label>Loại:</label>
                        <select id="edit-type" ${item.loai === 'xien' || item.loai === 'cang3' ? 'disabled' : ''}>
                            <option value="lo" ${item.loai === 'lo' ? 'selected' : ''}>Lô</option>
                            <option value="de" ${item.loai === 'de' ? 'selected' : ''}>Đề</option>
                            <option value="xien" ${item.loai === 'xien' ? 'selected' : ''}>Xiên</option>
                            <option value="cang3" ${item.loai === 'cang3' ? 'selected' : ''}>3 Càng</option>
                        </select>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="app.ui.closeModal()">Hủy</button>
                <button class="btn btn-primary" onclick="app.ui.submitEdit('${id}')">
                    <i class="fas fa-save"></i> Lưu
                </button>
            `
        });

        setTimeout(() => {
            document.getElementById('edit-value').focus();
            document.getElementById('edit-value').select();
        }, 100);
    }

    submitEdit(id) {
        try {
            const updates = {
                so: document.getElementById('edit-number').value,
                giatri: parseInt(document.getElementById('edit-value').value),
                loai: document.getElementById('edit-type').value
            };

            this.dataManager.update(id, updates);
            this.notification.show('Đã cập nhật thành công!', 'success');
            this.closeModal();
            this.refresh();

        } catch (error) {
            this.notification.show(`Lỗi: ${error.message}`, 'error');
        }
    }

    // Delete Item
    async deleteItem(id) {
        const confirmed = await this.confirm('Bạn có chắc muốn xóa mục này?');
        if (!confirmed) return;

        try {
            this.dataManager.remove(id);
            this.notification.show('Đã xóa thành công!', 'success');
            this.refresh();
        } catch (error) {
            this.notification.show(`Lỗi: ${error.message}`, 'error');
        }
    }

    // Export Data
    async exportData(format) {
        try {
            const filterEnabled = document.getElementById('export-filter')?.checked;
            const data = filterEnabled ? this.getFilteredData() : this.dataManager.getAll();

            if (data.length === 0) {
                this.notification.show('Không có dữ liệu để xuất', 'warning');
                return;
            }

            switch (format) {
                case 'clipboard':
                    await this.exportToClipboard(data);
                    break;
                case 'json':
                    await this.exportToJSON(data);
                    break;
                case 'csv':
                    await this.exportToCSV(data);
                    break;
                case 'excel':
                    await this.exportToExcel(data);
                    break;
            }

            this.notification.show('Xuất dữ liệu thành công!', 'success');

        } catch (error) {
            this.notification.show(`Lỗi xuất dữ liệu: ${error.message}`, 'error');
        }
    }

    async exportToClipboard(data) {
        const text = data.map(item => 
            `${item.loai} ${item.so}x${item.giatri}`
        ).join('\n');

        await navigator.clipboard.writeText(text);
    }

    async exportToJSON(data) {
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, 'lode-data.json', 'application/json');
    }

    async exportToCSV(data) {
        const csv = this.dataManager.convertToCSV(data);
        this.downloadFile(csv, 'lode-data.csv', 'text/csv');
    }

    async exportToExcel(data) {
        // Implement Excel export using a library like SheetJS
        this.notification.show('Tính năng đang phát triển', 'info');
    }

    // View Management
    switchView(view) {
        this.currentView = view;
        this.refresh();
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.onclick.toString().includes(view));
        });
    }

    // Filter Management
    getFilteredData() {
        let data = this.dataManager.getAll();

        // Filter by type
        if (this.filters.type !== 'all') {
            data = data.filter(item => item.loai === this.filters.type);
        }

        // Filter by search
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            data = data.filter(item => 
                item.so.includes(search) ||
                item.loai.includes(search) ||
                item.giatri.toString().includes(search)
            );
        }

        // Filter by date range
        if (this.filters.dateRange) {
            const { start, end } = this.filters.dateRange;
            data = data.filter(item => 
                item.createdAt >= start && item.createdAt <= end
            );
        }

        return data;
    }

    showMoreFilters() {
        const modal = this.createModal({
            title: 'Bộ lọc nâng cao',
            content: `
                <div class="advanced-filters">
                    <div class="form-group">
                        <label>Khoảng thời gian:</label>
                        <div class="date-range">
                            <input type="date" id="filter-date-start">
                            <span>đến</span>
                            <input type="date" id="filter-date-end">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Giá trị từ:</label>
                        <div class="value-range">
                            <input type="number" id="filter-value-min" min="0">
                            <span>đến</span>
                            <input type="number" id="filter-value-max" min="0">
                        </div>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="app.ui.clearFilters()">Xóa bộ lọc</button>
                <button class="btn btn-primary" onclick="app.ui.applyFilters()">Áp dụng</button>
            `
        });
    }

    applyFilters() {
        // Get filter values and apply
        const startDate = document.getElementById('filter-date-start').value;
        const endDate = document.getElementById('filter-date-end').value;
        
        if (startDate && endDate) {
            this.filters.dateRange = {
                start: new Date(startDate).getTime(),
                end: new Date(endDate).getTime() + 86400000 // End of day
            };
        }

        this.closeModal();
        this.refresh();
    }

    clearFilters() {
        this.filters = {
            type: 'all',
            search: '',
            dateRange: null
        };
        
        document.getElementById('search-input').value = '';
        document.getElementById('filter-type').value = 'all';
        
        this.closeModal();
        this.refresh();
    }

    // Modal Management
    createModal({ title, content, footer, size = 'medium' }) {
        this.closeModal(); // Close any existing modal

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal ${size}">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="app.ui.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${footer ? `
                    <div class="modal-footer">
                        ${footer}
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('modal-container').appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        return modal;
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (!modal) return;

        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.remove();
        });
    }

    async confirm(message) {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title: 'Xác nhận',
                content: `<p>${message}</p>`,
                footer: `
                    <button class="btn btn-secondary" onclick="app.ui.closeModal(); window.confirmResolve(false)">
                        Hủy
                    </button>
                    <button class="btn btn-primary" onclick="app.ui.closeModal(); window.confirmResolve(true)">
                        Xác nhận
                    </button>
                `
            });

            window.confirmResolve = resolve;
        });
    }

    // Refresh UI
    refresh() {
        const dataDisplay = document.getElementById('data-display');
        if (dataDisplay) {
            dataDisplay.innerHTML = this.renderDataDisplay();
        }

        const numberGrid = document.getElementById('number-grid');
        if (numberGrid) {
            numberGrid.innerHTML = this.renderNumberGrid();
        }

        const quickStats = document.getElementById('quick-stats');
        if (quickStats) {
            quickStats.innerHTML = this.renderQuickStats();
            this.initMiniChart();
        }

        const recentHistory = document.getElementById('recent-history');
        if (recentHistory) {
            recentHistory.innerHTML = this.renderRecentHistory();
        }

        this.updateStatistics();
    }

    updateStatistics() {
        const stats = this.dataManager.getStatistics();
        const statsContainer = document.querySelector('.stats-overview');
        if (statsContainer) {
            statsContainer.innerHTML = this.renderStatistics();
        }
    }

    initMiniChart() {
        // Initialize mini chart using Chart.js or similar
        // This is a placeholder for chart initialization
    }

    // Utility methods
    formatMoney(value) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value).replace('₫', 'đ');
    }

    formatShortMoney(value) {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`;
        }
        return value.toString();
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('vi-VN');
    }

    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        
        return this.formatDate(timestamp);
    }

    getActionIcon(action) {
        const icons = {
            'add': 'plus-circle',
            'update': 'edit',
            'remove': 'trash',
            'clear': 'eraser',
            'import': 'upload'
        };
        return icons[action] || 'circle';
    }

    getActionText(action) {
        const texts = {
            'add': 'Thêm mới',
            'update': 'Cập nhật',
            'remove': 'Xóa',
            'clear': 'Xóa tất cả',
            'import': 'Nhập dữ liệu'
        };
        return texts[action] || action;
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    focusSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    initializeComponents() {
        // Initialize any third-party components
        // Charts, date pickers, etc.
    }
}
