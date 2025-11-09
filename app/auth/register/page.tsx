import { RegisterForm } from "@/components/auth/register-form";
import { getAuthPageStats, formatStatNumber, formatRating } from "@/lib/queries/auth-stats-queries";

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

const RegisterPage = async () => {
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
      <RegisterForm stats={stats} />
    </div>
  );
};

export default RegisterPage;
