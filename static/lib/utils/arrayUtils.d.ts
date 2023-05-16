import { ObjectWithId } from './constantUtils';
/**
 * Separates the ids from the main list and returns separated and remaining.
 * @param allItems All of the items, from which you will separate any matching ids.
 * @param separateIds IDs to separate into separate array.
 */
export declare function separateItemsById<I extends ObjectWithId>(allItems: I[], separateIds: string[]): [I[], I[]];
/**
 * Separates the ids from the main list, but also re-inserts the target back
 * into the remaining items and returns it if it exists. It will only search for
 * a target in the separated array.
 * @param allItems All of the items, from which you will separate any matching ids.
 * @param separateIds IDs to separate into separate array.
 * @param targetId The ID of the target item to re-insert back and return.
 */
export declare function separateItemsWithTarget<I extends ObjectWithId>(allItems: I[], separateIds: string[], targetId: string): [I[], I[], I | undefined];
export declare function moveMultiFromIndexToIndex<I extends ObjectWithId>(prev: I[], moveIds: string[], fromIndex: number, toIndex: number): I[];
