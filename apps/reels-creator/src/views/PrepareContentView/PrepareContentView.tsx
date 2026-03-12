import React from 'react';

import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import Link from 'next/link';
import {useRouter} from 'next/router';
import type {Area} from 'react-easy-crop/types';

import {DndList} from '../../components/DndList/DndList';
import {maxLong, minLong} from '../../constants/common';
import {useFormatContext} from '../../contexts/formatContext';
import {templates} from '../../templates';
import type {FileConfig} from '../../types/common';

import styles from './PrepareContentView.module.css';

type PrepareContentViewProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onFileChange: (e: any) => Promise<void>;
    selectedTemplate: string | null;
    imgFiles: FileConfig[];
    selectedFile: FileConfig | null;
    setImgFiles: React.Dispatch<React.SetStateAction<FileConfig[]>>;
    setSelectedFile: React.Dispatch<React.SetStateAction<FileConfig | null>>;
    onCropComplete: (_croppedArea: Area, localcroppedAreaPixels: Area) => void;
    changeResolution: (oldLong?: number, step?: number, tryNotChange?: boolean) => void;
    width: number;
    height: number;
    showCroppedImage: () => Promise<void>;
    ratio: number;
    updateItems: (item: FileConfig) => void;
    isCreating: boolean;
};

export const PrepareContentView = ({
    selectedTemplate,
    onFileChange,
    imgFiles,
    setImgFiles,
    changeResolution,
    width,
    height,
    showCroppedImage,
    ratio,
    updateItems,
    isCreating,
}: PrepareContentViewProps) => {
    const router = useRouter();
    const {selectedFormat} = useFormatContext();
    const [resolution, setResolution] = React.useState(maxLong);
    const [shouldBeRedirected, setShouldBeRedirected] = React.useState(false);

    const numberOfImages = selectedTemplate ? templates[selectedTemplate]?.images?.length : 0;

    React.useEffect(() => {
        if (shouldBeRedirected && !isCreating) {
            router.push('/account');
        }
    }, [shouldBeRedirected, router, isCreating]);

    if (isCreating) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 24,
                }}
            >
                <CircularProgress />
                <Typography variant="h6">
                    Creating video, this might take a few minutes...
                </Typography>
                <Link href="/account" passHref>
                    <Button variant="contained" color="primary">
                        Go to account
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{display: 'flex', width: '100%'}}>
                <div
                    style={{
                        padding: 32,
                        width: '30%',
                        fontSize: 32,
                        color: imgFiles.length < numberOfImages ? '#ff0000' : '#00aa00',
                    }}
                >
                    <div>
                        {imgFiles.length} / {numberOfImages}
                    </div>
                    <div>
                        <input type="file" onChange={onFileChange} accept="image/*" multiple />
                    </div>
                </div>
                <div
                    style={{
                        width: '30%',

                        border: '1px dashed gray',
                        padding: 32,
                    }}
                >
                    <Typography variant="overline">Resolution | {selectedFormat.name}</Typography>
                    <Slider
                        value={resolution}
                        min={minLong}
                        max={maxLong}
                        step={1}
                        aria-labelledby="Resolution"
                        onChange={(e, localResolution) => {
                            const diff = (localResolution as number) - resolution;
                            const step = diff < 0 ? -1 : 1;
                            setResolution(localResolution as number);
                            changeResolution(localResolution as number, step);
                        }}
                    />
                    <div>
                        {width} x {height}
                    </div>
                    <button
                        onClick={() =>
                            changeResolution(selectedFormat.ratio < 1 ? height : width, 1)
                        }
                    >
                        increase
                    </button>
                    <button
                        onClick={() =>
                            changeResolution(selectedFormat.ratio < 1 ? height : width, -1)
                        }
                    >
                        decreasecrease
                    </button>
                </div>
                <div
                    style={{
                        width: '30%',

                        // border: '1px dashed gray',
                        padding: 32,
                    }}
                >
                    <Button
                        onClick={() => {
                            showCroppedImage();
                            setShouldBeRedirected(true);
                        }}
                        variant="contained"
                        color="primary"
                    >
                        Generate Video
                    </Button>
                </div>
            </div>
            <div className={styles.container}>
                <div
                    style={{
                        overflow: 'scroll',
                    }}
                >
                    <DndList
                        items={imgFiles}
                        setItems={setImgFiles}
                        ratio={ratio}
                        updateItems={updateItems}
                        numberOfImages={numberOfImages}
                    />
                </div>
            </div>
        </div>
    );
};
