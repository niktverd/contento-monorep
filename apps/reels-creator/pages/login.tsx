import React from 'react';

import Head from 'next/head';
import {useRouter} from 'next/router';
import {signIn, useSession} from 'next-auth/react';

import styles from '../styles/Register.module.css';

export default function Login() {
    const session = useSession();
    const router = useRouter();

    const params = router.query;

    React.useEffect(() => {
        if (session.status === 'authenticated') {
            router.push('/');
        }
    }, [router, session.status]);

    return (
        <React.Fragment>
            <Head>
                <title>Login Required | Reels Creator</title>
            </Head>
            <div className={styles.container}>
                <div className={styles.formContainer}>
                    <div>
                        <h2 className={styles.header}>Login required</h2>
                        <p className={styles.subHeader}>
                            You need to login in in to account with our Passport Center
                        </p>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className={styles.button}
                            onClick={() =>
                                signIn('keycloak', {callbackUrl: params.callbackUrl as string})
                            }
                        >
                            Go to Passport Center
                        </button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}
