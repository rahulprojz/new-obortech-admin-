import { useEffect, useState } from 'react';
/**
 * Will return true if the user is using keyboard navigation, or false if they
 * are using their mouse. The returned value will be true if the Tab key was
 * used more recently than mouse click, and false if not. You can also provide
 * custom behavior by passing your own observable.
 * @param observable Optional custom observable.
 */
export function useAccessibleFocus(observable = tabObservable) {
    const [isUserTabbing, setIsUserTabbing] = useState(observable.value);
    useEffect(() => {
        return observable.subscribe(() => setIsUserTabbing(observable.value));
    }, [observable]);
    return isUserTabbing;
}
class AccessibleFocusObservable {
    constructor() {
        this._handleFirstTab = (event) => {
            if (event.key === 'Tab') {
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
const tabObservable = new AccessibleFocusObservable();
