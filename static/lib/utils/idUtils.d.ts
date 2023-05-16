/**
 * Generates a sequential string to use as a unique identifier. This should be
 * used over `getId` if you need to use it as a DOM id, or a React key.
 *
 * @param prefix Optional. Prefix for the string id.
 */
export declare function getStringId(prefix?: string): string;
export declare type UniqueIdentifier = symbol | string;
/**
 * Returns a Symbol to uniquely identify something. Will fallback to using
 * string.
 *
 * @param description Description of the Symbol. Used as string prefix if not supported.
 */
export declare function getId(description?: string | number): UniqueIdentifier;
