import type {FormatType} from '../types/common';

export const maxLong = 1280;
export const minLong = 128;

export const formats: FormatType[] = [
    {name: '9:16', ratio: 9 / 16},
    {name: '10:16', ratio: 10 / 16},
    {name: '1:1', ratio: 1},
    {name: '16:10', ratio: 16 / 10},
    {name: '16:9', ratio: 16 / 9},
];

export const CARD_WIDTH = 250;
