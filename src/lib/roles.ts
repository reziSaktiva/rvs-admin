import { db } from "./db";

export const getRoles = async () => {
    const roles = await db.query.roles.findMany({
        columns: {
            id: true,
            displayName: true,
            title: true,
        },
    });

    return roles;
};
