import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

const ResendVerificationPage = () => {
  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <ResendVerificationForm />
      </Suspense>
    </div>
  );
};

export default ResendVerificationPage;
