import { LoginForm } from "@/components/auth/login-form";
import { getAuthPageStats, formatStatNumber, formatRating } from "@/lib/queries/auth-stats-queries";

export const dynamic = 'force-dynamic';

const LoginPage = async () => {
  // Fetch real statistics from database
  const rawStats = await getAuthPageStats();

  // Format stats for display
  const stats = {
    totalLearners: formatStatNumber(rawStats.totalLearners),
    totalCourses: formatStatNumber(rawStats.totalCourses),
    averageRating: formatRating(rawStats.averageRating),
  };

  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <LoginForm stats={stats} />
    </div>
  );
}

export default LoginPage;