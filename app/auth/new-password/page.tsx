import { NewPasswordForm } from "@/components/auth/new-password-form";

export const dynamic = 'force-dynamic';

const NewPasswordPage = () => {
  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <NewPasswordForm />
    </div>
  );
}

export default NewPasswordPage;