import React from 'react';

import {useRouter} from 'next/router';

import {formats, maxLong, minLong} from '../src/constants/common';
import {useFormatContext} from '../src/contexts/formatContext';
import {Navigation} from '../src/navigation';
import {templates} from '../src/templates';
import type {FileConfig, View} from '../src/types/common';
import {FormatSelectorView} from '../src/views/FormatSelectorView/FormatSelectorView';
import {PrepareContentView} from '../src/views/PrepareContentView/PrepareContentView';
import {TemplateSelectorView} from '../src/views/TemplateSelectorView/TemplateSelectorView';

// import styles from '../styles/DefaultCrop.module.css';

const templatesEntries = Object.entries(templates);

const initialConfig: FileConfig['config'] = {
    zoom: 1,
    ratio: formats[0].ratio,
    rotation: 0,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
};

const CreateProject = () => {
    const [view, setView] = React.useState<View>('template');
    const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
    const [width, setWidth] = React.useState(0);
    const [height, setHeight] = React.useState(0);

    const [selectedFile, setSelectedFile] = React.useState<FileConfig | null>(null);
    const [imgFiles, setImgFiles] = React.useState<FileConfig[]>([]);
    const [isCreating, setIsCreating] = React.useState(false);

    const {selectedFormat} = useFormatContext();
    const router = useRouter();

    const changeResolution = React.useCallback(
        (oldLong = maxLong, step = 1, tryNotChange = false) => {
            const localStep = tryNotChange ? 0 : step;
            const long = Math.round(oldLong + localStep);

            if (selectedFormat.ratio === 1) {
                setWidth(long);
                setHeight(long);
                return;
            }
            let short;
            if (selectedFormat.ratio < 1) {
                short = long * selectedFormat.ratio;
            } else {
                short = long / selectedFormat.ratio;
            }

            if (short !== Math.round(short)) {
                if (long <= minLong) {
                    changeResolution(long, 1);
                    return;
                } else if (long >= maxLong) {
                    changeResolution(long, -1);
                    return;
                } else {
                    changeResolution(long, step);
                    return;
                }
            }

            if (selectedFormat.ratio < 1) {
                setWidth(short);
                setHeight(long);
            } else {
                setWidth(long);
                setHeight(short);
            }
        },
        [selectedFormat.ratio],
    );

    React.useEffect(() => {
        changeResolution(maxLong, 1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFormat]);

    React.useEffect(() => {
        const images = imgFiles.map((item) => {
            if (item.id === selectedFile?.id) {
                return {...selectedFile};
            } else {
                return item;
            }
        });

        setImgFiles(images);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedFile?.id,
        selectedFile?.config.height,
        selectedFile?.config.width,
        selectedFile?.config.x,
        selectedFile?.config.y,
        selectedFile?.config.zoom,
        selectedFile?.config.rotation,
        selectedFile?.config.ratio,
        selectedFile,
    ]);

    const onCropComplete = React.useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_croppedArea: any, localcroppedAreaPixels: any) => {
            if (selectedFile) {
                setSelectedFile({
                    ...selectedFile,
                    config: {
                        ...selectedFile.config,
                        ...(localcroppedAreaPixels || {}),
                    },
                });
            }
        },
        [selectedFile],
    );

    const updateItems = React.useCallback(
        (item: FileConfig) => {
            const fileIndex = imgFiles.findIndex((imgFile) => imgFile.id === item.id);
            if (fileIndex === -1) {
                return;
            }

            imgFiles[fileIndex] = item;
            setImgFiles(imgFiles);
        },
        [imgFiles],
    );

    const uploadToServer = React.useCallback(async () => {
        type SearchParamType = Record<string, string>;

        const params: SearchParamType = {};

        const body = new FormData();

        for (const imgFile of imgFiles) {
            body.append(imgFile.id, imgFile.data as unknown as Blob, imgFile.id);
            // eslint-disable-next-line guard-for-in
            for (const configParam in imgFile.config) {
                params[`${imgFile.id}.${configParam}`] = String(
                    imgFile.config[configParam as keyof FileConfig['config']],
                );
            }
        }

        if (selectedTemplate) {
            params.template = selectedTemplate;
        }

        params.width = width.toString();
        params.height = height.toString();

        const url = new URLSearchParams(params);
        const response = await fetch(`/api/create-video?${url.toString()}`, {
            method: 'POST',
            body,
        });

        if (response.status === 200) {
            router.push('account');
        }

        // await response.blob();
    }, [height, imgFiles, router, selectedTemplate, width]);

    const showCroppedImage = React.useCallback(async () => {
        try {
            setIsCreating(true);
            await uploadToServer();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    }, [uploadToServer, setIsCreating]);

    const onFileChange = React.useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (e: any) => {
            if (e.target.files && e.target.files.length > 0) {
                const files: FileConfig[] = [];
                for (const fileItem of e.target.files) {
                    for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
                        if (fileItem.name.endsWith(ext)) {
                            files.push({
                                data: fileItem,
                                id: Math.random().toString().replaceAll('.', '-'),
                                config: initialConfig,
                            });
                            continue;
                        }
                    }
                }
                if (!selectedFile) {
                    setSelectedFile(files?.[0]);
                }

                setImgFiles([...imgFiles, ...files]);
            }
        },
        [imgFiles, selectedFile],
    );

    if (view === 'template') {
        return (
            <Navigation>
                <TemplateSelectorView
                    templatesEntries={templatesEntries}
                    setSelectedTemplate={setSelectedTemplate}
                    setView={setView}
                />
            </Navigation>
        );
    }

    if (view === 'format') {
        return (
            <Navigation>
                <FormatSelectorView setView={setView} />
            </Navigation>
        );
    }

    return (
        <Navigation>
            <PrepareContentView
                selectedTemplate={selectedTemplate}
                onFileChange={onFileChange}
                imgFiles={imgFiles}
                setImgFiles={setImgFiles}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                onCropComplete={onCropComplete}
                changeResolution={changeResolution}
                width={width}
                height={height}
                showCroppedImage={showCroppedImage}
                ratio={selectedFormat.ratio}
                updateItems={updateItems}
                isCreating={isCreating}
            />
        </Navigation>
    );
};

export default CreateProject;
