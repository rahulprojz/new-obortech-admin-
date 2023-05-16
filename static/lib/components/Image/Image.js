import classnames from 'classnames';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { futureableOrLazyToFuturable } from '../../data';
export const Image = forwardRef(({ src, pending, onRenderLoading, onRenderFallback, alt, className, ...imgProps }, ref) => {
    const sourceIsNotPromise = typeof src === 'string' || !src;
    const [loading, setLoading] = useState(!sourceIsNotPromise);
    const [source, setSource] = useState(sourceIsNotPromise ? src : undefined);
    const getSource = useCallback(async (srcGetter) => {
        setLoading(true);
        let fetchedSource = undefined;
        try {
            fetchedSource = await futureableOrLazyToFuturable(srcGetter);
        }
        catch { }
        setLoading(false);
        setSource(fetchedSource || undefined);
    }, []);
    useEffect(() => {
        if (sourceIsNotPromise) {
            setLoading(false);
            setSource(src || undefined);
            return;
        }
        getSource(src);
    }, [getSource, sourceIsNotPromise, src]);
    const imageClass = classnames('ui__image', className);
    if (loading || pending)
        return React.createElement(React.Fragment, null, onRenderLoading?.());
    if (!source)
        return React.createElement(React.Fragment, null, onRenderFallback?.());
    return React.createElement("img", Object.assign({}, imgProps, { alt: alt, src: source, className: imageClass, ref: ref }));
});
