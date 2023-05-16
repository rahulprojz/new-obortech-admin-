const validKeys = [
    // Valid keys for thumbnail accessibility.
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
];
class ThumbnailFocusObservable {
    constructor() {
        this._handleFirstTab = (event) => {
            if (validKeys.includes(event.key)) {
                this._setIsUserTabbing(true);
                this._tabToMouseListener();
            }
        };
        this._handleFirstMouse = () => {
            this._setIsUserTabbing(false);
            this._mouseToTabListener();
        };
        this._subscribers = [];
        this._isUserTabbing = false;
    }
    get value() {
        return this._isUserTabbing;
    }
    subscribe(subscriber) {
        // If adding first subscriber, begin listening to document.
        if (this._subscribers.length === 0) {
            if (this._isUserTabbing) {
                this._tabToMouseListener();
            }
            else {
                this._mouseToTabListener();
            }
        }
        const exists = this._subscribers.includes(subscriber);
        if (!exists)
            this._subscribers.push(subscriber);
        return this._unsubscribe(subscriber);
    }
    _unsubscribe(subscriber) {
        return () => {
            this._subscribers = this._subscribers.filter((s) => s !== subscriber);
            // If no subscribers, stop listening to document.
            if (this._subscribers.length === 0)
                this._removeAllListeners();
        };
    }
    _setIsUserTabbing(isUserTabbing) {
        this._isUserTabbing = isUserTabbing;
        this._subscribers.forEach((subscriber) => subscriber());
    }
    _tabToMouseListener() {
        window.removeEventListener('keydown', this._handleFirstTab);
        window.addEventListener('mousedown', this._handleFirstMouse);
    }
    _mouseToTabListener() {
        window.removeEventListener('mousedown', this._handleFirstMouse);
        window.addEventListener('keydown', this._handleFirstTab);
    }
    _removeAllListeners() {
        window.removeEventListener('mousedown', this._handleFirstMouse);
        window.removeEventListener('keydown', this._handleFirstTab);
    }
}
export const thumbnailFocusObservable = new ThumbnailFocusObservable();
