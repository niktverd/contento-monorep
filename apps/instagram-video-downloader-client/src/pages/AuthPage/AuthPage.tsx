import React, {useEffect, useState} from 'react';

import {Tab, TabList, TabPanel, TabProvider} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {Login} from '../../components/auth/Login';
import {Registration} from '../../components/auth/Registration';

import cl from './AuthPage.module.css';

enum TabEnum {
    LoginTab = 'login',
    RegistrationTab = 'registration',
}

export const AuthPage = () => {
    const [activeTab, setActiveTab] = useState<TabEnum>(TabEnum.LoginTab);
    const {hash} = useLocation();

    useEffect(() => {
        if (hash === `#${TabEnum.LoginTab}`) {
            setActiveTab(TabEnum.LoginTab);
        }

        if (hash === `#${TabEnum.RegistrationTab}`) {
            setActiveTab(TabEnum.RegistrationTab);
        }
    }, [hash]);

    const tabs = [
        {
            id: TabEnum.LoginTab,
            title: 'Login',
            content: <Login />,
        },
        {
            id: TabEnum.RegistrationTab,
            title: 'Registration',
            content: <Registration />,
        },
    ];

    return (
        <div className={cl.page}>
            <h2>Authentication</h2>
            <TabProvider value={activeTab} onUpdate={(value) => setActiveTab(value as TabEnum)}>
                <TabList>
                    {tabs.map((item) => (
                        <Tab key={item.id} value={item.id}>
                            {item.title}
                        </Tab>
                    ))}
                </TabList>
                <div>
                    {tabs.map((item) => (
                        <TabPanel key={item.id} value={item.id}>
                            {item.content}
                        </TabPanel>
                    ))}
                </div>
            </TabProvider>
        </div>
    );
};
