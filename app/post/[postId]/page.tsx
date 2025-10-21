import { redirect } from "next/navigation";

interface PostEditPageProps {
  params: Promise<{ postId: string }>;
}

// Redirect old route to new teacher route
export default async function OldPostEditRoute(props: PostEditPageProps) {
  const params = await props.params;
  redirect(`/teacher/posts/${params.postId}`);
}