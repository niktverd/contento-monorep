import React from 'react';

import Link from 'next/link';
import {useSession} from 'next-auth/react';

import {SingInOut} from '../components/SingInOut/SingInOut';

export const Navigation = ({children}: React.PropsWithChildren<{}>) => {
    const session = useSession();
    const userEmail = session?.data?.user?.email;

    return (
        <React.Fragment>
            <nav
                style={{
                    marginBottom: 24,
                    padding: 24,
                    backgroundColor: 'lightgreen',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <Link href={'/'} style={{marginRight: 10}}>
                    Home
                </Link>
                <Link href={'/app'} style={{marginRight: 10}}>
                    Create video
                </Link>
                {session.status === 'authenticated' ? (
                    <Link href={'/accounts/videos'} style={{marginRight: 10}}>
                        Account
                    </Link>
                ) : null}
                <Link href={'/policy'} style={{marginRight: 10}}>
                    Privacy Policy
                </Link>
                {/* {session ? (
                    <Link href={'/moderation'} style={{marginRight: 10}}>
                        Moderate
                    </Link>
                ) : null} */}
                <div style={{display: 'flex', alignItems: 'center', marginInlineStart: 'auto'}}>
                    {session.status === 'authenticated' ? (
                        <span style={{marginRight: 10, color: '#333', fontWeight: 'bold'}}>
                            {userEmail}
                        </span>
                    ) : null}
                    <SingInOut />
                </div>
            </nav>
            {children}
        </React.Fragment>
    );
};
