import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { MyPlansClient } from "./_components/MyPlansClient";

export const metadata: Metadata = {
  title: "My Plans | Taxomind",
  description: "Manage your learning and content creation plans",
};

export default async function MyPlanPage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect("/");
  }

  return <MyPlansClient user={user} />;
}
