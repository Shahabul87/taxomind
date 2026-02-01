'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  FileJson,
  Linkedin,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Settings2,
  Palette,
  Share2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Lock,
  FileImage,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PortfolioPreview, PortfolioData, ExportSections } from './PortfolioPreview';

export interface PortfolioExportProps {
  className?: string;
  compact?: boolean;
  defaultTab?: 'preview' | 'export' | 'share';
}

type ExportFormat = 'pdf' | 'json' | 'html' | 'linkedin';
type ThemeOption = 'professional' | 'creative' | 'minimal' | 'dark';

const EXPORT_FORMATS: { id: ExportFormat; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'pdf', label: 'PDF Document', icon: FileText, description: 'Professional document for sharing' },
  { id: 'html', label: 'HTML Page', icon: Globe, description: 'Standalone web page' },
  { id: 'json', label: 'JSON Data', icon: FileJson, description: 'Raw data for developers' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, description: 'Formatted for LinkedIn profile' },
];

const THEME_OPTIONS: { id: ThemeOption; label: string; preview: string }[] = [
  { id: 'professional', label: 'Professional', preview: 'bg-white border-blue-200' },
  { id: 'creative', label: 'Creative', preview: 'bg-gradient-to-br from-purple-100 to-pink-100' },
  { id: 'minimal', label: 'Minimal', preview: 'bg-slate-50 border-slate-200' },
  { id: 'dark', label: 'Dark', preview: 'bg-slate-900 border-slate-700' },
];

