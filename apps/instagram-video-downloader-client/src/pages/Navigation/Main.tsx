import React, {JSX} from 'react';

import {Link, Navigate, Route, Routes} from 'react-router-dom';

import {useAuth} from '../../contexts/AuthContext';
import {useOrganization} from '../../contexts/OrganizationContext';
import {Root as AccountRoot} from '../Account';
// import {AnalizeUserContent} from '../AnalizeUserContent';
import {AuthPage} from '../AuthPage/AuthPage';
import {Home} from '../Home';
import {Root as InsightsRoot} from '../Insights';
import {InstagramCallback} from '../InstagramCallback';
import {Root as InstagramLocationRoot} from '../InstagramLocation';
import {Root as InstagramMediaContainerRoot} from '../InstagramMediaContainer';
import {Select as OrganizationSelect, Root as OrganizationsRoot} from '../Organization';
import {Policy} from '../Policy';
import {Root as PreparedVideoRoot} from '../PreparedVideo';
import {Root as RolesRoot} from '../Role';
import {Root as ScenarioRoot} from '../Scenario';
import {Root as SourceRoot} from '../Source';
import {Test} from '../Test';
import {Root as UserRoot} from '../User';
// import {Statistics} from '../Source/Statistics';

import cl from './Main.module.css';

type IsAllowedArgs = {
    userLoggedIn: boolean;
    isProtected?: boolean | string[];
    userLogin?: string;
};

const isAllowed = ({isProtected, userLoggedIn, userLogin}: IsAllowedArgs) => {
    if (isProtected) {
        if (userLoggedIn) {
            if (typeof isProtected === 'boolean') {
                return true;
            } else if (userLogin) {
                return isProtected.includes(userLogin);
            }
        } else {
            return false;
        }
        return false;
    } else {
        return true;
    }
};

type MainMenuConfigType = {
    text: string;
    to: string;
    Component: () => JSX.Element;
    isProtected?: boolean | string[];
};

export const mainMenuConfig: MainMenuConfigType[] = [
    {text: 'Home', to: '/', Component: Home},
    {text: 'Policy', to: '/policy', Component: Policy},
    {
        text: 'Insights',
        to: '/insights/*',
        Component: InsightsRoot,
        isProtected: true,
    },
    {
        text: 'Organizations',
        to: '/organizations/*',
        Component: OrganizationsRoot,
        isProtected: ['oKDGdx26d2SuT3yYi5fikiVWdvJ2', 'wEatYPLUiBh853nIVW9qSu4Uo2C3'],
    },
    {
        text: 'Roles',
        to: '/roles/*',
        Component: RolesRoot,
        isProtected: ['oKDGdx26d2SuT3yYi5fikiVWdvJ2', 'wEatYPLUiBh853nIVW9qSu4Uo2C3'],
    },
    {
        text: 'User',
        to: '/users/*',
        Component: UserRoot,
        isProtected: ['oKDGdx26d2SuT3yYi5fikiVWdvJ2', 'wEatYPLUiBh853nIVW9qSu4Uo2C3'],
    },
    {
        text: 'Roles',
        to: '/roles/*',
        Component: RolesRoot,
        isProtected: ['oKDGdx26d2SuT3yYi5fikiVWdvJ2', 'wEatYPLUiBh853nIVW9qSu4Uo2C3'],
    },
    {
        text: 'User',
        to: '/users/*',
        Component: UserRoot,
        isProtected: ['oKDGdx26d2SuT3yYi5fikiVWdvJ2', 'wEatYPLUiBh853nIVW9qSu4Uo2C3'],
    },
    {
        text: 'Scenarios',
        to: '/scenario/*',
        Component: ScenarioRoot,
        isProtected: true,
    },
    {
        text: 'Accounts',
        to: '/account/*',
        Component: AccountRoot,
        isProtected: true,
    },
    {
        text: 'Sources',
        to: '/sources/*',
        Component: SourceRoot,
        isProtected: true,
    },
    {
        text: 'Prepared Videos',
        to: '/prepared-videos/*',
        Component: PreparedVideoRoot,
        isProtected: true,
    },
    {
        text: 'Instagram Media Containers',
        to: '/instagram-media-containers/*',
        Component: InstagramMediaContainerRoot,
        isProtected: true,
    },
    {
        text: 'Instagram Locations',
        to: '/instagram-locations/*',
        Component: InstagramLocationRoot,
        isProtected: true,
    },
    // {
    //     text: 'Statistics',
    //     to: '/statistics',
    //     Component: Statistics,
    //     isProtected: true,
    // },
    {text: 'Test', to: '/tests', Component: Test, isProtected: true},
    // {
    //     text: 'Analize User Content',
    //     to: '/analize-user-content',
    //     Component: AnalizeUserContent,
    //     isProtected: true,
    // },
];

const ProtectedRoute = ({children, isProtected}) => {
    const {userLoggedIn, currentUser, loading} = useAuth();
    const {organizationId} = useOrganization();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (isProtected) {
        const isAuthAllowed = isAllowed({userLoggedIn, isProtected, userLogin: currentUser?.uid});

        if (!isAuthAllowed) {
            return <Navigate to="/" />;
        }

        const isArrayAdmin =
            currentUser?.uid &&
            Array.isArray(isProtected) &&
            isProtected.includes(currentUser?.uid);

        // Check if organization is selected for protected routes
        if (!organizationId && !isArrayAdmin) {
            return <Navigate to="/select-organization" />;
        }

        return children;
    } else {
        return children;
    }
};

export const MainNavigation = () => {
    const {userLoggedIn, currentUser} = useAuth();
    const {organizationId, organizationName} = useOrganization();

    return (
        <nav>
            <ul className={cl.ul}>
                {mainMenuConfig.map(({text, to, isProtected}) => {
                    if (isAllowed({userLoggedIn, isProtected, userLogin: currentUser?.uid})) {
                        return (
                            <li key={`${text}-${to}`}>
                                <Link to={to.replace(/\*$/g, '')}>{text}</Link>
                            </li>
                        );
                    } else {
                        return null;
                    }
                })}
                {userLoggedIn && organizationId && (
                    <li>
                        <Link to="/select-organization">
                            Change Organization ({organizationName})
                        </Link>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export const MainNavigationRoutes = () => {
    return (
        <Routes>
            {mainMenuConfig.map(({text, to, isProtected, Component}) => {
                return (
                    <Route
                        key={`${text}-${to}`}
                        path={to}
                        element={
                            <ProtectedRoute isProtected={isProtected}>
                                <Component />
                            </ProtectedRoute>
                        }
                    />
                );
            })}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/instagram-callback" element={<InstagramCallback />} />
            <Route path="/instagram-callback/:accountId" element={<InstagramCallback />} />
            <Route path="/select-organization" element={<OrganizationSelect />} />
            <Route path="*" element={<h2>Page Not Found</h2>} />
        </Routes>
    );
};
