import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PostDashboard } from "./_components/post-dashboard";

const AllPostsPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return (
    <>
      
        <PostDashboard /> {/* Dashboard component to render all posts */}
      
    </>
  );
};

export default AllPostsPage;

  