export function getItemIndex(rowIndex, columnIndex, numColumns) {
    return rowIndex * numColumns + columnIndex;
}
export function getRowAndColumnIndex(index, numColumns) {
    return {
        rowIndex: Math.floor(index / numColumns),
        columnIndex: index % numColumns,
    };
}
