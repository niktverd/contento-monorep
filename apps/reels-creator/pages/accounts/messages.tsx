import React from 'react';

import {AccountLayout} from '../../src/components/AccountLayout/AccountLayout';
import {AgentDashboard, MessagingHub} from '../../src/components/Instagram';

export default function MessagesPage() {
    return (
        <AccountLayout>
            <AgentDashboard />
            <MessagingHub />
        </AccountLayout>
    );
}
