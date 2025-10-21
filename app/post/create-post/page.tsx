import { redirect } from "next/navigation";

// Redirect old route to new teacher route
export default function OldCreatePostRoute() {
  redirect("/teacher/posts/create-post");
}