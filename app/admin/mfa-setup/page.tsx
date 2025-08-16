import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminMFAInfo } from "@/lib/auth/mfa-enforcement";
import { MFASetupClient } from "./client";

export const metadata: Metadata = {
  title: "MFA Setup - Admin Security",
  description: "Set up Multi-Factor Authentication for enhanced admin security",
};

export default async function AdminMFASetupPage() {
  const session = await auth();
  
  // Redirect if not logged in or not an admin
  if (!session || !session.user) {
    redirect("/auth/login");
  }
  
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/user");
  }

  // Get MFA status information
  const mfaInfo = await getAdminMFAInfo(session.user.id);
  
  if (!mfaInfo) {
    redirect("/auth/login");
  }

  // If MFA is already properly configured, redirect to dashboard
  if (mfaInfo.isTwoFactorEnabled && mfaInfo.totpEnabled && mfaInfo.totpVerified) {
    redirect("/dashboard/admin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Secure Your Admin Account
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Multi-Factor Authentication (MFA) is required for all admin accounts.
              This adds an extra layer of security to protect your admin privileges.
            </p>
          </div>

          {/* MFA Setup Component */}
          <MFASetupClient 
            mfaInfo={mfaInfo}
            userEmail={session.user.email || ""}
          />

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600 mt-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Why is MFA Required for Admins?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Admin accounts have elevated privileges and access to sensitive data</li>
                    <li>MFA significantly reduces the risk of unauthorized access</li>
                    <li>Compliance with security best practices and regulations</li>
                    <li>Protection against password-based attacks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Apps Section */}
          <div className="mt-6 bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Supported Authenticator Apps
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">GA</span>
                </div>
                <p className="text-xs text-slate-600">Google Authenticator</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">A</span>
                </div>
                <p className="text-xs text-slate-600">Authy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">MS</span>
                </div>
                <p className="text-xs text-slate-600">Microsoft Authenticator</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">1P</span>
                </div>
                <p className="text-xs text-slate-600">1Password</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}