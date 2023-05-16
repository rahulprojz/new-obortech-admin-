import { FC, HTMLAttributes, ReactText } from 'react';
import { EditableTextProps } from '../EditableText';
export interface FilePickerItem {
    key: ReactText;
    name: string;
    onRename?: EditableTextProps['onSave'];
    onDelete?: () => void;
    className?: string;
}
export interface FilePickerProps extends HTMLAttributes<HTMLDivElement> {
    items: FilePickerItem[];
}
export declare const FilePicker: FC<FilePickerProps>;
