import React from 'react';

import {Route, Routes} from 'react-router-dom';

import {List} from './List';

export const Root = () => (
    <Routes>
        <Route path="" element={<List />} />
    </Routes>
);
