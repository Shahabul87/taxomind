import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { SectionSidebar } from './section-sidebar';

interface SectionPageProps {
  params: Promise<{
    courseId: string;
    sectionId: string;
  }>;
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const courseId = resolvedParams.courseId;
  const sectionId = resolvedParams.sectionId;
  
  const section = await db.section.findUnique({
    where: {
      id: sectionId,
    }
  });

  if (!section) {
    return {
      title: "Not Found",
      description: "The section you&apos;re looking for doesn&apos;t exist."
    };
  }

  return {
    title: section.title,
    description: `Section: ${section.title}`
  };
}

const sectionIdPage = async (props: {params: Promise<{courseId: string; sectionId: string}>}): Promise<JSX.Element> => {
  const params = await props.params;
  const { courseId, sectionId } = params;

  const user = await currentUser();
  const section = await db.section.findUnique({
    where: {
      id: sectionId,
    },
  });

  const course = await db.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
        include: {
          sections: {
            where: {
              isPublished: true,
            },
            orderBy: {
              position: "asc",
            },
          },
        },
      },
    },
  });


  if (!section) {
     return redirect("/");
   }

  if (!course) {
    return redirect("/");
  }



  return (
    <div className="min-h-screen bg-slate-800">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl text-white font-bold py-4">{section.title}</h1>
      </div>
      <div className="container mx-auto px-4 flex flex-col xl:flex-row gap-6">
        <div className="flex-1 xl:mr-4">
          <div className="flex justify-center">
            {section.videoUrl ? (
                <div className="relative w-full pb-[56.25%]"> {/* 16:9 aspect ratio */}
                {/* Displaying YouTube iframe if videoUrl exists */}
                <iframe
                    className="absolute top-0 left-0 w-full h-full "
                    src={`https://www.youtube.com/embed/${new URL(section.videoUrl).searchParams.get("v")}`}
                    title="YouTube video player"
                    style={{ border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
                </div>
            ) : (
                <h1>No video has been found</h1>
            )}
            </div>

        <div className="flex items-center justify-between mt-2 px-3">
          <button className="bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base">
            Prev
          </button>
          <button className="bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base">
            Next
          </button>
        </div>
      </div>
      <div className="flex-none xl:w-1/3 border rounded-md mt-8 xl:mt-0 overflow-y-hidden shadow-md">
           
           <SectionSidebar course={course} />
  
        
      </div>
    </div>
    </div>
  )
}
 
export default sectionIdPage;
