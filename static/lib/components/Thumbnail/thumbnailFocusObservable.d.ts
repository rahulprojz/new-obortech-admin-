import { FocusObservable } from '../../hooks';
declare class ThumbnailFocusObservable implements FocusObservable {
    private _subscribers;
    private _isUserTabbing;
    constructor();
    get value(): boolean;
    subscribe(subscriber: () => void): () => void;
    private _unsubscribe;
    private _setIsUserTabbing;
    private _handleFirstTab;
    private _handleFirstMouse;
    private _tabToMouseListener;
    private _mouseToTabListener;
    private _removeAllListeners;
}
export declare const thumbnailFocusObservable: ThumbnailFocusObservable;
export {};
