import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, ButtonIcon} from '@gravity-ui/uikit';

type DeleteFromArrayButtonProps = {
    onClick: () => void;
};

export const DeleteFromArrayButton = ({onClick}: DeleteFromArrayButtonProps) => {
    return (
        <div style={{margin: 20}}>
            <Button type="button" onClick={onClick} view="flat">
                <ButtonIcon>
                    <Xmark />
                </ButtonIcon>
            </Button>
        </div>
    );
};
