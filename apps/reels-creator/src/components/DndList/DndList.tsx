import React from 'react';

import {DragDropContext, Droppable} from 'react-beautiful-dnd';

import type {FileConfig} from '../../types/common';
import {DndItem} from '../DndItem/DndItem';

// import styles from './DndList.module.css';

type DndListProps = {
    items: FileConfig[];
    setItems: React.Dispatch<React.SetStateAction<FileConfig[]>>;
    ratio: number;
    updateItems: (item: FileConfig) => void;
    numberOfImages: number;
};

const grid = 8;

const getListStyle = (isDraggingOver: boolean) => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    display: 'flex',
    overflow: 'scroll',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reorder = (list: any[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

export const DndList = ({
    items,
    setItems,
    ratio = 1,
    updateItems,
    numberOfImages,
}: DndListProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onDragEnd = (result: any) => {
        if (!result.destination) {
            return;
        }

        const newItems = reorder(items, result.source.index, result.destination.index);
        setItems(newItems);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable" direction="horizontal">
                {(drpProvided, drpSnapshot) => (
                    <div
                        {...drpProvided.droppableProps}
                        ref={drpProvided.innerRef}
                        style={getListStyle(drpSnapshot.isDraggingOver)}
                    >
                        {items.map((item, index) => (
                            <DndItem
                                key={item.id}
                                item={item}
                                index={index}
                                ratio={ratio}
                                updateItems={updateItems}
                                outOfTemplate={index >= numberOfImages}
                            />
                        ))}
                        {drpProvided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};
