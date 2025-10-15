import { LoginForm } from "@/components/auth/login-form";

export const dynamic = 'force-dynamic';

const LoginPage = () => {
  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <LoginForm />
    </div>
  );
}

export default LoginPage;