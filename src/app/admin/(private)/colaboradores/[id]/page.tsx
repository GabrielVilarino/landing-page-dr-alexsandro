import { UserDetailPage } from "@/features/users/components/user-detail-page";

export default async function CollaboratorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserDetailPage id={Number(id)} />;
}
