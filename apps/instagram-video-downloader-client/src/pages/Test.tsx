/* eslint-disable import/no-extraneous-dependencies */
import React, {useState} from 'react';

import {Tab, TabList, TabPanel, TabProvider} from '@gravity-ui/uikit';

import PerformanceMonitor from '../components/PerformanceMonitor/PerformanceMonitor';
import {ConvertImageToVideo} from '../components/tabs/ConvertImageToVideo';
import {CronTest} from '../components/tabs/Cron';
import {DeletePreprodData} from '../components/tabs/DeletePreprodData';
import {GetUserById} from '../components/tabs/GetUserById';
import {PushToPubSub} from '../components/tabs/PushToPubSub';
import {Temporal} from '../components/tabs/Temporal';
import {UniDecode} from '../components/tabs/Unidecode';
import {Users} from '../components/tabs/Users';

enum TabEnum {
    CronTab = 'cron',
    VideoTab = 'video',
    DeletePreprodDatabaseTab = 'DeletePreprodData',
    GetUserByIdTab = 'uiGetInstagramUserById',
    UnidecodeTab = 'Unidecode',
    ConvertTab = 'Convert',
    PerformanceMonitorTab = 'performanceMonitor',
    PubSubTab = 'pubsub',
    UsersTab = 'users',
    TemporalTab = 'temporal',
}

export const Test = () => {
    const [tab, setTab] = useState<TabEnum>(TabEnum.CronTab);

    const config = [
        {
            id: TabEnum.CronTab,
            title: 'Cron',
            content: <CronTest />,
        },
        {
            id: TabEnum.DeletePreprodDatabaseTab,
            title: 'DeletePreprodDatabase',
            content: <DeletePreprodData />,
        },
        {
            id: TabEnum.GetUserByIdTab,
            title: 'GetUserByIdTab',
            content: <GetUserById />,
        },
        {
            id: TabEnum.UnidecodeTab,
            title: 'Unidecode',
            content: <UniDecode />,
        },
        {
            id: TabEnum.ConvertTab,
            title: 'Convert',
            content: <ConvertImageToVideo />,
        },
        {
            id: TabEnum.PerformanceMonitorTab,
            title: 'Memory Usage',
            content: <PerformanceMonitor />,
        },
        {
            id: TabEnum.PubSubTab,
            title: 'PubSub',
            content: <PushToPubSub />,
        },
        {
            id: TabEnum.UsersTab,
            title: 'Users',
            content: <Users />,
        },
        {
            id: TabEnum.TemporalTab,
            title: 'Temporal',
            content: <Temporal />,
        },
    ];
    return (
        <div>
            <h2>Test</h2>
            <TabProvider value={tab} onUpdate={(value) => setTab(value as TabEnum)}>
                <TabList>
                    {config.map((item) => (
                        <Tab key={item.id} value={item.id}>
                            {item.title}
                        </Tab>
                    ))}
                </TabList>
                <div>
                    {config.map((item) => (
                        <TabPanel key={item.id} value={item.id}>
                            {item.content}
                        </TabPanel>
                    ))}
                </div>
            </TabProvider>
        </div>
    );
};
