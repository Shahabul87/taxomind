import { NewVerificationForm } from "@/components/auth/new-verification-form";

export const dynamic = 'force-dynamic';

const NewVerificationPage = () => {
  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <NewVerificationForm />
    </div>
  );
}

export default NewVerificationPage;