import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UnifiedHeaderClient } from "@/components/dashboard/unified-header-client";
import { TeacherCreateClient } from "./_components/teacher-create-client";

export default async function TeacherCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return (
    <>
      <UnifiedHeaderClient user={user} />
      <TeacherCreateClient user={user}>
        <div className="pt-14">
          {children}
        </div>
      </TeacherCreateClient>
    </>
  );
}
