import { redirect } from "next/navigation";

// Redirect old route to new teacher route
export default function OldAllPostsRoute() {
  redirect("/teacher/posts/all-posts");
}