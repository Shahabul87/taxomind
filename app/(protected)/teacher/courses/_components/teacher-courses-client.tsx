'use client';

import { SmartBottomBar } from "@/components/mobile/SmartBottomBar";
import { useState } from "react";

interface TeacherCoursesClientProps {
  children: React.ReactNode;
}

export function TeacherCoursesClient({ children }: TeacherCoursesClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {children}
      <SmartBottomBar
        onMenuClick={() => {
          // Trigger sidebar open event
          const event = new CustomEvent('toggleSidebar');
          window.dispatchEvent(event);
        }}
        isVisible={true}
      />
    </>
  );
}
