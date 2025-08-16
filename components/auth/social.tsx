"use client";

import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { GoogleIcon } from "@/components/icons/custom-icons";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");

  const onClick = (provider: "google" | "github") => {
     signIn(provider, {
      callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
     });
  }

  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        size="lg"
        className="w-full bg-blue-600 border-0"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <GoogleIcon className="h-5 w-5 mr-2" />
        Login with Google
      </Button>
      <Button
        size="lg"
        className="w-full bg-sky-800 border-0"
        variant="outline"
        onClick={() => onClick("github")}
      >
        <Github className="h-5 w-5 mr-2" />
        Login with Github
      </Button>
    </div>
  );
};