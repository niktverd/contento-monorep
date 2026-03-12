import React from 'react';

import {useRouter} from 'next/router';

const AccountPage = () => {
    const router = useRouter();

    React.useEffect(() => {
        router.replace('/accounts/videos');
    }, [router]);

    return null;
};

export default AccountPage;
