import { db } from "./db";
import { companyMembers, profiles, roles } from "./db/drizzle/schema";
import { eq } from "drizzle-orm";

export const getUsers = async (companyId: string) => {
  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      fullName: profiles.fullName,
      phone: profiles.phone,
      gender: profiles.gender,
      photoUrl: profiles.photoUrl,
      isActive: profiles.isActive,
      roleId: roles.id,
      roleDisplayName: roles.displayName,
      roleTitle: roles.title,
    })
    .from(companyMembers)
    .innerJoin(profiles, eq(companyMembers.profileId, profiles.id))
    .innerJoin(roles, eq(companyMembers.roleId, roles.id))
    .where(eq(companyMembers.companyId, companyId));

  const users = rows.map((row) => ({
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    phone: row.phone,
    gender: row.gender,
    photoUrl: row.photoUrl,
    isActive: row.isActive,
    companyMemberships: [
      {
        role: {
          id: row.roleId,
          displayName: row.roleDisplayName,
          title: row.roleTitle,
        },
      },
    ],
  }));

  return {
    success: true,
    message: "Users found",
    data: users,
  };
};
