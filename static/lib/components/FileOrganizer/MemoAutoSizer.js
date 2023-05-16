import React, { forwardRef, memo, useCallback, useEffect, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid } from 'react-window';
import { getItemIndex } from '../../utils';
const MemoGridItem = memo(({ columnIndex, rowIndex, style, data }) => {
    const index = getItemIndex(rowIndex, columnIndex, data.columnCount);
    const file = data.files[index];
    if (!file)
        return null;
    return data.renderItem(file, index, style);
});
const MemoGrid = memo(forwardRef(({ width, height, files, padding, renderItem, onColumnCountChange, size }, ref) => {
    const modifiedHeight = height - 2 * padding;
    const modifiedWidth = width - 2 * padding;
    const data = useMemo(() => {
        let columnCount = Math.floor(modifiedWidth / size.width);
        if (columnCount > files.length)
            columnCount = files.length;
        return { files, renderItem, columnCount };
    }, [modifiedWidth, size.width, files, renderItem]);
    useEffect(() => {
        onColumnCountChange(data.columnCount);
    }, [onColumnCountChange, data.columnCount]);
    return (React.createElement(FixedSizeGrid, { ref: ref, columnWidth: size.width, rowHeight: size.height, height: modifiedHeight, width: modifiedWidth, style: { padding, height, width }, columnCount: data.columnCount, rowCount: Math.ceil(files.length / data.columnCount), itemData: data, itemKey: ({ columnIndex, rowIndex }) => {
            const index = getItemIndex(rowIndex, columnIndex, data.columnCount);
            return files[index]?.id ?? index;
        } }, MemoGridItem));
}));
export const MemoAutoSizer = memo(forwardRef(({ files, padding, size, renderItem, onColumnCountChange }, ref) => {
    const onRenderGrid = useCallback(({ width, height }) => (React.createElement(MemoGrid, { padding: padding, ref: ref, width: width, height: height, files: files, size: size, renderItem: renderItem, onColumnCountChange: onColumnCountChange })), [padding, ref, files, size, renderItem, onColumnCountChange]);
    return React.createElement(AutoSizer, null, onRenderGrid);
}));
