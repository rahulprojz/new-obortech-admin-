import { useMemo } from 'react';
import { getStringId } from '../utils';
/**
 * If an ID is not given, will generate and memoize an ID to use for a11y
 * or any other purpose.
 * @param id The optional ID provided by props.
 */
export function useID(id) {
    return useMemo(() => id || getStringId('label'), [id]);
}
