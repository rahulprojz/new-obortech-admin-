import React from 'react';
import { FixedSizeGrid } from 'react-window';
import { ObjectWithId } from '../../utils';
interface VirtualizedProps {
    files: ObjectWithId[];
    padding: number;
    size: {
        width: number;
        height: number;
    };
    onColumnCountChange: (newColumnCount: number) => void;
    renderItem: (file: any, index: number, style: React.CSSProperties | undefined) => JSX.Element;
}
export declare const MemoAutoSizer: React.MemoExoticComponent<React.ForwardRefExoticComponent<VirtualizedProps & React.RefAttributes<FixedSizeGrid>>>;
export {};
