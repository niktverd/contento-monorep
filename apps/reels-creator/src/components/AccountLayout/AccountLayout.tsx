import React from 'react';

import {Navigation} from '../../navigation';
import {SidebarNavigation} from '../SidebarNavigation';

import styles from '../../../styles/Account.module.css';

type AccountLayoutProps = React.PropsWithChildren<{}>;

export const AccountLayout = ({children}: AccountLayoutProps) => {
    return (
        <Navigation>
            <div className={styles.accountContainer}>
                <div style={{display: 'flex', minHeight: '50vh'}}>
                    <SidebarNavigation />
                    <div style={{flex: 1, padding: 24}}>
                        <div className={styles.tabContent}>{children}</div>
                    </div>
                </div>
            </div>
        </Navigation>
    );
};
