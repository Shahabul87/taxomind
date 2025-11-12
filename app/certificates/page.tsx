import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, Download, Shield, Calendar, FileCheck } from "lucide-react";
import { certificateService } from "@/lib/certificate/service";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";
import { SmartHeader } from "@/components/dashboard/smart-header";

type Certificate = {
  id: string;
  userId: string;
  courseId: string;
  templateId?: string | null;
  verificationCode: string;
  issuedAt: Date;
  expiresAt?: Date | null;
  isRevoked: boolean;
  revokedAt?: Date | null;
  revokedReason?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
  };
  template?: {
    name: string;
    templateType: string;
  } | null;
};

export default async function CertificatesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch user certificates directly from service
  const certificates = await certificateService.getUserCertificates(session.user.id);

  return (
    <>
      <SmartSidebar user={session.user} />
      <SmartHeader user={session.user} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 pt-16 pl-[88px]">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              My Certificates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
              View and download your earned certificates. Share your achievements with employers and on social media.
            </p>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Certificates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{certificates.length}</p>
              </div>
              <Award className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {certificates.filter((c: Certificate) => c.verificationCode).length}
                </p>
              </div>
              <Shield className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Year</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {certificates.filter((c: Certificate) => new Date(c.issuedAt).getFullYear() === new Date().getFullYear()).length}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No certificates yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Complete courses to earn your first certificate and showcase your achievements.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Courses
            </Link>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

interface CertificateCardProps {
  certificate: Certificate;
}

function CertificateCard({ certificate }: CertificateCardProps) {
  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Extract metadata fields if available
  const finalScore = certificate.metadata?.finalScore;
  const certificateUrl = certificate.metadata?.certificateUrl;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group">
      {/* Certificate Preview */}
      <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6">
            <Award className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2">
              {certificate.course?.title || "Course"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Certificate of Completion
            </p>
          </div>
        </div>

        {/* Verification Badge */}
        {certificate.verificationCode && !certificate.isRevoked && (
          <div className="absolute top-3 right-3">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </div>
          </div>
        )}

        {/* Revoked Badge */}
        {certificate.isRevoked && (
          <div className="absolute top-3 right-3">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              Revoked
            </div>
          </div>
        )}

        {/* Score Badge */}
        {finalScore && (
          <div className="absolute top-3 left-3">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              Score: {finalScore}%
            </div>
          </div>
        )}
      </div>

      {/* Certificate Info */}
      <div className="p-4">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
          <Calendar className="h-3 w-3 mr-1" />
          {formattedDate}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Verification Code: {certificate.verificationCode.substring(0, 8)}...
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {certificateUrl && (
            <a
              href={certificateUrl}
              download
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          )}

          {certificate.verificationCode && !certificate.isRevoked && (
            <Link
              href={`/api/certificates/verify?code=${certificate.verificationCode}`}
              target="_blank"
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <FileCheck className="h-4 w-4 mr-1" />
              Verify
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
