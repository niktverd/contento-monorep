import React from 'react';

import {Route, Routes as RouterRoutes} from 'react-router-dom';

import {Form, List, Overview} from './';

export const Root = () => {
    return (
        <RouterRoutes>
            <Route path="" element={<List />} />
            <Route path="add" element={<Form />} />
            <Route path=":id" element={<Overview />} />
            <Route path=":id/edit" element={<Form />} />
        </RouterRoutes>
    );
};
