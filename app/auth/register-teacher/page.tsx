import { RegisterTeacherForm } from "@/components/auth/register-teacher-form";

export const dynamic = 'force-dynamic';

const RegisterTeacherPage = () => {
  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <RegisterTeacherForm />
    </div>
  );
}

export default RegisterTeacherPage;