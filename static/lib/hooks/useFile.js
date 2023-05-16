import { useMemo } from 'react';
import { useFileSubscribe } from './useFileSubscribe';
/**
 * This hook converts a file class with async values into a React-friendly hook
 * with async values set to undefined until they are fetched.
 * @param file The file to convert to react observable values.
 */
export function useFile(file) {
    const [name, nameErr] = useFileSubscribe(file, (f) => f.name, 'onnamechange');
    const [thumbnail, thumbnailErr] = useFileSubscribe(file, (f) => f.thumbnail, 'onthumbnailchange');
    const [fileObj, fileObjErr] = useFileSubscribe(file, (f) => f.fileObj, 'onfileobjchange');
    const [documentObj, documentObjErr] = useFileSubscribe(file, (f) => f.documentObj, 'ondocumentobjchange');
    const fileValue = useMemo(() => ({
        file,
        id: file.id,
        originalName: file.originalName,
        extension: file.extension,
        name,
        thumbnail,
        fileObj,
        documentObj,
        errors: {
            name: nameErr,
            thumbnail: thumbnailErr,
            fileObj: fileObjErr,
            documentObj: documentObjErr,
        },
    }), [documentObj, documentObjErr, file, fileObj, fileObjErr, name, nameErr, thumbnail, thumbnailErr]);
    return fileValue;
}
