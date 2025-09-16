// Statistics Module with Charts
export class StatisticsModule {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.charts = {};
    }

    async render() {
        const container = document.getElementById('statistics-tab');
        if (!container) return;

        container.innerHTML = `
            <div class="statistics-layout">
                <!-- Date Range Selector -->
                <div class="date-range-selector">
                    <div class="date-input-group">
                        <label>Từ ngày:</label>
                        <input type="date" id="stats-date-from" value="${this.getDefaultFromDate()}">
                    </div>
                    <div class="date-input-group">
                        <label>Đến ngày:</label>
                        <input type="date" id="stats-date-to" value="${this.getDefaultToDate()}">
                    </div>
                    <button class="btn btn-primary" onclick="app.statsModule.updateStatistics()">
                        <i class="fas fa-sync"></i> Cập nhật
                    </button>
                </div>

                <!-- Statistics Cards -->
                <div class="stats-cards">
                    ${this.renderStatsCards()}
                </div>

                <!-- Charts Grid -->
                <div class="charts-grid">
                    <!-- Distribution Chart -->
                    <div class="chart-container">
                        <h3>Phân bố theo loại</h3>
                        <canvas id="distribution-chart"></canvas>
                    </div>

                    <!-- Trend Chart -->
                    <div class="chart-container">
                        <h3>Xu hướng theo thời gian</h3>
                        <canvas id="trend-chart"></canvas>
                    </div>

                    <!-- Top Numbers Chart -->
                    <div class="chart-container">
                        <h3>Top số nhiều nhất</h3>
                        <canvas id="top-numbers-chart"></canvas>
                    </div>

                    <!-- Value Distribution -->
                    <div class="chart-container">
                        <h3>Phân bố giá trị</h3>
                        <canvas id="value-distribution-chart"></canvas>
                    </div>
                </div>

                <!-- Detailed Tables -->
                <div class="stats-tables">
                    <!-- Frequency Table -->
                    <div class="stats-table-section">
                        <h3>Bảng tần suất</h3>
                        <div id="frequency-table"></div>
                    </div>

                    <!-- Pattern Analysis -->
                    <div class="stats-table-section">
                        <h3>Phân tích mẫu số</h3>
                        <div id="pattern-analysis"></div>
                    </div>
                </div>

                <!-- Export Options -->
                <div class="stats-export">
                    <h3>Xuất báo cáo</h3>
                    <div class="export-buttons">
                        <button class="btn btn-secondary" onclick="app.statsModule.exportReport('pdf')">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                        <button class="btn btn-secondary" onclick="app.statsModule.exportReport('excel')">
                            <i class="fas fa-file-excel"></i> Excel
                        </button>
                        <button class="btn btn-secondary" onclick="app.statsModule.exportReport('image')">
                            <i class="fas fa-image"></i> Hình ảnh
                        </button>
                    </div>
                </div>
            </div>
        `;

        await this.initializeCharts();
        this.updateStatistics();
    }

    renderStatsCards() {
        const stats = this.calculateStatistics();
        
        return `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalValue.toLocaleString()}đ</div>
                    <div class="stat-label">Tổng giá trị</div>
                    <div class="stat-change ${stats.valueChange >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-${stats.valueChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                        ${Math.abs(stats.valueChange)}%
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-dice"></i></div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalItems}</div>
                    <div class="stat-label">Tổng số mục</div>
                    <div class="stat-change ${stats.itemChange >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-${stats.itemChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                        ${Math.abs(stats.itemChange)}%
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                <div class="stat-content">
                    <div class="stat-value">${stats.mostFrequent}</div>
                    <div class="stat-label">Số xuất hiện nhiều nhất</div>
                    <div class="stat-detail">${stats.mostFrequentCount} lần</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calculator"></i></div>
                <div class="stat-content">
                    <div class="stat-value">${stats.averageValue.toLocaleString()}đ</div>
                    <div class="stat-label">Giá trị trung bình</div>
                    <div class="stat-detail">Mỗi mục</div>
                </div>
            </div>
        `;
    }

    async initializeCharts() {
        // Load Chart.js if not already loaded
        if (!window.Chart) {
            await this.loadChartJS();
        }

        // Initialize all charts
        this.initDistributionChart();
        this.initTrendChart();
        this.initTopNumbersChart();
        this.initValueDistributionChart();
    }

    async loadChartJS() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    initDistributionChart() {
        const ctx = document.getElementById('distribution-chart');
        if (!ctx) return;

        const data = this.getDistributionData();

        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#48bb78',
                        '#ed8936',
                        '#4299e1',
                        '#9f7aea'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    initTrendChart() {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        const data = this.getTrendData();

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Lô',
                        data: data.lo,
                        borderColor: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Đề',
                        data: data.de,
                        borderColor: '#ed8936',
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString() + 'đ'
                        }
                    }
                }
            }
        });
    }

    initTopNumbersChart() {
        const ctx = document.getElementById('top-numbers-chart');
        if (!ctx) return;

        const data = this.getTopNumbersData();

        this.charts.topNumbers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Số lần xuất hiện',
                    data: data.values,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    initValueDistributionChart() {
        const ctx = document.getElementById('value-distribution-chart');
        if (!ctx) return;

        const data = this.getValueDistributionData();

        this.charts.valueDistribution = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Phân bố giá trị',
                    data: data.points,
                    backgroundColor: 'rgba(102, 126, 234, 0.5)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Số'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Giá trị'
                        },
                        ticks: {
                            callback: (value) => value.toLocaleString() + 'đ'
                        }
                    }
                }
            }
        });
    }

    updateStatistics() {
        // Get date range
        const fromDate = document.getElementById('stats-date-from')?.value;
        const toDate = document.getElementById('stats-date-to')?.value;
        
        // Filter data
        const filteredData = this.filterDataByDateRange(fromDate, toDate);
        
        // Update charts
        this.updateCharts(filteredData);
        
        // Update tables
        this.updateFrequencyTable(filteredData);
        this.updatePatternAnalysis(filteredData);
    }

    filterDataByDateRange(fromDate, toDate) {
        const data = this.dataManager.getAll();
        
        if (!fromDate && !toDate) {
            return data;
        }
        
        const from = fromDate ? new Date(fromDate).getTime() : 0;
        const to = toDate ? new Date(toDate).getTime() + 86400000 : Date.now();
        
        return data.filter(item => {
            const itemDate = item.createdAt || 0;
            return itemDate >= from && itemDate <= to;
        });
    }

    updateCharts(data) {
        // Update distribution chart
        if (this.charts.distribution) {
            const distData = this.getDistributionData(data);
            this.charts.distribution.data.datasets[0].data = distData.values;
            this.charts.distribution.update();
        }
        
        // Update other charts similarly...
    }

    updateFrequencyTable(data) {
        const container = document.getElementById('frequency-table');
        if (!container) return;
        
        const frequency = this.calculateFrequency(data);
        const sorted = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        container.innerHTML = `
            <table class="frequency-table">
                <thead>
                    <tr>
                        <th>Số</th>
                        <th>Tần suất</th>
                        <th>Tỷ lệ</th>
                        <th>Biểu đồ</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(([num, count]) => {
                        const percentage = (count / data.length * 100).toFixed(2);
                        return `
                            <tr>
                                <td class="number-cell">${num}</td>
                                <td>${count}</td>
                                <td>${percentage}%</td>
                                <td>
                                    <div class="frequency-bar">
                                        <div class="frequency-fill" style="width: ${percentage}%"></div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    updatePatternAnalysis(data) {
        const container = document.getElementById('pattern-analysis');
        if (!container) return;
        
        const patterns = this.analyzePatterns(data);
        
        container.innerHTML = `
            <div class="pattern-grid">
                ${patterns.map(pattern => `
                    <div class="pattern-card">
                        <div class="pattern-name">${pattern.name}</div>
                        <div class="pattern-value">${pattern.value}</div>
                        <div class="pattern-description">${pattern.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    calculateStatistics() {
        const data = this.dataManager.getAll();
        const now = Date.now();
        const dayAgo = now - 86400000;
        
        const todayData = data.filter(item => item.createdAt >= dayAgo);
        const yesterdayData = data.filter(item => 
            item.createdAt >= dayAgo - 86400000 && item.createdAt < dayAgo
        );
        
        const todayValue = todayData.reduce((sum, item) => sum + item.giatri, 0);
        const yesterdayValue = yesterdayData.reduce((sum, item) => sum + item.giatri, 0);
        
        const valueChange = yesterdayValue > 0 
            ? ((todayValue - yesterdayValue) / yesterdayValue * 100).toFixed(1)
            : 0;
            
        const frequency = this.calculateFrequency(data);
        const mostFrequent = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])[0] || ['--', 0];
        
        return {
            totalValue: data.reduce((sum, item) => sum + item.giatri, 0),
            totalItems: data.length,
            averageValue: data.length > 0 
                ? Math.round(data.reduce((sum, item) => sum + item.giatri, 0) / data.length)
                : 0,
            valueChange: parseFloat(valueChange),
            itemChange: yesterdayData.length > 0
                ? ((todayData.length - yesterdayData.length) / yesterdayData.length * 100).toFixed(1)
                : 0,
            mostFrequent: mostFrequent[0],
            mostFrequentCount: mostFrequent[1]
        };
    }

    calculateFrequency(data) {
        const frequency = {};
        
        data.forEach(item => {
            const numbers = item.loai === 'xien' 
                ? item.so.split(',')
                : [item.so];
                
            numbers.forEach(num => {
                frequency[num] = (frequency[num] || 0) + 1;
            });
        });
        
        return frequency;
    }

    analyzePatterns(data) {
        const patterns = [];
        
        // Consecutive numbers
        const consecutive = this.findConsecutiveNumbers(data);
        patterns.push({
            name: 'Số liên tiếp',
            value: consecutive.count,
            description: consecutive.numbers.join(', ')
        });
        
        // Pairs
        const pairs = this.findPairs(data);
        patterns.push({
            name: 'Cặp số',
            value: pairs.count,
            description: pairs.pairs.slice(0, 5).join(', ')
        });
        
        // Hot/Cold analysis
        const hotCold = this.analyzeHotCold(data);
        patterns.push({
            name: 'Số nóng',
            value: hotCold.hot.length,
            description: hotCold.hot.slice(0, 5).join(', ')
        });
        
        patterns.push({
            name: 'Số lạnh',
            value: hotCold.cold.length,
            description: hotCold.cold.slice(0, 5).join(', ')
        });
        
        return patterns;
    }

    findConsecutiveNumbers(data) {
        const numbers = new Set();
        data.forEach(item => {
            if (item.loai !== 'xien') {
                numbers.add(parseInt(item.so));
            }
        });
        
        const sorted = Array.from(numbers).sort((a, b) => a - b);
        const consecutive = [];
        
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i + 1] - sorted[i] === 1) {
                consecutive.push(sorted[i].toString().padStart(2, '0'));
                if (i === sorted.length - 2) {
                    consecutive.push(sorted[i + 1].toString().padStart(2, '0'));
                }
            }
        }
        
        return {
            count: consecutive.length,
            numbers: [...new Set(consecutive)]
        };
    }

    findPairs(data) {
        const pairs = {};
        
        data.filter(item => item.loai === 'xien' && item.xienType === 2)
            .forEach(item => {
                const pair = item.so;
                pairs[pair] = (pairs[pair] || 0) + 1;
            });
        
        const sorted = Object.entries(pairs)
            .sort((a, b) => b[1] - a[1])
            .map(([pair]) => pair);
        
        return {
            count: sorted.length,
            pairs: sorted
        };
    }

    analyzeHotCold(data) {
        const frequency = this.calculateFrequency(data);
        const average = Object.values(frequency).reduce((a, b) => a + b, 0) / Object.keys(frequency).length;
        
        const hot = Object.entries(frequency)
            .filter(([_, count]) => count > average * 1.5)
            .sort((a, b) => b[1] - a[1])
            .map(([num]) => num);
            
        const cold = Object.entries(frequency)
            .filter(([_, count]) => count < average * 0.5)
            .sort((a, b) => a[1] - b[1])
            .map(([num]) => num);
        
        return { hot, cold };
    }

    getDistributionData(data = null) {
        const items = data || this.dataManager.getAll();
        const distribution = {
            lo: 0,
            de: 0,
            xien: 0,
            cang3: 0
        };
        
        items.forEach(item => {
            distribution[item.loai]++;
        });
        
        return {
            labels: ['Lô', 'Đề', 'Xiên', '3 Càng'],
            values: Object.values(distribution)
        };
    }

    getTrendData() {
        const data = this.dataManager.getAll();
        const last7Days = [];
        const now = Date.now();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now - i * 86400000);
            const dateStr = date.toLocaleDateString('vi-VN');
            
            const dayData = data.filter(item => {
                const itemDate = new Date(item.createdAt);
                return itemDate.toDateString() === date.toDateString();
            });
            
            last7Days.push({
                date: dateStr,
                lo: dayData.filter(d => d.loai === 'lo').reduce((sum, d) => sum + d.giatri, 0),
                de: dayData.filter(d => d.loai === 'de').reduce((sum, d) => sum + d.giatri, 0)
            });
        }
        
        return {
            labels: last7Days.map(d => d.date),
            lo: last7Days.map(d => d.lo),
            de: last7Days.map(d => d.de)
        };
    }

    getTopNumbersData() {
        const frequency = this.calculateFrequency(this.dataManager.getAll());
        const top10 = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        return {
            labels: top10.map(([num]) => num),
            values: top10.map(([_, count]) => count)
        };
    }

    getValueDistributionData() {
        const data = this.dataManager.getAll();
        
        return {
            points: data.map(item => ({
                x: parseInt(item.so),
                y: item.giatri
            }))
        };
    }

    getDefaultFromDate() {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    }

    getDefaultToDate() {
        return new Date().toISOString().split('T')[0];
    }

    async exportReport(format) {
        const { ExportManager } = await import('./ExportManager.js');
        const exporter = new ExportManager();
        
        // Prepare report data
        const reportData = {
            statistics: this.calculateStatistics(),
            frequency: this.calculateFrequency(this.dataManager.getAll()),
            patterns: this.analyzePatterns(this.dataManager.getAll()),
            charts: await this.captureCharts()
        };
        
        switch (format) {
            case 'pdf':
                await this.exportPDFReport(reportData, exporter);
                break;
            case 'excel':
                await this.exportExcelReport(reportData, exporter);
                break;
            case 'image':
                await this.exportImageReport();
                break;
        }
    }

    async captureCharts() {
        const charts = {};
        
        for (const [name, chart] of Object.entries(this.charts)) {
            if (chart) {
                charts[name] = chart.toBase64Image();
            }
        }
        
        return charts;
    }

    async exportPDFReport(data, exporter) {
        // Create PDF content
        const pdfContent = {
            title: 'Báo cáo thống kê Lô Đề',
            date: new Date().toLocaleDateString('vi-VN'),
            sections: [
                {
                    title: 'Tổng quan',
                    content: this.generateSummaryHTML(data.statistics)
                },
                {
                    title: 'Biểu đồ',
                    content: this.generateChartsHTML(data.charts)
                },
                {
                    title: 'Phân tích chi tiết',
                    content: this.generateAnalysisHTML(data)
                }
            ]
        };
        
        const result = await exporter.export([pdfContent], 'pdf', {
            title: 'Báo cáo thống kê'
        });
        
        this.downloadFile(result.blob, result.filename);
    }

    generateSummaryHTML(stats) {
        return `
            <div class="summary">
                <p>Tổng giá trị: <strong>${stats.totalValue.toLocaleString()}đ</strong></p>
                <p>Tổng số mục: <strong>${stats.totalItems}</strong></p>
                <p>Giá trị trung bình: <strong>${stats.averageValue.toLocaleString()}đ</strong></p>
                <p>Số xuất hiện nhiều nhất: <strong>${stats.mostFrequent}</strong> (${stats.mostFrequentCount} lần)</p>
            </div>
        `;
    }

    generateChartsHTML(charts) {
        return Object.entries(charts).map(([name, image]) => `
            <div class="chart">
                <h4>${this.formatChartName(name)}</h4>
                <img src="${image}" alt="${name}" style="max-width: 100%;">
            </div>
        `).join('');
    }

    formatChartName(name) {
        const names = {
            'distribution': 'Phân bố theo loại',
            'trend': 'Xu hướng theo thời gian',
            'topNumbers': 'Top số xuất hiện nhiều nhất',
            'valueDistribution': 'Phân bố giá trị'
        };
        return names[name] || name;
    }

    generateAnalysisHTML(data) {
        // Generate detailed analysis HTML
        return `
            <div class="analysis">
                <h4>Tần suất xuất hiện</h4>
                ${this.generateFrequencyTableHTML(data.frequency)}
                
                <h4>Phân tích mẫu số</h4>
                ${this.generatePatternsHTML(data.patterns)}
            </div>
        `;
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}