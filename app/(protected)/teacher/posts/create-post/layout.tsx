import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UnifiedHeaderClient } from "@/components/dashboard/unified-header-client";
import { CreatePostClient } from "./_components/create-post-client";

export default async function CreateBlogLayout({
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
      <CreatePostClient user={user}>
        <div className="pt-14">
          {children}
        </div>
      </CreatePostClient>
    </>
  );
} 