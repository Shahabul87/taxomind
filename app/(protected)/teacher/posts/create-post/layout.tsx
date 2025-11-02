import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CreateBlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return <>{children}</>;
} 