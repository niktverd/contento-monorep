import React, {createContext, useContext, useEffect, useState} from 'react';

type OrganizationContextType = {
    organizationId: string | null;
    organizationName: string | null;
    setOrganization: (id: string, name: string) => void;
    clearOrganization: () => void;
};

const OrganizationContext = createContext({} as OrganizationContextType);

export const useOrganization = () => {
    return useContext(OrganizationContext);
};

export const OrganizationProvider = ({children}: {children: React.ReactNode}) => {
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [organizationName, setOrganizationName] = useState<string | null>(null);

    const setOrganization = (id: string, name: string) => {
        setOrganizationId(id);
        setOrganizationName(name);
        localStorage.setItem('organizationId', id);
        localStorage.setItem('organizationName', name);
    };

    const clearOrganization = () => {
        setOrganizationId(null);
        setOrganizationName(null);
        localStorage.removeItem('organizationId');
        localStorage.removeItem('organizationName');
    };

    useEffect(() => {
        const storedId = localStorage.getItem('organizationId');
        const storedName = localStorage.getItem('organizationName');

        if (storedId && storedName) {
            setOrganizationId(storedId);
            setOrganizationName(storedName);
        }
    }, []);

    return (
        <OrganizationContext.Provider
            value={{
                organizationId,
                organizationName,
                setOrganization,
                clearOrganization,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
};
