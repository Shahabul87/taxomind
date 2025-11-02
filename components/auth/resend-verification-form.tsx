"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { resendVerification } from "@/actions/resend-verification";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Mail, Clock, CheckCircle2 } from "lucide-react";

const ResendVerificationSchema = z.object({
  email: z.string().email({
    message: "Valid email is required",
  }),
});

export const ResendVerificationForm = () => {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email");

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [retryAfter, setRetryAfter] = useState<number | undefined>();

  const form = useForm<z.infer<typeof ResendVerificationSchema>>({
    resolver: zodResolver(ResendVerificationSchema),
    defaultValues: {
      email: emailFromUrl || "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResendVerificationSchema>) => {
    setError("");
    setSuccess("");
    setRetryAfter(undefined);

    startTransition(() => {
      resendVerification(values).then((data) => {
        if (data?.error) {
          setError(data.error);
          if (data.retryAfter) {
            setRetryAfter(data.retryAfter);
          }
        }

        if (data?.success) {
          setSuccess(data.success);
          if (data.emailSent) {
            form.reset();
          }
        }
      });
    });
  };

  return (
    <CardWrapper
      headerLabel="Resend Verification Email"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Email Verification Required
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Enter your email address below to receive a new verification link.
                Check your spam folder if you don&apos;t see the email within a few minutes.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="john.doe@example.com"
                        type="email"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />

            {retryAfter && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
                <Clock className="h-4 w-4" />
                <span>Please wait {retryAfter} seconds before trying again.</span>
              </div>
            )}

            <Button disabled={isPending} type="submit" className="w-full">
              {isPending ? "Sending..." : "Send Verification Email"}
            </Button>
          </form>
        </Form>

        {/* Help Section */}
        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-foreground">Already verified?</p>
              <p>
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline"
                >
                  Try logging in here
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Need help?</p>
              <p>
                If you continue to have issues, please contact support at{" "}
                <a
                  href="mailto:support@taxomind.com"
                  className="text-primary hover:underline"
                >
                  support@taxomind.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
};
