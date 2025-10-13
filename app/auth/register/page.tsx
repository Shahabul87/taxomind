import { RegisterForm } from "@/components/auth/register-form";

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

const RegisterPage = () => {
  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
