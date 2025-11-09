"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Award,
  Download,
  Share2,
  Printer,
  Mail,
  Copy,
  Check,
  Loader2,
  Trophy,
  Star,
  Medal,
  Target,
  Calendar,
  User,
  BookOpen,
  Clock,
  Shield,
  QrCode,
  FileText,
  Linkedin,
  Twitter,
  Facebook,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";

interface CertificateData {
  recipientName: string;
  courseName: string;
  completionDate: Date;
  certificateId: string;
  issuerName?: string;
  issuerTitle?: string;
  score?: number;
  timeSpent?: number; // in minutes
  sectionsCompleted?: number;
  totalSections?: number;
  skills?: string[];
}

interface CompletionCertificateProps {
  certificateData?: CertificateData;
  courseId: string;
  userId?: string;
  onGenerate?: () => void;
  onShare?: (platform: string) => void;
}

// Certificate templates
const certificateTemplates = {
  classic: {
    name: "Classic",
    bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
    borderColor: "border-amber-500",
    textColor: "text-amber-900",
    accentColor: "text-amber-600",
  },
  modern: {
    name: "Modern",
    bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
    borderColor: "border-blue-500",
    textColor: "text-blue-900",
    accentColor: "text-blue-600",
  },
  elegant: {
    name: "Elegant",
    bgColor: "bg-gradient-to-br from-purple-50 to-pink-100",
    borderColor: "border-purple-500",
    textColor: "text-purple-900",
    accentColor: "text-purple-600",
  },
  professional: {
    name: "Professional",
    bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
    borderColor: "border-gray-600",
    textColor: "text-gray-900",
    accentColor: "text-gray-700",
  },
};

