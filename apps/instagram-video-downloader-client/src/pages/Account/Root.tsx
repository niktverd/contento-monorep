import React from 'react';

import {Route, Routes} from 'react-router-dom';

import {Form} from './Form';
import {List} from './List';
import {Overview} from './Overview';

export const Root = () => (
    <Routes>
        <Route path="" element={<List />} />
        <Route path="new" element={<Form mode="create" />} />
        <Route path=":id" element={<Overview />} />
        <Route path=":id/edit" element={<Form mode="edit" />} />
    </Routes>
);
