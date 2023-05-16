export declare type Unit = () => Promise<any>;
declare class GlobalQueue {
    private queue;
    private queueRefs;
    private _listeners;
    private _queueLength;
    private _activeUnits;
    process<T>(unit: Unit): [Promise<T>, () => void];
    private cancel;
    private cleanup;
    private flush;
}
declare const _default: GlobalQueue;
export default _default;
