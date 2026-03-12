import React from 'react';

import {Check, Crop, Grip, Xmark} from '@gravity-ui/icons';
import type {DraggingStyle, NotDraggingStyle} from 'react-beautiful-dnd';
import {Draggable} from 'react-beautiful-dnd';
import type {Area} from 'react-easy-crop/types';

import {CARD_WIDTH} from '../../constants/common';
import {useFormatContext} from '../../contexts/formatContext';
import type {FileConfig} from '../../types/common';
import {getImageMetadata, readFile} from '../../utils/read-file';
import {Cropper} from '../Cropper/Cropper';
import {CropperPreview} from '../CropperPreview/CropperPreview';

import styles from './DndItem.module.css';

type DndItemProps = {
    item: FileConfig;
    index: number;
    ratio: number;
    updateItems: (item: FileConfig) => void;
    outOfTemplate: boolean;
};

const grid = 8;

const getItemStyle = (
    isDragging: boolean,
    draggableStyle: DraggingStyle | NotDraggingStyle | undefined,
) => ({
    userSelect: 'none',
    margin: `0 ${grid}px 0 0`,

    opacity: isDragging ? 0.3 : 1,

    ...draggableStyle,
});

export const DndItem = ({item, index, updateItems, outOfTemplate}: DndItemProps) => {
    const {selectedFormat} = useFormatContext();
    const [croppedArea, setCroppedArea] = React.useState<Area>({
        x: 0,
        y: 0,
        height: 100,
        width: 100,
    });
    const [widthPixels, setWidthPixels] = React.useState(100);
    const {ratio} = selectedFormat;
    const [showCropper, setShowCropper] = React.useState(false);
    const [zoom, setZoom] = React.useState(1);

    const [imageSrc, setImageSrc] = React.useState<unknown>(null);

    React.useEffect(() => {
        const loadFile = async () => {
            const imgSrc = await readFile(item.data);
            const {width, height} = await getImageMetadata(item.data);
            const localRatio = width / height;
            setWidthPixels(width);

            if (localRatio < ratio) {
                const localHeight = (width / ratio / height) * 100;
                setCroppedArea({
                    ...croppedArea,
                    width: 100,
                    height: localHeight,
                });
            } else {
                const localWidth = ((height * ratio) / width) * 100;
                setCroppedArea({
                    ...croppedArea,
                    width: localWidth,
                    height: 100,
                });
            }

            setImageSrc(imgSrc);
        };

        loadFile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.data, ratio]);

    React.useEffect(() => {
        updateItems({
            ...item,
            config: {
                ...item.config,
                ...croppedArea,
                zoom,
            },
        });
    }, [croppedArea, item, updateItems, zoom]);

    const onCropComplete = React.useCallback(
        (localCroppedArea: Area, _localCroppedAreaPixels: Area) => {
            setCroppedArea(localCroppedArea);
        },
        [],
    );

    return (
        <Draggable draggableId={item.id} index={index}>
            {(provided, snapshot) => {
                return (
                    <div
                        className={styles.card}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                            ...(getItemStyle(
                                snapshot.isDragging,
                                provided.draggableProps.style,
                            ) as React.StyleHTMLAttributes<{}>),
                            aspectRatio: `${ratio}`,
                            minWidth: CARD_WIDTH,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <div
                                {...provided.dragHandleProps}
                                style={{
                                    backgroundColor: '#111111',
                                    border: '2px solid #ffffff',
                                    display: 'grid',
                                    alignItems: 'center',
                                    alignContent: 'center',
                                    textAlign: 'center',
                                    height: 36,
                                    zIndex: 3,
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: 36,
                                    padding: 8,
                                    margin: 8,
                                    borderRadius: '50%',
                                }}
                            >
                                <Grip style={{color: '#ffffff'}} fontSize={32} />
                            </div>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 2,
                                }}
                            >
                                <div>
                                    {croppedArea && (
                                        <CropperPreview
                                            widthPixels={widthPixels}
                                            croppedArea={croppedArea}
                                            img={imageSrc}
                                            outOfTemplate={outOfTemplate}
                                        />
                                    )}
                                </div>
                            </div>
                            <button
                                style={{
                                    backgroundColor: '#111111',
                                    border: '2px solid #ffffff',
                                    display: 'grid',
                                    alignItems: 'center',
                                    alignContent: 'center',
                                    textAlign: 'center',
                                    height: 36,
                                    zIndex: 3,
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 36,
                                    padding: 8,
                                    margin: 8,
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setShowCropper(true)}
                            >
                                <Crop style={{color: '#ffffff'}} fontSize={32} />
                            </button>
                        </div>
                        {showCropper && (
                            <div
                                style={{
                                    position: 'fixed',
                                    bottom: 0,
                                    width: '100vw',
                                    height: '100vh',
                                    // display: showCropper ? 'block' : 'none',
                                    backgroundColor: '#ffffff',
                                    zIndex: 1000,
                                    left: 0,
                                }}
                            >
                                <Cropper
                                    selectedFormat={selectedFormat}
                                    imageSrc={imageSrc}
                                    onCropComplete={onCropComplete}
                                    zoom={zoom}
                                    setZoom={setZoom}
                                    initialCroppedAreaPercentages={croppedArea}
                                />
                                <div className={styles.complete}>
                                    <button
                                        className={styles['complete-button']}
                                        onClick={() => {
                                            setShowCropper(false);
                                        }}
                                    >
                                        <span className={styles.icon}>
                                            <Check />
                                        </span>
                                        Complete
                                    </button>
                                </div>
                                <div className={styles.close}>
                                    <button
                                        className={styles['close-button']}
                                        onClick={() => {
                                            setShowCropper(false);
                                        }}
                                    >
                                        <span className={styles.icon}>
                                            <Xmark />
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }}
        </Draggable>
    );
};
