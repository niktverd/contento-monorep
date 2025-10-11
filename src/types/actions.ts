export type AuthentificatedUser = {
    uid: string;
    name: string;
    email: string;
    id: number;
};

export type ActionsOptions = {
    user?: AuthentificatedUser;
    organizationId?: number;
};
