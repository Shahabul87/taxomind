import { LoginForm } from "@/components/auth/login-form";
import { getAuthPageStats, formatStatNumber, formatRating } from "@/lib/queries/auth-stats-queries";

export const dynamic = 'force-dynamic';

const LoginPage = async () => {
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
      <LoginForm stats={stats} />
    </div>
  );
}

export default LoginPage;