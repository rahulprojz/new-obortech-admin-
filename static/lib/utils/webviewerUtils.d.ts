import { CoreControls } from '@pdftron/webviewer';
import { Futurable } from '../data';
export declare const globalLicense: {
    set(newLicense: string): void;
    get(): string | undefined;
};
/**
 * Convert a CoreControls Document into a Blob.
 * @param documentObj A CoreControls Document, or promise to get it.
 */
export declare function documentToBlob(documentObj: Futurable<CoreControls.Document>): Promise<Blob>;
/**
 * Convert a Blob and extension into a CoreControls Document.
 * @param blob A Blob, or promise to get it.
 * @param extension The file extension of the provided Blob.
 * @param l License key. If not provided, will try to use global license.
 */
export declare function blobToDocument(blob: Futurable<Blob>, extension: string, l?: string): Promise<CoreControls.Document>;
/**
 * Rotate a document 90 degrees.
 * @param documentObj A CoreControls Document, or promise to get it.
 * @param counterclockwise If provided, will rotate counterclockwise instead of
 * the default clockwise.
 */
export declare function getRotatedDocument(documentObj: Futurable<CoreControls.Document>, counterclockwise?: boolean): Promise<CoreControls.Document>;
declare type GetThumbnailOptions = {
    extension?: string;
    pageNumber?: number;
};
/**
 * Gets the thumbnail for a document.
 * @param documentObj A CoreControls Document, or promise to get it.
 * @param options Additional options for the function.
 */
export declare function getThumbnail(documentObj: Futurable<CoreControls.Document>, options?: GetThumbnailOptions): Promise<string>;
export {};
