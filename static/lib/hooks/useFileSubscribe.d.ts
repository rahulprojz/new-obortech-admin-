/// <reference types="react" />
/// <reference types="@emotion/core" />
import { FileEventType, FileLike, MemoizedPromise } from '../data';
/**
 * Will subscribe to a value from a file and return the value, as well as any
 * async errors.
 * @param file The file to subscribe to.
 * @param getCurrentValue Function to extract the current value from the file.
 * @param eventType The event type to subscribe. Won't subscribe if not given.
 * @param throttle The timeout to throttle initial fetch of value. Default: 500ms.
 */
export declare function useFileSubscribe<F extends FileLike, T>(file: F, getCurrentValue: (file: F) => T | MemoizedPromise<T>, eventType?: FileEventType): readonly [T | undefined, any, import("react").Dispatch<import("react").SetStateAction<T | undefined>>];
