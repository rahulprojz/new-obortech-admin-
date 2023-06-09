export const globalLicense = (() => {
    let l = undefined;
    return {
        set(newLicense) {
            l = newLicense;
        },
        get() {
            return l;
        },
    };
})();
/**
 * Convert a CoreControls Document into a Blob.
 * @param documentObj A CoreControls Document, or promise to get it.
 */
export async function documentToBlob(documentObj) {
    const fetchedDocument = await documentObj;
    const data = await fetchedDocument.getFileData();
    const arr = new Uint8Array(data);
    return new Blob([arr], { type: 'application/pdf' });
}
/**
 * Convert a Blob and extension into a CoreControls Document.
 * @param blob A Blob, or promise to get it.
 * @param extension The file extension of the provided Blob.
 * @param l License key. If not provided, will try to use global license.
 */
export async function blobToDocument(blob, extension, l) {
    const coreControls = window.CoreControls;
    const fetchedBlob = await blob;
    return await coreControls.createDocument(fetchedBlob, { extension, l: l || globalLicense.get() });
}
/**
 * Rotate a document 90 degrees.
 * @param documentObj A CoreControls Document, or promise to get it.
 * @param counterclockwise If provided, will rotate counterclockwise instead of
 * the default clockwise.
 */
export async function getRotatedDocument(documentObj, counterclockwise) {
    const coreControls = window.CoreControls;
    const fetchedDocument = await documentObj;
    const pageNumbers = Array.from({ length: fetchedDocument.getPageCount() }, (_, k) => k + 1);
    const rotation = counterclockwise ? coreControls.PageRotation.E_270 : coreControls.PageRotation.E_90;
    await fetchedDocument.rotatePages(pageNumbers, rotation);
    return fetchedDocument;
}
/**
 * Gets the thumbnail for a document.
 * @param documentObj A CoreControls Document, or promise to get it.
 * @param options Additional options for the function.
 */
export async function getThumbnail(documentObj, options = {}) {
    const { extension, pageNumber = 1 } = options;
    if (extension) {
        const supportedFiles = window.CoreControls?.SupportedFileFormats.CLIENT;
        if (supportedFiles && !supportedFiles.includes(extension))
            throw new Error('Unsupported file type.');
    }
    const url = async () => {
        const fetchedDocument = await documentObj;
        const canvas = await new Promise((resolve, reject) => {
            const callback = (result) => {
                if (!result)
                    return reject(result);
                resolve(result);
            };
            fetchedDocument.loadThumbnailAsync(pageNumber, callback);
        });
        const url = canvas.toDataURL();
        if (!url)
            throw new Error('Unable to get data url.');
        return url;
    };
    return url();
}
