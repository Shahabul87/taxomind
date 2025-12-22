import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { currentUser } from '@/lib/auth'
import { Footer } from "@/app/(homepage)/footer";
import EnterpriseEditPost from "./enterprise-edit-post";

const PostEditPage = async (props: {params: Promise<{ postId: string; }>}) => {
  const params = await props.params;
  const post = await db.post.findUnique({
    where: {
      id: params.postId,
    },
    include: {
      comments: {
        orderBy: {
          createdAt: "asc",
        },
      },
      Tag: true,
      User: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      PostChapterSection: {
        orderBy: {
          position: "asc",
        },
      },
      PostImageSection: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  const user = await currentUser();

  if(!user?.id) return redirect("/");
  if (!post) return redirect("/");

  // Check if the user owns this post
  if (post.userId !== user.id && user.role !== 'ADMIN') {
    return redirect("/teacher/posts/all-posts");
  }

  return (
    <>
      <EnterpriseEditPost
          postId={post.id}
          title={post.title}
          description={post.description}
          imageUrl={post.imageUrl}
          category={post.category}
          published={post.published || false}
          createdAt={post.createdAt}
          updatedAt={post.updatedAt}
          postChapters={post.PostChapterSection.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            description: chapter.description,
            position: chapter.position,
            isPublished: chapter.isPublished ?? false,
            isFree: chapter.isFree ?? false,
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
            postId: chapter.postId,
          }))}
        />
    </>
  );
}

export default PostEditPage;