export const readFile = (file: File) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result), false);
        reader.readAsDataURL(file);
    });
};

export const getImageMetadata = (file: File) => {
    return new Promise<{width: number; height: number}>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && event.target.result && typeof event.target.result === 'string') {
                const img = new Image();
                img.onload = () => {
                    resolve({width: img.width, height: img.height});
                };
                img.onerror = (error) => {
                    reject(error);
                };
                img.src = event.target.result;
            } else {
                reject(new Error('Failed to read the file'));
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
};
