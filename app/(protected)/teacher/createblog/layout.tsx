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

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-5xl mx-auto py-8">
        {children}
      </div>
    </div>
  );
} 