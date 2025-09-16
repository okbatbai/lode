// Notification System with Queue
export class NotificationManager {
    constructor() {
        this.container = null;
        this.queue = [];
        this.maxNotifications = 5;
        this.defaultDuration = 3000;
        this.initialize();
    }

    initialize() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.createContainer();
        }
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', options = {}) {
        const notification = {
            id: this.generateId(),
            message,
            type,
            duration: options.duration || this.defaultDuration,
            persistent: options.persistent || false,
            actions: options.actions || null,
            icon: options.icon || this.getDefaultIcon(type)
        };

        this.queue.push(notification);
        this.processQueue();

        return notification.id;
    }

    processQueue() {
        const activeNotifications = this.container.querySelectorAll('.notification:not(.removing)');
        
        if (activeNotifications.length >= this.maxNotifications) {
            // Remove oldest non-persistent notification
            const toRemove = Array.from(activeNotifications).find(n => !n.dataset.persistent);
            if (toRemove) {
                this.remove(toRemove.dataset.id);
            }
        }

        while (this.queue.length > 0 && this.container.querySelectorAll('.notification:not(.removing)').length < this.maxNotifications) {
            const notification = this.queue.shift();
            this.render(notification);
        }
    }

    render(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.id = notification.id;
        element.dataset.persistent = notification.persistent;

        element.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${notification.icon}"></i>
                <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                ${notification.actions ? `
                    <div class="notification-actions">
                        ${notification.actions.map(action => `
                            <button class="notification-action" data-action="${action.id}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <button class="notification-close" data-id="${notification.id}">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Bind events
        element.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification.id);
        });

        if (notification.actions) {
            element.querySelectorAll('.notification-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = notification.actions.find(a => a.id === e.target.dataset.action);
                    if (action && action.callback) {
                        action.callback();
                    }
                    if (!action.keepOpen) {
                        this.remove(notification.id);
                    }
                });
            });
        }

        // Add to container
        this.container.appendChild(element);

        // Animate in
        requestAnimationFrame(() => {
            element.classList.add('show');
        });

        // Auto remove if not persistent
        if (!notification.persistent && notification.duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, notification.duration);
        }
    }

    remove(id) {
        const element = this.container.querySelector(`[data-id="${id}"]`);
        if (!element) return;

        element.classList.add('removing');
        element.classList.remove('show');

        setTimeout(() => {
            element.remove();
            this.processQueue();
        }, 300);
    }

    clear() {
        this.queue = [];
        this.container.querySelectorAll('.notification').forEach(n => {
            this.remove(n.dataset.id);
        });
    }

    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    getDefaultIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'bell';
    }

    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}