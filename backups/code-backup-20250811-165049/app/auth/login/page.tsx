import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="p-4 text-center">Loading login form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
 
export default LoginPage;