export function PortfolioExport({
  className,
  compact = false,
  defaultTab = 'preview',
}: PortfolioExportProps) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [theme, setTheme] = useState<ThemeOption>('professional');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sections, setSections] = useState<ExportSections>({
    profile: true,
    skills: true,
    certifications: true,
    projects: true,
    achievements: true,
    stats: true,
  });

  // Fetch portfolio data
  useEffect(() => {
    const fetchPortfolio = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/sam/portfolio');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPortfolio(data.data);
            setLoadError(null);
          } else {
            setPortfolio(null);
            setLoadError('No portfolio data available yet.');
          }
        } else {
          setPortfolio(null);
          setLoadError('Failed to load portfolio data.');
        }
      } catch {
        setPortfolio(null);
        setLoadError('Failed to load portfolio data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sam/portfolio');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPortfolio(data.data);
          setLoadError(null);
          toast.success('Portfolio refreshed');
        }
      }
    } catch {
      toast.error('Failed to refresh portfolio');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExport = async () => {
    if (!portfolio) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(portfolio, sections, theme);
          break;
        case 'html':
          await exportToHTML(portfolio, sections, theme);
          break;
        case 'json':
          await exportToJSON(portfolio, sections);
          break;
        case 'linkedin':
          await exportToLinkedIn(portfolio);
          break;
      }

      setExportSuccess(true);
      toast.success(`Portfolio exported as ${exportFormat.toUpperCase()}`);

      setTimeout(() => {
        setShowExportDialog(false);
        setExportSuccess(false);
      }, 1500);
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!portfolio) return;

    // Generate shareable URL (in production, this would create a public link)
    const shareableUrl = `${window.location.origin}/portfolio/${portfolio.userId}`;
    setShareUrl(shareableUrl);
  };

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleSection = (section: keyof ExportSections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (compact) {
    return (
      <Card className={cn('border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-indigo-500" />
              Portfolio Export
            </span>
            <Button
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : portfolio ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                  <div className="text-lg font-bold">{portfolio.stats.totalSkills}</div>
                  <div className="text-xs text-slate-500">Skills</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                  <div className="text-lg font-bold">{portfolio.stats.totalProjects}</div>
                  <div className="text-xs text-slate-500">Projects</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                  <div className="text-lg font-bold">{portfolio.stats.totalCertifications}</div>
                  <div className="text-xs text-slate-500">Certs</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Export your learning portfolio to share with employers
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">
              {loadError ?? 'No portfolio data available'}
            </p>
          )}
        </CardContent>

        {/* Export Dialog */}
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          portfolio={portfolio}
          sections={sections}
          toggleSection={toggleSection}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          theme={theme}
          setTheme={setTheme}
          isExporting={isExporting}
          exportSuccess={exportSuccess}
          onExport={handleExport}
        />
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            <Share2 className="h-6 w-6 text-indigo-500" />
            Portfolio Export
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Export and share your learning portfolio with employers and connections
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : !portfolio ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              No Portfolio Data
            </h3>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              Complete courses and add projects to build your portfolio
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-slate-100/80 dark:bg-slate-800/80">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="share" className="gap-2">
              <Link2 className="h-4 w-4" />
              Share
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Portfolio Preview</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Theme:</Label>
                    <Select value={theme} onValueChange={(v) => setTheme(v as ThemeOption)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THEME_OPTIONS.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PortfolioPreview
                  portfolio={portfolio}
                  sections={sections}
                  theme={theme}
                  className="max-h-[600px] overflow-y-auto"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Settings</CardTitle>
                  <CardDescription>Customize what to include in your export</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sections */}
                  <div className="space-y-3">
                    <Label>Include Sections</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(sections).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={value}
                            onCheckedChange={() => toggleSection(key as keyof ExportSections)}
                          />
                          <label
                            htmlFor={key}
                            className="text-sm font-medium capitalize cursor-pointer"
                          >
                            {key}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {THEME_OPTIONS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border-2 p-3 transition-all',
                            theme === t.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                              : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                          )}
                        >
                          <div className={cn('h-6 w-6 rounded border', t.preview)} />
                          <span className="text-sm font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Format</CardTitle>
                  <CardDescription>Choose your preferred format</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {EXPORT_FORMATS.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setExportFormat(format.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                          exportFormat === format.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                        )}
                      >
                        <format.icon className={cn(
                          'h-8 w-8',
                          exportFormat === format.id ? 'text-indigo-600' : 'text-slate-400'
                        )} />
                        <span className="text-sm font-medium">{format.label}</span>
                        <span className="text-xs text-slate-500">{format.description}</span>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Export as {exportFormat.toUpperCase()}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share Your Portfolio</CardTitle>
                <CardDescription>Generate a shareable link to your portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Privacy Setting */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {portfolio.settings.isPublic ? (
                      <Globe className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-400" />
                    )}
                    <div>
                      <p className="font-medium">Portfolio Visibility</p>
                      <p className="text-sm text-slate-500">
                        {portfolio.settings.isPublic
                          ? 'Your portfolio is public and can be shared'
                          : 'Your portfolio is private'}
                      </p>
                    </div>
                  </div>
                  <Switch checked={portfolio.settings.isPublic} />
                </div>

                {/* Generate Link */}
                <div className="space-y-3">
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Generate Shareable Link
                  </Button>

                  {shareUrl && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyUrl}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Social Share Buttons */}
                <div className="space-y-3">
                  <Label>Quick Share</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2">
                      <Linkedin className="h-4 w-4 text-blue-600" />
                      LinkedIn
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      X (Twitter)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Export Dialog Component
function ExportDialog({
  open,
  onOpenChange,
  portfolio,
  sections,
  toggleSection,
  exportFormat,
  setExportFormat,
  theme,
  setTheme,
  isExporting,
  exportSuccess,
  onExport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: PortfolioData | null;
  sections: ExportSections;
  toggleSection: (section: keyof ExportSections) => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  isExporting: boolean;
  exportSuccess: boolean;
  onExport: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Portfolio</DialogTitle>
          <DialogDescription>
            Choose format and customize your export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="grid grid-cols-2 gap-2">
            {EXPORT_FORMATS.slice(0, 4).map((format) => (
              <button
                key={format.id}
                onClick={() => setExportFormat(format.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all',
                  exportFormat === format.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                )}
              >
                <format.icon className={cn(
                  'h-6 w-6',
                  exportFormat === format.id ? 'text-indigo-600' : 'text-slate-400'
                )} />
                <span className="text-xs font-medium">{format.label}</span>
              </button>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-2">
            <Label className="text-sm">Include Sections</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(sections).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dialog-${key}`}
                    checked={value}
                    onCheckedChange={() => toggleSection(key as keyof ExportSections)}
                  />
                  <label htmlFor={`dialog-${key}`} className="text-xs font-medium capitalize cursor-pointer">
                    {key}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={onExport} disabled={isExporting || !portfolio} className="gap-2">
            <AnimatePresence mode="wait">
              {isExporting ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </motion.div>
              ) : exportSuccess ? (
                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Done!
                </motion.div>
              ) : (
                <motion.div key="export" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export Functions
async function exportToPDF(portfolio: PortfolioData, sections: ExportSections, theme: ThemeOption): Promise<void> {
  // Generate HTML for PDF conversion
  const html = generatePortfolioHTML(portfolio, sections, theme);
  const blob = new Blob([html], { type: 'text/html' });
  downloadFile(blob, `portfolio-${portfolio.userName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.html`);
  toast.info('HTML generated. Print to PDF using your browser.');
}

async function exportToHTML(portfolio: PortfolioData, sections: ExportSections, theme: ThemeOption): Promise<void> {
  const html = generatePortfolioHTML(portfolio, sections, theme);
  const blob = new Blob([html], { type: 'text/html' });
  downloadFile(blob, `portfolio-${portfolio.userName.replace(/\s+/g, '-').toLowerCase()}.html`);
}

async function exportToJSON(portfolio: PortfolioData, sections: ExportSections): Promise<void> {
  const exportData: Partial<PortfolioData> = {
    userId: portfolio.userId,
    userName: portfolio.userName,
    settings: portfolio.settings,
  };

  if (sections.skills) exportData.skills = portfolio.skills;
  if (sections.certifications) exportData.certifications = portfolio.certifications;
  if (sections.projects) exportData.projects = portfolio.projects;
  if (sections.achievements) exportData.achievements = portfolio.achievements;
  if (sections.stats) exportData.stats = portfolio.stats;

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, `portfolio-${portfolio.userName.replace(/\s+/g, '-').toLowerCase()}.json`);
}

async function exportToLinkedIn(portfolio: PortfolioData): Promise<void> {
  // Generate LinkedIn-formatted text
  const linkedInContent = `
🎓 ${portfolio.userName}&apos;s Learning Portfolio

📊 Overview:
• ${portfolio.stats.totalSkills} Skills Developed
• ${portfolio.stats.totalCertifications} Certifications Earned
• ${portfolio.stats.totalProjects} Projects Completed
• ${portfolio.stats.coursesCompleted} Courses Finished
• ${portfolio.stats.totalStudyHours}+ Hours of Dedicated Learning

🏆 Top Skills:
${portfolio.skills.slice(0, 5).map((s) => `• ${s.skillName} (${s.proficiencyLevel})`).join('\n')}

📜 Certifications:
${portfolio.certifications.slice(0, 3).map((c) => `• ${c.certificationName} - ${c.provider}`).join('\n')}

💼 Featured Projects:
${portfolio.projects.slice(0, 3).map((p) => `• ${p.title}: ${p.description.slice(0, 100)}...`).join('\n')}

---
Generated by Taxomind - AI-Powered Learning Platform
  `.trim();

  const blob = new Blob([linkedInContent], { type: 'text/plain' });
  downloadFile(blob, `linkedin-portfolio-${Date.now()}.txt`);

  // Also copy to clipboard
  navigator.clipboard.writeText(linkedInContent);
  toast.success('Content copied to clipboard! Paste it in your LinkedIn post.');
}

function generatePortfolioHTML(portfolio: PortfolioData, sections: ExportSections, theme: ThemeOption): string {
  const themeStyles = {
    professional: { bg: '#ffffff', text: '#1e293b', accent: '#2563eb' },
    creative: { bg: '#faf5ff', text: '#1e293b', accent: '#9333ea' },
    minimal: { bg: '#f8fafc', text: '#334155', accent: '#475569' },
    dark: { bg: '#0f172a', text: '#f8fafc', accent: '#818cf8' },
  };

  const style = themeStyles[theme];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${portfolio.userName}&apos;s Portfolio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${style.bg};
      color: ${style.text};
      line-height: 1.6;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; color: ${style.accent}; margin: 2rem 0 1rem; border-bottom: 2px solid ${style.accent}; padding-bottom: 0.5rem; }
    .header { text-align: center; margin-bottom: 2rem; }
    .headline { color: ${style.accent}; font-size: 1.1rem; }
    .bio { margin-top: 1rem; opacity: 0.8; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0; }
    .stat { text-align: center; padding: 1rem; background: ${theme === 'dark' ? '#1e293b' : '#f1f5f9'}; border-radius: 8px; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: ${style.accent}; }
    .stat-label { font-size: 0.75rem; opacity: 0.7; }
    .skill, .cert, .project { padding: 1rem; margin: 0.5rem 0; background: ${theme === 'dark' ? '#1e293b' : '#f8fafc'}; border-radius: 8px; border-left: 4px solid ${style.accent}; }
    .skill-name { font-weight: 600; }
    .skill-level { font-size: 0.8rem; color: ${style.accent}; }
    .project-title { font-weight: 600; }
    .project-desc { font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8; }
    .footer { text-align: center; margin-top: 3rem; font-size: 0.8rem; opacity: 0.5; }
    .badges { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .badge { background: ${style.accent}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; }
  </style>
</head>
<body>
  ${sections.profile ? `
  <div class="header">
    <h1>${portfolio.userName}</h1>
    ${portfolio.settings.headline ? `<p class="headline">${portfolio.settings.headline}</p>` : ''}
    ${portfolio.settings.bio ? `<p class="bio">${portfolio.settings.bio}</p>` : ''}
  </div>
  ` : ''}

  ${sections.stats ? `
  <div class="stats">
    <div class="stat"><div class="stat-value">${portfolio.stats.totalSkills}</div><div class="stat-label">Skills</div></div>
    <div class="stat"><div class="stat-value">${portfolio.stats.totalCertifications}</div><div class="stat-label">Certifications</div></div>
    <div class="stat"><div class="stat-value">${portfolio.stats.totalProjects}</div><div class="stat-label">Projects</div></div>
    <div class="stat"><div class="stat-value">${portfolio.stats.coursesCompleted}</div><div class="stat-label">Courses</div></div>
    <div class="stat"><div class="stat-value">${portfolio.stats.totalStudyHours}h</div><div class="stat-label">Study Hours</div></div>
    <div class="stat"><div class="stat-value">${portfolio.stats.avgSkillScore}%</div><div class="stat-label">Avg Score</div></div>
  </div>
  ` : ''}

  ${sections.skills && portfolio.skills.length > 0 ? `
  <h2>Skills</h2>
  ${portfolio.skills.map((s) => `
    <div class="skill">
      <span class="skill-name">${s.skillName}</span>
      <span class="skill-level">${s.proficiencyLevel} (${s.compositeScore}%)</span>
    </div>
  `).join('')}
  ` : ''}

  ${sections.certifications && portfolio.certifications.length > 0 ? `
  <h2>Certifications</h2>
  ${portfolio.certifications.map((c) => `
    <div class="cert">
      <strong>${c.certificationName}</strong><br>
      <span>${c.provider}</span>
    </div>
  `).join('')}
  ` : ''}

  ${sections.projects && portfolio.projects.length > 0 ? `
  <h2>Projects</h2>
  ${portfolio.projects.map((p) => `
    <div class="project">
      <div class="project-title">${p.title}</div>
      <p class="project-desc">${p.description}</p>
      <div class="badges">
        ${p.technologies.map((t) => `<span class="badge">${t}</span>`).join('')}
      </div>
    </div>
  `).join('')}
  ` : ''}

  ${sections.achievements && portfolio.achievements.length > 0 ? `
  <h2>Achievements</h2>
  <div class="badges">
    ${portfolio.achievements.map((a) => `<span class="badge">${a.title}</span>`).join('')}
  </div>
  ` : ''}

  <div class="footer">
    Generated by Taxomind • ${new Date().toLocaleDateString()}
  </div>
</body>
</html>
  `.trim();
}

function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
