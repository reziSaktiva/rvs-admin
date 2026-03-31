import { getUsers } from "@/lib/users";
import { getRoles } from "@/lib/roles";
import { TeamMemberView } from "@/components/team/team-member-view";

export default async function TeamPage() {
  const usersResult = await getUsers();
  const roles = await getRoles();
  const users = usersResult.data ?? [];

  return <TeamMemberView users={users} roles={roles} />;
}
