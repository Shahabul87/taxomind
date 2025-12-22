/**
 * Post Edit Layout
 *
 * Note: SmartHeader and SmartSidebar are already provided by TeacherLayout
 * This layout only needs to pass through children
 */
export default function PostEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
