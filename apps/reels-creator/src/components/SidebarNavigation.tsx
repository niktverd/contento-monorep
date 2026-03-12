import React from 'react';

import {
    Collapse,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@material-ui/core';
import {useTheme} from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import {ExpandLess, ExpandMore, Menu as MenuIcon} from '@material-ui/icons';
import {useRouter} from 'next/router';

const {useState} = React;

const menu = [
    {
        label: 'Videos',
        icon: <span>🎬</span>,
        path: '/accounts/videos',
    },
    {
        label: 'Create Video',
        icon: <span>📹</span>,
        path: '/app',
    },
    {
        label: 'Instagram',
        icon: <span>📸</span>,
        path: '/accounts/instagram',
        children: [
            {label: 'Account', icon: <span>📊</span>, path: '/accounts/instagram'},
            {
                label: 'Insights',
                icon: <span>📊</span>,
                path: '/accounts/insights/account',
                // children: [
                //     // {label: 'Account', icon: <span>📊</span>, path: '/accounts/insights/account'},
                //     // {label: 'Media', icon: <span>📊</span>, path: '/accounts/insights/media'},
                //     // {label: 'Stories', icon: <span>📊</span>, path: '/accounts/insights/stories'},
                // ],
            },
            // {label: 'Comments', icon: <span>💬</span>, path: '/accounts/comments'},
            // {label: 'Messages', icon: <span>✉️</span>, path: '/accounts/messages'},
        ],
    },
];

export const SidebarNavigation = () => {
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [open, setOpen] = useState<{[key: string]: boolean}>({});

    const handleToggle = (label: string) => {
        setOpen((prev) => ({...prev, [label]: !prev[label]}));
    };

    const handleNavigate = (path: string) => {
        router.push(path);
        setMobileOpen(false);
    };
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const renderMenu = (items: typeof menu, level = 0) => (
        <List>
            {items.map((item) => (
                <React.Fragment key={item.label}>
                    <ListItem
                        button
                        selected={router.pathname === item.path}
                        onClick={() =>
                            item.children ? handleToggle(item.label) : handleNavigate(item.path)
                        }
                        style={{paddingLeft: 16 + level * 16}}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                        {/* eslint-disable-next-line no-nested-ternary */}
                        {item.children ? open[item.label] ? <ExpandLess /> : <ExpandMore /> : null}
                    </ListItem>
                    {item.children && (
                        <Collapse in={open[item.label]} timeout="auto" unmountOnExit>
                            {renderMenu(item.children, level + 1)}
                        </Collapse>
                    )}
                </React.Fragment>
            ))}
        </List>
    );

    return (
        <React.Fragment>
            {!isDesktop && (
                <React.Fragment>
                    <IconButton onClick={() => setMobileOpen(true)} style={{height: 'min-content'}}>
                        <MenuIcon />
                    </IconButton>
                    <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
                        {renderMenu(menu)}
                    </Drawer>
                </React.Fragment>
            )}
            {isDesktop && (
                <Drawer
                    variant="permanent"
                    open
                    PaperProps={{style: {width: 240, position: 'relative'}}}
                >
                    {renderMenu(menu)}
                </Drawer>
            )}
        </React.Fragment>
    );
};
