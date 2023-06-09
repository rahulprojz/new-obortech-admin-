import {
    Button,
    ButtonGroup,
    File,
    FileOrganizer,
    Spinner,
    Thumbnail,
    ThumbnailDragLayer,
    useManagedFiles,
} from '@pdftron/webviewer-react-toolkit';
import React, { useState } from 'react';
import { splitPages } from './pdfUtils';

function PdfEdit() {
    const [loading, setLoading] = useState(false);
    const { files, setFiles, draggingIds, fileOrganizerProps, getThumbnailSelectionProps } = useManagedFiles();

    const hasFiles = files.length > 0;

    const handleLoadPDF = async () => {
        // If called while files exist, clear the files.
        if (hasFiles) {
            return setFiles([]);
        }

        setLoading(true);

        // Set the source to point to your PDF. In this example, we have the PDF
        // inside of `public/assets`. You can add any path, or a URL to a PDF.
        const source = './New.pdf';

        const newFiles = await splitPages(source);

        setFiles(newFiles);
        setLoading(false);
    };

    return (
        <div className="app">
            <main className="app__main">
                {hasFiles ? (
                    <FileOrganizer
                        {...fileOrganizerProps}
                        className="organizer"
                        onRenderDragLayer={() => <ThumbnailDragLayer numFiles={draggingIds.length} />}
                        onRenderThumbnail={({ id, onRenderThumbnailProps }) => (
                            <Thumbnail {...getThumbnailSelectionProps(id)} {...onRenderThumbnailProps} />
                        )}
                    />
                ) : (
                        <div className="app__placeholder">{loading ? <Spinner /> : 'Click Load PDF to begin organizing pages.'}</div>
                    )}
            </main>
            <footer className="app__footer">
                <ButtonGroup>
                    <Button disabled={loading} buttonStyle="borderless" onClick={handleLoadPDF}>
                        {hasFiles ? 'Delete PDF' : 'Load PDF'}
                    </Button>
                    <Button disabled={loading || !hasFiles}>Download PDF</Button>
                </ButtonGroup>
            </footer>
        </div>
    );
}

export default PdfEdit;
