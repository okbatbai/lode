// Export/Import Manager
export class ExportManager {
    constructor() {
        this.formats = ['json', 'csv', 'excel', 'pdf'];
    }

    async export(data, format, options = {}) {
        switch (format) {
            case 'json':
                return this.exportJSON(data, options);
            case 'csv':
                return this.exportCSV(data, options);
            case 'excel':
                return this.exportExcel(data, options);
            case 'pdf':
                return this.exportPDF(data, options);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    exportJSON(data, options) {
        const exportData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            data: data,
            metadata: options.metadata || {}
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        
        return {
            blob,
            filename: this.generateFilename('json', options)
        };
    }

    exportCSV(data, options) {
        const headers = options.headers || this.getHeaders(data);
        const rows = data.map(item => this.itemToCSVRow(item, headers));
        
        const csv = [
            headers.map(h => this.escapeCSV(h.label)).join(','),
            ...rows.map(row => row.map(cell => this.escapeCSV(cell)).join(','))
        ].join('\n');

        // Add BOM for Excel UTF-8 support
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        
        return {
            blob,
            filename: this.generateFilename('csv', options)
        };
    }

    async exportExcel(data, options) {
        // Dynamically import XLSX library
        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        
        XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Data');
        
        // Style the worksheet
        this.styleExcelSheet(worksheet);
        
        const excelBuffer = XLSX.write(workbook, { 
            bookType: 'xlsx', 
            type: 'array' 
        });
        
        const blob = new Blob([excelBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        return {
            blob,
            filename: this.generateFilename('xlsx', options)
        };
    }

    async exportPDF(data, options) {
        // Create PDF document
        const doc = this.createPDFDocument(data, options);
        
        // Generate PDF blob
        const blob = await doc.getBlob();
        
        return {
            blob,
            filename: this.generateFilename('pdf', options)
        };
    }

    createPDFDocument(data, options) {
        // Create HTML content for PDF
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    h1 {
                        color: #333;
                        border-bottom: 2px solid #667eea;
                        padding-bottom: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #667eea;
                        color: white;
                    }
                    tr:nth-child(even) {
                        background-color: #f2f2f2;
                    }
                    .summary {
                        margin-top: 30px;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <h1>${options.title || 'Báo cáo Lô Đề'}</h1>
                <p>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
                
                ${this.generatePDFTable(data)}
                
                ${options.includeSummary ? this.generatePDFSummary(data) : ''}
            </body>
            </html>
        `;

        // Convert HTML to PDF using a library or browser print
        return this.htmlToPDF(html);
    }

    generatePDFTable(data) {
        const headers = this.getHeaders(data);
        
        return `
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${headers.map(h => `<td>${this.getItemValue(item, h.key)}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generatePDFSummary(data) {
        const summary = this.calculateSummary(data);
        
        return `
            <div class="summary">
                <h2>Tổng kết</h2>
                <p>Tổng số mục: <strong>${summary.totalItems}</strong></p>
                <p>Tổng giá trị: <strong>${this.formatMoney(summary.totalValue)}</strong></p>
                <p>Lô: <strong>${summary.lo}</strong></p>
                <p>Đề: <strong>${summary.de}</strong></p>
                <p>Xiên: <strong>${summary.xien}</strong></p>
                <p>3 Càng: <strong>${summary.cang3}</strong></p>
            </div>
        `;
    }

    async htmlToPDF(html) {
        // Use print functionality or a PDF library
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Trigger print dialog
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
        // Return a blob for consistency
        return new Blob([html], { type: 'text/html' });
    }

    // Import methods
    async import(file, format) {
        const content = await this.readFile(file);
        
        switch (format || this.detectFormat(file)) {
            case 'json':
                return this.importJSON(content);
            case 'csv':
                return this.importCSV(content);
            case 'excel':
                return this.importExcel(file);
            default:
                throw new Error('Unsupported import format');
        }
    }

    async importJSON(content) {
        try {
            const data = JSON.parse(content);
            
            if (!this.validateImportData(data)) {
                throw new Error('Invalid data structure');
            }
            
            return {
                success: true,
                data: data.data || data,
                metadata: data.metadata || {}
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async importCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return {
                success: false,
                error: 'CSV file is empty or invalid'
            };
        }

        const headers = this.parseCSVLine(lines[0]);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = values[index];
                });
                data.push(this.parseCSVItem(item));
            }
        }

        return {
            success: true,
            data
        };
    }

    async importExcel(file) {
        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
        
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        return {
            success: true,
            data: data.map(item => this.parseExcelItem(item))
        };
    }

    // Helper methods
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            
            if (file.type.includes('excel') || file.name.endsWith('.xlsx')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    detectFormat(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const typeMap = {
            'json': 'json',
            'csv': 'csv',
            'xlsx': 'excel',
            'xls': 'excel',
            'pdf': 'pdf'
        };
        
        return typeMap[extension] || 'unknown';
    }

    getHeaders(data) {
        if (data.length === 0) return [];
        
        const sample = data[0];
        return Object.keys(sample).map(key => ({
            key,
            label: this.formatHeaderLabel(key)
        }));
    }

    formatHeaderLabel(key) {
        const labels = {
            'so': 'Số',
            'giatri': 'Giá trị',
            'loai': 'Loại',
            'createdAt': 'Ngày tạo',
            'updatedAt': 'Ngày cập nhật'
        };
        
        return labels[key] || key;
    }

    itemToCSVRow(item, headers) {
        return headers.map(header => {
            const value = this.getItemValue(item, header.key);
            return this.formatCSVValue(value);
        });
    }

    getItemValue(item, key) {
        const value = item[key];
        
        if (value === null || value === undefined) {
            return '';
        }
        
        if (key === 'createdAt' || key === 'updatedAt') {
            return new Date(value).toLocaleString('vi-VN');
        }
        
        if (key === 'giatri') {
            return this.formatMoney(value);
        }
        
        return value.toString();
    }

    formatCSVValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        
        const stringValue = value.toString();
        
        // Remove any existing quotes and escape
        return stringValue.replace(/"/g, '""');
    }

    escapeCSV(value) {
        if (value === null || value === undefined) {
            return '';
        }
        
        const stringValue = value.toString();
        
        // Check if value needs to be quoted
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    parseCSVItem(item) {
        return {
            so: item['Số'] || item['so'],
            giatri: parseFloat(item['Giá trị'] || item['giatri']) || 0,
            loai: item['Loại'] || item['loai'] || 'lo'
        };
    }

    parseExcelItem(item) {
        return {
            so: item['Số'] || item['so'],
            giatri: parseFloat(item['Giá trị'] || item['giatri']) || 0,
            loai: item['Loại'] || item['loai'] || 'lo'
        };
    }

    styleExcelSheet(worksheet) {
        // Add styling to Excel worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + '1';
            if (!worksheet[address]) continue;
            
            worksheet[address].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "667EEA" } },
                alignment: { horizontal: "center" }
            };
        }
    }

    validateImportData(data) {
        if (!data) return false;
        
        const items = data.data || data;
        if (!Array.isArray(items)) return false;
        
        return items.every(item => 
            item.hasOwnProperty('so') &&
            item.hasOwnProperty('giatri') &&
            item.hasOwnProperty('loai')
        );
    }

    calculateSummary(data) {
        const summary = {
            totalItems: data.length,
            totalValue: 0,
            lo: 0,
            de: 0,
            xien: 0,
            cang3: 0
        };

        data.forEach(item => {
            summary.totalValue += item.giatri;
            summary[item.loai]++;
        });

        return summary;
    }

    formatMoney(value) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    }

    generateFilename(extension, options) {
        const prefix = options.prefix || 'lode';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${prefix}_${timestamp}.${extension}`;
    }

    // Batch export
    async exportBatch(datasets, format, options = {}) {
        const results = [];
        
        for (const dataset of datasets) {
            const result = await this.export(dataset.data, format, {
                ...options,
                prefix: dataset.name
            });
            results.push(result);
        }
        
        return results;
    }

    // Template export
    async exportWithTemplate(data, templateId) {
        const template = await this.loadTemplate(templateId);
        
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }
        
        return this.applyTemplate(data, template);
    }

    async loadTemplate(templateId) {
        // Load template from storage or server
        const templates = {
            'daily-report': {
                format: 'pdf',
                title: 'Báo cáo hàng ngày',
                includeSummary: true,
                includeChart: true
            },
            'simple-list': {
                format: 'csv',
                headers: ['so', 'giatri', 'loai']
            }
        };
        
        return templates[templateId];
    }

    applyTemplate(data, template) {
        return this.export(data, template.format, template);
    }
}