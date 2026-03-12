import React from 'react';

import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import ReactCropper from 'react-easy-crop';
import type {Area} from 'react-easy-crop/types';

import type {FormatType} from '../../types/common';

import styles from './Cropper.module.css';

const maxZoom = 10;
const minZoom = 1;
const zoomSpeed = 0.05;

type CropperProps = {
    selectedFormat: FormatType;
    // selectedFile: FileConfig | null;
    imageSrc: unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCropComplete: (localCroppedArea: any, localcroppedAreaPixels: any) => void;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    initialCroppedAreaPercentages: Area | null;
};

export const Cropper = ({
    selectedFormat,
    // selectedFile,
    imageSrc,
    onCropComplete,
    zoom,
    setZoom,
    initialCroppedAreaPercentages,
}: CropperProps) => {
    const [crop, setCrop] = React.useState({x: 0, y: 0});
    const [rotation, setRotation] = React.useState(0);

    return (
        <div>
            <div className={styles.cropper}>
                <ReactCropper
                    image={imageSrc as string}
                    crop={crop}
                    rotation={rotation}
                    zoom={zoom}
                    minZoom={minZoom}
                    maxZoom={maxZoom}
                    zoomSpeed={zoomSpeed}
                    aspect={selectedFormat.ratio || 1}
                    onCropChange={setCrop}
                    onRotationChange={(value: number) => setRotation(value)}
                    onCropComplete={onCropComplete}
                    onZoomChange={(value: number) => setZoom(value)}
                    initialCroppedAreaPercentages={initialCroppedAreaPercentages || undefined}
                />
            </div>

            <div className={styles.controls}>
                <div>
                    <Typography variant="overline">Zoom ({zoom.toFixed(2)})</Typography>
                    <Slider
                        value={zoom}
                        min={minZoom}
                        max={maxZoom}
                        step={zoomSpeed}
                        aria-labelledby="Zoom"
                        onChange={(_e, localZoom) => setZoom(localZoom as number)}
                    />
                </div>
            </div>
        </div>
    );
};
