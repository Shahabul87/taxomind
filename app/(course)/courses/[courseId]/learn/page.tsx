import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { CourseLearningDashboard } from "./_components/course-learning-dashboard";

const CourseLearningPage = async (
  props: {
    params: Promise<{ courseId: string }>
  }
) => {
  const params = await props.params;
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  // Check if user is enrolled
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId
      }
    },
    include: {
      course: {
        include: {
          chapters: {
            include: {
              sections: {
                include: {
                  userProgress: {
                    where: {
                      userId: user.id
                    }
                  },
                  videos: {
                    select: {
                      id: true,
                      title: true,
                      duration: true,
                    }
                  },
                  blogs: {
                    select: {
                      id: true,
                      title: true,
                    }
                  },
                  articles: {
                    select: {
                      id: true,
                      title: true,
                    }
                  },
                  notes: {
                    select: {
                      id: true,
                      title: true,
                    }
                  },
                  codeExplanations: {
                    select: {
                      id: true,
                      heading: true,
                    }
                  }
                },
                orderBy: {
                  position: 'asc'
                }
              },
              userProgress: {
                where: {
                  userId: user.id
                }
              }
            },
            orderBy: {
              position: 'asc'
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          category: true,
          _count: {
            select: {
              Enrollment: true
            }
          }
        }
      }
    }
  });

  if (!enrollment) {
    return redirect(`/courses/${params.courseId}`);
  }

  // Calculate overall progress
  const totalSections = enrollment.course.chapters.reduce(
    (acc, chapter) => acc + chapter.sections.length, 
    0
  );
  
  const completedSections = enrollment.course.chapters.reduce(
    (acc, chapter) => acc + chapter.sections.filter(
      section => section.userProgress.some(progress => progress.isCompleted)
    ).length,
    0
  );

  const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  return (
    <CourseLearningDashboard 
      course={enrollment.course}
      user={{ ...user, id: user.id! }}
      progressPercentage={progressPercentage}
      totalSections={totalSections}
      completedSections={completedSections}
    />
  );
};

export default CourseLearningPage; 