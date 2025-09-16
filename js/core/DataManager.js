// Data Management Core
export class DataManager {
    constructor(storage, eventBus) {
        this.storage = storage;
        this.eventBus = eventBus;
        this.data = [];
        this.history = [];
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;
    }

    async loadData() {
        try {
            const savedData = await this.storage.get('lodeData');
            if (savedData) {
                this.data = savedData.data || [];
                this.history = savedData.history || [];
            }
            return true;
        } catch (error) {
            console.error('Failed to load data:', error);
            return false;
        }
    }

    async save() {
        try {
            const dataToSave = {
                data: this.data,
                history: this.history,
                timestamp: Date.now()
            };
            await this.storage.set('lodeData', dataToSave);
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return false;
        }
    }

    add(item) {
        // Save state for undo
        this.saveState();

        // Validate item
        if (!this.validateItem(item)) {
            throw new Error('Invalid item data');
        }

        // Add item
        const newItem = {
            ...item,
            id: this.generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.data.push(newItem);
        this.addToHistory('add', newItem);
        this.eventBus.emit('data:added', newItem);
        this.eventBus.emit('data:changed');

        return newItem;
    }

    update(id, updates) {
        this.saveState();

        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('Item not found');
        }

        const oldItem = { ...this.data[index] };
        const updatedItem = {
            ...oldItem,
            ...updates,
            updatedAt: Date.now()
        };

        this.data[index] = updatedItem;
        this.addToHistory('update', { old: oldItem, new: updatedItem });
        this.eventBus.emit('data:updated', updatedItem);
        this.eventBus.emit('data:changed');

        return updatedItem;
    }

    remove(id) {
        this.saveState();

        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('Item not found');
        }

        const removedItem = this.data.splice(index, 1)[0];
        this.addToHistory('remove', removedItem);
        this.eventBus.emit('data:removed', removedItem);
        this.eventBus.emit('data:changed');

        return removedItem;
    }

    bulkAdd(items) {
        this.saveState();

        const addedItems = [];
        const errors = [];

        items.forEach((item, index) => {
            try {
                const newItem = this.add(item);
                addedItems.push(newItem);
            } catch (error) {
                errors.push({ index, error: error.message });
            }
        });

        return { added: addedItems, errors };
    }

    clear() {
        this.saveState();
        const oldData = [...this.data];
        this.data = [];
        this.addToHistory('clear', oldData);
        this.eventBus.emit('data:cleared');
        this.eventBus.emit('data:changed');
    }

    find(query) {
        return this.data.filter(item => {
            return Object.entries(query).every(([key, value]) => {
                return item[key] === value;
            });
        });
    }

    findById(id) {
        return this.data.find(item => item.id === id);
    }

    getAll() {
        return [...this.data];
    }

    getStatistics() {
        const stats = {
            total: this.data.length,
            byType: {},
            totalValue: 0,
            byDate: {}
        };

        this.data.forEach(item => {
            // By type
            if (!stats.byType[item.loai]) {
                stats.byType[item.loai] = { count: 0, value: 0 };
            }
            stats.byType[item.loai].count++;
            stats.byType[item.loai].value += item.giatri;

            // Total value
            stats.totalValue += item.giatri;

            // By date
            const date = new Date(item.createdAt).toLocaleDateString();
            if (!stats.byDate[date]) {
                stats.byDate[date] = { count: 0, value: 0 };
            }
            stats.byDate[date].count++;
            stats.byDate[date].value += item.giatri;
        });

        return stats;
    }

    // Undo/Redo functionality
    saveState() {
        const state = JSON.stringify(this.data);
        this.undoStack.push(state);
        
        // Limit stack size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        
        // Clear redo stack on new action
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return false;

        const currentState = JSON.stringify(this.data);
        this.redoStack.push(currentState);

        const previousState = this.undoStack.pop();
        this.data = JSON.parse(previousState);
        
        this.eventBus.emit('data:changed');
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;

        const currentState = JSON.stringify(this.data);
        this.undoStack.push(currentState);

        const nextState = this.redoStack.pop();
        this.data = JSON.parse(nextState);
        
        this.eventBus.emit('data:changed');
        return true;
    }

    // History management
    addToHistory(action, data) {
        const entry = {
            id: this.generateId(),
            action,
            data,
            timestamp: Date.now()
        };

        this.history.unshift(entry);

        // Limit history size
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }
    }

    getHistory(limit = 50) {
        return this.history.slice(0, limit);
    }

    // Validation
    validateItem(item) {
        const required = ['so', 'giatri', 'loai'];
        
        for (const field of required) {
            if (!item[field]) {
                return false;
            }
        }

        // Validate types
        if (typeof item.giatri !== 'number' || item.giatri <= 0) {
            return false;
        }

        if (!['lo', 'de', 'xien', 'cang3'].includes(item.loai)) {
            return false;
        }

        // Validate number format
        if (item.loai === 'lo' || item.loai === 'de') {
            if (!/^\d{2}$/.test(item.so)) {
                return false;
            }
        }

        return true;
    }

    // Utilities
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Export/Import
    async exportData(format = 'json') {
        const exportData = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            data: this.data,
            history: this.history
        };

        switch (format) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'csv':
                return this.convertToCSV(exportData.data);
            case 'excel':
                // Implement Excel export
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    async importData(fileContent, format = 'json') {
        try {
            let importedData;

            switch (format) {
                case 'json':
                    importedData = JSON.parse(fileContent);
                    break;
                case 'csv':
                    importedData = this.parseCSV(fileContent);
                    break;
                default:
                    throw new Error(`Unsupported import format: ${format}`);
            }

            // Validate imported data
            if (!this.validateImportData(importedData)) {
                throw new Error('Invalid import data structure');
            }

            // Save current state for rollback
            const backup = {
                data: [...this.data],
                history: [...this.history]
            };

            try {
                // Import data
                this.data = importedData.data || [];
                this.history = importedData.history || [];
                
                await this.save();
                this.eventBus.emit('data:imported');
                this.eventBus.emit('data:changed');
                
                return { success: true, count: this.data.length };
            } catch (error) {
                // Rollback on error
                this.data = backup.data;
                this.history = backup.history;
                throw error;
            }
        } catch (error) {
            console.error('Import failed:', error);
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    validateImportData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.data)) return false;
        
        // Validate each item
        return data.data.every(item => this.validateItem(item));
    }

    convertToCSV(data) {
        const headers = ['Số', 'Giá trị', 'Loại', 'Ngày tạo'];
        const rows = data.map(item => [
            item.so,
            item.giatri,
            item.loai,
            new Date(item.createdAt).toLocaleString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csvContent;
    }

    parseCSV(csvContent) {
        // Implement CSV parsing
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length !== headers.length) continue;

            const item = {
                so: values[0],
                giatri: parseFloat(values[1]),
                loai: values[2]
            };

            if (this.validateItem(item)) {
                data.push(item);
            }
        }

        return { data };
    }
}