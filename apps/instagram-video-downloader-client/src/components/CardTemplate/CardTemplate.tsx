import React, {PropsWithChildren, ReactNode} from 'react';

import {Button, ButtonView, Card} from '@gravity-ui/uikit';

import cn from './CardTemplate.module.css';

export interface CardAction {
    text: string;
    link?: string;
    onClick?: () => void;
    view?: ButtonView;
}

export interface CardConfig extends PropsWithChildren {
    title: string;
    description?: string;
    icon?: ReactNode;
    actions?: CardAction[];
    colSpan?: 1 | 2 | 3;
    className?: string;
}

export const CardTemplate = ({
    title,
    description,
    icon,
    actions,
    children,
    colSpan,
    className,
}: CardConfig) => (
    <Card
        type="container"
        view="outlined"
        className={`${cn.card} ${colSpan ? cn[`card--col${colSpan}`] : cn['card--col1']} ${className ?? ''}`}
    >
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8}}>
            {icon && <span>{icon}</span>}
            <div style={{fontSize: 20, fontWeight: 600}}>{title}</div>
        </div>
        {description && (
            <div style={{fontSize: 14, color: '#888', marginBottom: 12}}>{description}</div>
        )}
        <div>{children}</div>
        {actions && actions.length > 0 && (
            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                {actions.map((action, i) => (
                    <Button
                        key={i}
                        size="l"
                        href={action.link}
                        view={action.view ?? 'action'}
                        onClick={action.onClick}
                    >
                        {action.text}
                    </Button>
                ))}
            </div>
        )}
    </Card>
);
