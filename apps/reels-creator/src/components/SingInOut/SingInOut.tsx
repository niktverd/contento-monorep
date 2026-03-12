import React from 'react';

import Link from 'next/link';
import {useRouter} from 'next/router';
import {signIn, signOut, useSession} from 'next-auth/react';

export const SingInOut = () => {
    const session = useSession();
    const router = useRouter();

    return session.status === 'authenticated' ? (
        <Link href="/" onClick={() => signOut()}>
            Sign out
        </Link>
    ) : (
        <Link href="?" onClick={() => signIn('keycloak', {callbackUrl: router.asPath})}>
            Sign In
        </Link>
    );
};
