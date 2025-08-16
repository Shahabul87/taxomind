"use server";

import "./_components/_explanations/styles/changes.css";

export default async function SectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 