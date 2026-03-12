import React from 'react';

interface FormProps {
    mode?: 'create' | 'edit';
}

const Form: React.FC<FormProps> = ({mode}) => {
    return <div>PreparedVideo Form ({mode || 'create/edit'}) — TODO</div>;
};

export default Form;
