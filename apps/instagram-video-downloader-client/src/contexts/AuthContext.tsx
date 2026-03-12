import React, {createContext, useContext, useEffect, useState} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import {onAuthStateChanged} from 'firebase/auth';
import {BrowserRouter} from 'react-router-dom';

import {firebaseAuth} from '../configs/firebase';

type AuthContextType = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentUser: any;
    userLoggedIn: boolean;
    loading: boolean;
};
const AuthContext = createContext({} as AuthContextType);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProfider = ({children}) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentUser, setCurrnetUser] = useState<any>(null);
    const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const initializeUser = (user) => {
        setLoading(true);
        if (user) {
            setCurrnetUser({...user});
            setUserLoggedIn(true);
        } else {
            setCurrnetUser(null);
            setUserLoggedIn(false);
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, initializeUser);
        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{currentUser, userLoggedIn, loading}}>
            <BrowserRouter>{children}</BrowserRouter>
        </AuthContext.Provider>
    );
};
