// Event Bus for Component Communication
export class EventBus {
    constructor() {
        this.events = {};
        this.onceEvents = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    once(event, callback) {
        if (!this.onceEvents[event]) {
            this.onceEvents[event] = [];
        }
        this.onceEvents[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;

        if (callback) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        } else {
            delete this.events[event];
        }
    }

    emit(event, ...args) {
        // Regular listeners
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }

        // Once listeners
        if (this.onceEvents[event]) {
            const callbacks = this.onceEvents[event];
            delete this.onceEvents[event];
            
            callbacks.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in once listener for ${event}:`, error);
                }
            });
        }
    }

    async emitAsync(event, ...args) {
        const promises = [];

        if (this.events[event]) {
            this.events[event].forEach(callback => {
                promises.push(Promise.resolve(callback(...args)));
            });
        }

        if (this.onceEvents[event]) {
            const callbacks = this.onceEvents[event];
            delete this.onceEvents[event];
            
            callbacks.forEach(callback => {
                promises.push(Promise.resolve(callback(...args)));
            });
        }

        return Promise.all(promises);
    }

    clear() {
        this.events = {};
        this.onceEvents = {};
    }
}