import { RegisterForm } from "@/components/auth/register-form";
import { getAuthPageStats, formatStatNumber, formatRating } from "@/lib/queries/auth-stats-queries";

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

const RegisterPage = async () => {
  // Fetch real statistics from database
  const rawStats = await getAuthPageStats();

  // Fallback to default stats if query fails or returns undefined
  const safeStats = rawStats || {
    totalLearners: 0,
    totalCourses: 0,
    averageRating: 4.5,
  };

  // Format stats for display
  const stats = {
    totalLearners: formatStatNumber(safeStats.totalLearners),
    totalCourses: formatStatNumber(safeStats.totalCourses),
    averageRating: formatRating(safeStats.averageRating),
  };

  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <RegisterForm stats={stats} />
    </div>
  );
};

export default RegisterPage;
