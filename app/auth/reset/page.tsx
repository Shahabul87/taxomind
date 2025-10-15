import { ResetForm } from "@/components/auth/reset-form";

export const dynamic = 'force-dynamic';

const ResetPage = () => {
  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <ResetForm />
    </div>
  );
}

export default ResetPage;