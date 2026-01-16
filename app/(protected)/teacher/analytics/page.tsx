import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

import { getAnalytics } from "@/actions/get-analytics";

import { DataCard } from "./_components/data-card";
import { Chart } from "./_components/chart";
import { TeacherSAMInsights } from "./_components/teacher-sam-insights";

const AnalyticsPage = async () => {
    const user = await currentUser();

    if(!user?.id){
        return redirect("/");
    }
    
    const userId = user?.id;

  const {
    data,
    totalRevenue,
    totalSales,
  } = await getAnalytics(userId);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* Header glass shell */}
        <div className="rounded-xl border bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200/70 dark:border-gray-800/70 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Revenue and sales overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataCard
            label="Total Revenue"
            value={totalRevenue}
            shouldFormat
          />
          <DataCard
            label="Total Sales"
            value={totalSales}
          />
        </div>
        <Chart data={data} />

        {/* SAM AI Insights for Teachers */}
        <TeacherSAMInsights userId={userId} />
      </div>
   );
}
 
export default AnalyticsPage;
