import React from 'react';

import {AccountLayout} from '../../../src/components/AccountLayout/AccountLayout';
import {InsightsDashboard} from '../../../src/components/Instagram';

export default function InsightsPage() {
    return (
        <AccountLayout>
            <InsightsDashboard />
        </AccountLayout>
    );
}
