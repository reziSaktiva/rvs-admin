import { db } from "./db";

export const getUsers = async () => {
    const users = await db.query.profiles.findMany({
        with: {
            companyMemberships: {
                with: {
                    role: {
                        columns: {
                            id: true,
                            displayName: true,
                            title: true,
                        },
                    },
                },
            },
        },
    });

    if (!users) {
        return {
            success: false,
            message: "Users not found",
        };
    }

    return {
        success: true,
        message: "Users found",
        data: users,
    };
};
