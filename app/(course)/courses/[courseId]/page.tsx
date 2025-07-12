import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { currentUser } from '@/lib/auth'
import CourseCard from "./course-feature";
import { CourseTabsDemo } from "./course-tab-demo";
import { Footer } from "@/app/(homepage)/footer";
import { CourseContent } from "./course-content";
import ConditionalHeader from "@/app/(homepage)/user-header";
import { CourseCardsCarousel } from "./course-card-carousel";
import GradientHeading from "./_components/gradient-heading";
import { CourseReviews } from "./_components/course-reviews";
import { EnrollButton } from "./_components/enroll-button";
import { Metadata } from "next";
import { CourseOutcomes } from "./_components/course-outcomes";
import { CoursePageTabs } from "./_components/course-page-tabs";

type CourseReview = {
  id: string;
  rating: number;
  comment: string;
  courseId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

type Props = {
  params: Promise<{ courseId: string }>
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const courseId = await Promise.resolve(params.courseId);

  const course = await db.course.findUnique({
    where: {
      id: courseId,
    }
  });

  return {
    title: course?.title || "Course Details | SkillHub",
    description: course?.description || "Learn new skills with our detailed courses"
  };
}

const CourseIdPage = async (props: {params: Promise<{ courseId: string; }>}) => {
  const params = await props.params;
  const courseId = await Promise.resolve(params.courseId);

  const course = await db.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      category: true,
      reviews: true,
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
        include: {
          sections: true,
        },
      },
      _count: {
        select: {
          Enrollment: true,
        },
      },
    },
  });

  const user:any = await currentUser();

  if (!course) {
    return redirect("/");
  }

  // Check if user is enrolled in this course
  let enrollment = null;
  if (user?.id) {
    try {
      enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId,
          },
        },
      });
    } catch (error) {
      console.error("Error checking enrollment:", error);
    }
  }

  const chapters = course?.chapters || [];

  // Fetch initial reviews with error handling
  let reviews: CourseReview[] = [];
  try {
    reviews = await db.courseReview.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    // Continue with empty reviews array
  }

  return (
    <div className="-mt-16">
      <CourseCard 
        course={course} 
        userId={user?.id}
        isEnrolled={!!enrollment}
      />
      
      <div className="mt-12">
        <CoursePageTabs 
          chapters={chapters}
          courseId={courseId}
          initialReviews={reviews}
          isEnrolled={!!enrollment}
          userId={user?.id}
        />
      </div>
      
      <Footer />
    </div>
  )
}
 
export default CourseIdPage;