import { redirect } from "next/navigation";
import { getUsers } from "@/lib/users";
import { getRoles } from "@/lib/roles";
import { TeamMemberView } from "@/components/team/team-member-view";
import { getCurrentUserActiveCompanyContext } from "@/lib/company/active-company";

export default async function TeamPage() {
  const activeContext = await getCurrentUserActiveCompanyContext();
  if (!activeContext) {
    redirect("/select-company");
  }

  const usersResult = await getUsers(activeContext.companyId);
  const roles = await getRoles();
  const users = usersResult.data ?? [];

  return <TeamMemberView users={users} roles={roles} />;
}
