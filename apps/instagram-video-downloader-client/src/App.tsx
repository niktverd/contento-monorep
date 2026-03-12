import React, {useState} from 'react';

import {Switch} from '@gravity-ui/uikit';
// import {getRootClassName} from '@gravity-ui/uikit/server';

import {AuthButton} from './components/auth/AuthButton';
import {AppEnvContext} from './contexts/AppEnv';
import {AuthProfider} from './contexts/AuthContext';
import {OrganizationProvider} from './contexts/OrganizationContext';
import {MainNavigation, MainNavigationRoutes} from './pages/Navigation/Main';

import './App.css';

// const theme = 'dark';
// const rootClassName = getRootClassName({theme});

function App() {
    const [isProd, setIsProd] = useState(import.meta.env.VITE_APP_ENV === 'prod');

    return (
        <div className={`App g-root`}>
            <AuthProfider>
                <OrganizationProvider>
                    <h1>Instagram Schedule And Analytics</h1>
                    {import.meta.env.VITE_APP_ENV === 'dev' ? (
                        <div>
                            <span>Preprod</span>
                            <Switch checked={isProd} onUpdate={(cheched) => setIsProd(cheched)}>
                                Prod
                            </Switch>
                        </div>
                    ) : null}
                    <div className="navigation">
                        <MainNavigation />
                        <AuthButton />
                    </div>
                    <div>
                        <AppEnvContext.Provider value={{isProd}}>
                            <MainNavigationRoutes />
                            {/* If you want a default/fallback route when no other route matches */}
                        </AppEnvContext.Provider>
                    </div>
                </OrganizationProvider>
            </AuthProfider>
        </div>
    );
}

export default App;
