/**
 * Will return true if the user is using keyboard navigation, or false if they
 * are using their mouse. The returned value will be true if the Tab key was
 * used more recently than mouse click, and false if not. You can also provide
 * custom behavior by passing your own observable.
 * @param observable Optional custom observable.
 */
export declare function useAccessibleFocus(observable?: FocusObservable): boolean;
export interface FocusObservable {
    value: boolean;
    subscribe(subscriber: () => void): void;
}
