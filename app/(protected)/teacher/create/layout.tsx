import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SmartHeader } from "@/components/dashboard/smart-header";
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
      <SmartHeader user={user} />
      <TeacherCreateClient user={user}>
        {children}
      </TeacherCreateClient>
    </>
  );
}
