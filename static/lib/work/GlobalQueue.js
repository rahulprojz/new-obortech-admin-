import { getId } from '../utils';
const MAX_ACTIVE_UNITS = 1;
class QueueItem {
    constructor(id, unit) {
        this.cancelled = false;
        this.id = id;
        this.unit = unit;
    }
    process() {
        return this.unit();
    }
    cancel() {
        this.cancelled = true;
    }
}
class GlobalQueue {
    constructor() {
        this.queue = [];
        this.queueRefs = new Map();
        this._listeners = new Map();
        this._queueLength = 0;
        this._activeUnits = 0;
    }
    process(unit) {
        const id = getId();
        const item = new QueueItem(id, unit);
        this.queue.push(item);
        this.queueRefs.set(id, item);
        const p = new Promise((resolve, reject) => {
            this._listeners.set(id, (result) => {
                if (result instanceof Error) {
                    return reject(result);
                }
                resolve(result);
            });
        });
        this._queueLength++;
        this.flush();
        return [p, () => this.cancel(id)];
    }
    // Marks a unit of work as cancelled.
    // The unit will not be processed and will be removed
    // from the queue when no other work is going on
    cancel(id) {
        const ref = this.queueRefs.get(id);
        ref?.cancel();
        this.flush();
    }
    cleanup() {
        this.queue = this.queue.filter((item) => {
            const { cancelled, id } = item;
            if (cancelled) {
                this.queueRefs.delete(id);
                return false;
            }
            return true;
        });
        this._queueLength = this.queue.length;
    }
    async flush() {
        if (this._activeUnits === MAX_ACTIVE_UNITS)
            return;
        if (this._queueLength === 0) {
            this.cleanup();
            return;
        }
        const item = this.queue.shift();
        if (item?.cancelled) {
            this._queueLength--;
            this.flush();
            return;
        }
        // If no items left, return
        if (!item) {
            this.cleanup();
            return;
        }
        this._activeUnits++;
        let result;
        try {
            result = await item?.process();
        }
        catch (e) {
            result = new Error(e);
        }
        const id = item?.id;
        const callback = this._listeners.get(id);
        callback?.(result);
        this.queueRefs.delete(id);
        this._activeUnits--;
        this._queueLength--;
        this.flush();
    }
}
// Singleton
export default new GlobalQueue();
