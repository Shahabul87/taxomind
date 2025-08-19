import { Chapter, Course, Section } from "@prisma/client";

import { SectionMobileSidebar } from "./section-mobile-sidebar";

interface ChaptersFormProps {
    course: Course & { chapters: (Chapter & { sections: Section[] })[] };
  }


export const SectionMobileHeader = ({ course }: ChaptersFormProps): JSX.Element => {

    return (
        <nav className ="lg:hidden px-6 h-[50px] flex items-center bg-yellow-500 border-b fixed top-0 w-full z-50">
            <SectionMobileSidebar course={course} />
        </nav>
    )
}