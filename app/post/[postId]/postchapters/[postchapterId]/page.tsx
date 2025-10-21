import { redirect } from "next/navigation";

interface PostChapterPageProps {
  params: Promise<{
    postId: string;
    postchapterId: string;
  }>;
}

// Redirect old route to new teacher route
export default async function OldPostChapterRoute(props: PostChapterPageProps) {
  const params = await props.params;
  redirect(`/teacher/posts/${params.postId}/postchapters/${params.postchapterId}`);
}