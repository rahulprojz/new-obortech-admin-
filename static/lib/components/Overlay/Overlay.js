import { useEffect } from 'react';
import { createPortal } from 'react-dom';
function generateOverlayLayer() {
    let currentId = 1;
    const elements = new Set();
    const classes = {};
    const overlayRoot = document.createElement('div');
    overlayRoot.classList.add('ui__base', 'ui__overlay');
    const appendElement = () => document.body.appendChild(overlayRoot);
    const removeElement = () => document.body.removeChild(overlayRoot);
    const addClass = (className) => {
        if (!className)
            return;
        overlayRoot.classList.add(className);
        classes[className] = (classes[className] || 0) + 1;
    };
    const removeClass = (className) => {
        if (!className)
            return;
        classes[className] = (classes[className] || 0) - 1;
        if (classes[className] <= 0) {
            delete classes[className];
            overlayRoot.classList.remove(className);
        }
    };
    const add = (props) => {
        const id = currentId++;
        addClass(props.className);
        elements.add(id);
        if (elements.size === 1)
            appendElement();
        return () => {
            elements.delete(id);
            removeClass(props.className);
            if (elements.size === 0)
                removeElement();
        };
    };
    return (({ children, className }) => {
        useEffect(() => add({ className }), [className]);
        return createPortal(children, overlayRoot);
    });
}
let Overlay;
if (typeof window !== 'undefined') {
    Overlay = generateOverlayLayer();
}
else {
    Overlay = () => null;
}
export { Overlay };
