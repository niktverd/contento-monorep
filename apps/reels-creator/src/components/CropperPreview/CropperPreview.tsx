import React from 'react';

import type {Area} from 'react-easy-crop/types';

import {CARD_WIDTH} from '../../constants/common';
import {useFormatContext} from '../../contexts/formatContext';

// import styles from './CropperPreview.module.css';

type CropperPreviewProps = {
    widthPixels: number;
    croppedArea: Area;
    img: unknown;
    outOfTemplate: boolean;
};

export const CropperPreview = ({
    croppedArea,
    img,
    widthPixels,
    outOfTemplate,
}: CropperPreviewProps) => {
    const {selectedFormat} = useFormatContext();

    const widthFloat = croppedArea.width / 100;

    const localScale = CARD_WIDTH / (widthPixels * widthFloat);

    const transform = {
        x: `${-croppedArea.x}%`,
        y: `${-croppedArea.y}%`,
        scale: localScale,
    };

    const imageStyle = {
        transformOrigin: 'top left',
        transform: `scale(${transform.scale}) translate(${transform.x}, ${transform.y})`,
        top: transform.x,
        left: transform.y,
        opacity: outOfTemplate ? 0.3 : 1,
    };

    return (
        <div className="output" style={{paddingBottom: `${100 / selectedFormat.ratio}%`}}>
            <img src={img as string} alt="" style={imageStyle} />
        </div>
    );
};
