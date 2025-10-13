import { RegisterForm } from "@/components/auth/register-form";
import { Suspense } from "react";

const RegisterPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading registration form...</p>
        </div>
      </div>
    }>
      <div className="mt-20 flex flex-col items-center justify-center">
        <RegisterForm />
      </div>
    </Suspense>
  );
};

export default RegisterPage;
