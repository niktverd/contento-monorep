import React from 'react';

import {AccountLayout} from '../../src/components/AccountLayout/AccountLayout';
import {CommentsManager} from '../../src/components/Instagram';

export default function CommentsPage() {
    // TODO: получить mediaId из профиля или параметров
    const mediaId = 'mock-media-id';
    return (
        <AccountLayout>
            <CommentsManager mediaId={mediaId} />
        </AccountLayout>
    );
}
