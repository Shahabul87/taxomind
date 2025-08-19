import { Chapter, Course, Section } from "@prisma/client";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { SectionSidebar } from "./section-sidebar";

interface ChaptersFormProps {
    course: Course & { chapters: (Chapter & { sections: Section[] })[] };
  }

export const SectionMobileSidebar = ({ course }: ChaptersFormProps): JSX.Element => {
    return (
      <Sheet>
        <SheetTrigger>
          <Menu className="text-white" />
        </SheetTrigger>
        <SheetContent className="p-0 z-[100]" side="left">
          <SectionSidebar course={course} /> {/* Pass the course prop */}
        </SheetContent>
      </Sheet>
    );
  };