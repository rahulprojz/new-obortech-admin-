import { CoreControls } from '@pdftron/webviewer';
import { FileLike } from '../data';
/** The output of this hook is an object representing a file. */
interface FileHook<F> {
    /** The entire file class. */
    file: F;
    /** The file id. */
    id: string;
    /** The file originalName. */
    originalName: string;
    /** The file extension. */
    extension: string;
    /** The file name. */
    name?: string;
    /** The resolved file thumbnail or undefined until it is resolved. */
    thumbnail?: string;
    /** The resolved file fileObj or undefined until it is resolved. */
    fileObj?: Blob;
    /** The resolved file documentObj or undefined until it is resolved. */
    documentObj?: CoreControls.Document;
    errors: {
        name?: any;
        thumbnail?: any;
        fileObj?: any;
        documentObj?: any;
    };
}
/**
 * This hook converts a file class with async values into a React-friendly hook
 * with async values set to undefined until they are fetched.
 * @param file The file to convert to react observable values.
 */
export declare function useFile<F extends FileLike>(file: F): FileHook<F>;
export {};
