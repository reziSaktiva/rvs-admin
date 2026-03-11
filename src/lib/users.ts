import { db } from "./db";


export const getUsers = async () => {
    const users = await db.query.profiles.findMany({
        limit: 10,
        offset: 0,
    });

    if (!users) {
        return {
            success: false,
            message: "Users not found",
        }
    }

    return {
        success: true,
        message: "Users found",
        data: users,
    }
}