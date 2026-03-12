import React, {ReactNode} from 'react';

import {Field, FieldAttributes} from 'formik';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomFieldProps = FieldAttributes<any> & {
    children?: ReactNode;
};

export const CustomField = ({children, ...props}: CustomFieldProps) => {
    return (
        <div style={{marginBlockEnd: 20}}>
            <div>{props.label || props.name}</div>
            <div>
                <Field {...props}>{children}</Field>
            </div>
        </div>
    );
};
