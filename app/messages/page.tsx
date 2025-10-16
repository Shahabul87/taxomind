import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageCenter } from "./_components/message-center";

export default async function MessagesPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return (
    <div className="p-6">
      <MessageCenter userId={user.id!} />
    </div>
  );
} 