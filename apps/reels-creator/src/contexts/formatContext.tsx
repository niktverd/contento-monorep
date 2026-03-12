import React from 'react';

import {formats} from '../constants/common';
import type {FormatType} from '../types/common';

const FormatContext = React.createContext<{
    selectedFormat: FormatType;
    setSelectedFormat: React.Dispatch<React.SetStateAction<FormatType>>;
}>({
    selectedFormat: formats[0],
    setSelectedFormat: () => {},
});

export const FormatProvider = ({children}: React.PropsWithChildren<{}>) => {
    const [selectedFormat, setSelectedFormat] = React.useState<FormatType>(formats[0]);

    return (
        <FormatContext.Provider value={{selectedFormat, setSelectedFormat}}>
            {children}
        </FormatContext.Provider>
    );
};

export const useFormatContext = () => React.useContext(FormatContext);