export function CompletionCertificate({
  certificateData,
  courseId,
  userId,
  onGenerate,
  onShare,
}: CompletionCertificateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof certificateTemplates>("classic");
  const [showPreview, setShowPreview] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [verificationUrl, setVerificationUrl] = useState<string>("");
  const certificateRef = useRef<HTMLDivElement>(null);

  // Generate verification URL and QR code
  useEffect(() => {
    if (certificateData?.certificateId) {
      const url = `${window.location.origin}/verify/${certificateData.certificateId}`;
      setVerificationUrl(url);

      // Generate QR code
      QRCode.toDataURL(url, { width: 100, margin: 1 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [certificateData?.certificateId]);

  // Generate certificate ID
  const generateCertificateId = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `CERT-${timestamp}-${random}`.toUpperCase();
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Format time spent
  const formatTimeSpent = (minutes?: number): string => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  // Generate PDF certificate
  const generatePDF = async () => {
    if (!certificateRef.current) return;

    setIsGenerating(true);
    try {
      // Capture certificate as image
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);

      // Save PDF
      const fileName = `certificate-${certificateData?.certificateId || generateCertificateId()}.pdf`;
      pdf.save(fileName);

      toast.success("Certificate downloaded successfully!");
      onGenerate?.();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  // Print certificate
  const handlePrint = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: null,
      });

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Please allow pop-ups to print the certificate");
        return;
      }

      const imgData = canvas.toDataURL("image/png");
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate of Completion</title>
            <style>
              @media print {
                body { margin: 0; }
                img { width: 100%; height: auto; }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" />
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Error printing certificate:", error);
      toast.error("Failed to print certificate");
    }
  };

  // Share certificate
  const handleShare = async (platform: string) => {
    const shareText = `I just completed ${certificateData?.courseName}! 🎉`;
    const shareUrl = verificationUrl;

    const shareUrls: Record<string, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank");
      onShare?.(platform);
      toast.success(`Shared to ${platform}`);
    }
  };

  // Copy verification link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      toast.success("Verification link copied!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  // Email certificate
  const handleEmail = () => {
    const subject = `Certificate of Completion - ${certificateData?.courseName}`;
    const body = `I'm excited to share that I've completed ${certificateData?.courseName}!\n\nVerify my certificate: ${verificationUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const template = certificateTemplates[selectedTemplate];

  // Default certificate data if not provided
  const defaultData: CertificateData = {
    recipientName: "Your Name",
    courseName: "Course Title",
    completionDate: new Date(),
    certificateId: generateCertificateId(),
    issuerName: "Taxomind",
    issuerTitle: "Director of Education",
    score: 95,
    timeSpent: 480,
    sectionsCompleted: 12,
    totalSections: 12,
    skills: ["React", "TypeScript", "Next.js"],
  };

  const data = certificateData || defaultData;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificate of Completion
          </CardTitle>
          <CardDescription>
            Generate and share your achievement certificate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Certificate Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={(value) => setSelectedTemplate(value as keyof typeof certificateTemplates)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(certificateTemplates).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleEmail}
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <Label>Share Your Achievement</Label>
            <div className="flex gap-2">
              <Button
                onClick={() => handleShare("linkedin")}
                variant="outline"
                size="sm"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button
                onClick={() => handleShare("twitter")}
                variant="outline"
                size="sm"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={() => handleShare("facebook")}
                variant="outline"
                size="sm"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
            </div>
          </div>

          {/* Verification Link */}
          <div className="space-y-2">
            <Label>Verification Link</Label>
            <div className="flex gap-2">
              <Input
                value={verificationUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
            <DialogDescription>
              This is how your certificate will look
            </DialogDescription>
          </DialogHeader>

          {/* Certificate Design */}
          <div
            ref={certificateRef}
            className={cn(
              "relative w-full aspect-[1.414/1] p-12 rounded-lg border-4",
              template.bgColor,
              template.borderColor,
              template.textColor
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <circle cx="50" cy="50" r="40" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern)" />
              </svg>
            </div>

            {/* Certificate Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-between text-center">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <Trophy className={cn("h-16 w-16", template.accentColor)} />
                </div>
                <h1 className="text-4xl font-bold tracking-wider">
                  CERTIFICATE OF COMPLETION
                </h1>
                <div className="w-32 h-1 bg-current mx-auto opacity-20" />
              </div>

              {/* Main Content */}
              <div className="space-y-6">
                <p className="text-lg">This is to certify that</p>
                <h2 className="text-3xl font-bold">{data.recipientName}</h2>
                <p className="text-lg">has successfully completed</p>
                <h3 className={cn("text-2xl font-semibold", template.accentColor)}>
                  {data.courseName}
                </h3>
                <p className="text-sm">on {formatDate(data.completionDate)}</p>

                {/* Achievement Stats */}
                {(data.score || data.timeSpent || data.sectionsCompleted) && (
                  <div className="flex justify-center gap-8 mt-6">
                    {data.score && (
                      <div className="text-center">
                        <Star className={cn("h-6 w-6 mx-auto mb-1", template.accentColor)} />
                        <p className="text-sm font-semibold">{data.score}%</p>
                        <p className="text-xs opacity-70">Score</p>
                      </div>
                    )}
                    {data.timeSpent && (
                      <div className="text-center">
                        <Clock className={cn("h-6 w-6 mx-auto mb-1", template.accentColor)} />
                        <p className="text-sm font-semibold">{formatTimeSpent(data.timeSpent)}</p>
                        <p className="text-xs opacity-70">Time Invested</p>
                      </div>
                    )}
                    {data.sectionsCompleted && (
                      <div className="text-center">
                        <Target className={cn("h-6 w-6 mx-auto mb-1", template.accentColor)} />
                        <p className="text-sm font-semibold">{data.sectionsCompleted}/{data.totalSections}</p>
                        <p className="text-xs opacity-70">Sections</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wider opacity-70 mb-2">Skills Acquired</p>
                    <div className="flex justify-center gap-2">
                      {data.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="space-y-4">
                {/* Signatures */}
                <div className="flex justify-center gap-16">
                  <div className="text-center">
                    <div className="w-32 border-b-2 border-current opacity-50 mb-2" />
                    <p className="text-sm font-semibold">{data.issuerName}</p>
                    <p className="text-xs opacity-70">{data.issuerTitle}</p>
                  </div>
                </div>

                {/* Verification */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-xs opacity-70">Certificate ID</p>
                    <p className="text-xs font-mono">{data.certificateId}</p>
                  </div>
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="h-16 w-16"
                    />
                  )}
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 opacity-70" />
                    <p className="text-xs opacity-70">Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}