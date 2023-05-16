import React from 'react';
import { DndProvider } from 'react-dnd';
import MultiBackend from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/dist/cjs/HTML5toTouch';
export const DndMultiProvider = ({ children }) => {
    return (React.createElement(DndProvider, { backend: MultiBackend, options: HTML5toTouch }, children));
};
