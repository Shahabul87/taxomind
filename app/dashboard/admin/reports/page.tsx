import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { redirect } from "next/navigation";
import { AdminReportsClient } from "./_components/AdminReportsClient";
import { AuditAction, AuditSeverity } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Report {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  date: string;
  status: "Completed" | "Processing" | "Failed";
  size: string;
  entityType: string;
  severity: AuditSeverity;
}

interface ReportStats {
  totalReports: number;
  completedReports: number;
  processingReports: number;
  failedReports: number;
  reportsThisMonth: number;
  successRate: number;
}

// Map audit actions to report types
function getReportType(action: AuditAction, entityType: string): string {
  if (entityType.toLowerCase().includes("payment") || entityType.toLowerCase().includes("revenue")) {
    return "Financial";
  }
  if (entityType.toLowerCase().includes("user") || entityType.toLowerCase().includes("enrollment")) {
    return "Analytics";
  }
  if (entityType.toLowerCase().includes("course") || entityType.toLowerCase().includes("chapter")) {
    return "Academic";
  }
  if (entityType.toLowerCase().includes("exam") || entityType.toLowerCase().includes("progress")) {
    return "Performance";
  }
  if (entityType.toLowerCase().includes("system") || entityType.toLowerCase().includes("health")) {
    return "Technical";
  }
  return "General";
}

// Map severity to status
function getReportStatus(severity: AuditSeverity): "Completed" | "Processing" | "Failed" {
  switch (severity) {
    case "ERROR":
    case "CRITICAL":
      return "Failed";
    case "WARNING":
      return "Processing";
    default:
      return "Completed";
  }
}

// Generate a human-readable report name from audit log
function getReportName(action: AuditAction, entityType: string, entityName?: string | null): string {
  const actionMap: Record<string, string> = {
    CREATE: "Creation",
    UPDATE: "Update",
    DELETE: "Deletion",
    VIEW: "View",
    EXPORT: "Export",
    IMPORT: "Import",
    LOGIN: "Login",
    LOGOUT: "Logout",
    PASSWORD_CHANGE: "Password Change",
    PERMISSION_CHANGE: "Permission Change",
    SETTINGS_CHANGE: "Settings Change",
    BULK_OPERATION: "Bulk Operation",
    SYSTEM_EVENT: "System Event",
    API_CALL: "API Activity",
    FILE_UPLOAD: "File Upload",
    FILE_DOWNLOAD: "File Download",
    REPORT_GENERATION: "Report Generation",
  };

  const actionName = actionMap[action] || action;
  const entity = entityName || entityType;

  return `${entity} ${actionName} Report`;
}

async function getReportStats(): Promise<ReportStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalLogs, errorLogs, warningLogs, logsThisMonth] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.count({
      where: {
        severity: { in: ["ERROR", "CRITICAL"] },
      },
    }),
    db.auditLog.count({
      where: {
        severity: "WARNING",
      },
    }),
    db.auditLog.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  const completedReports = totalLogs - errorLogs - warningLogs;
  const successRate = totalLogs > 0 ? Math.round((completedReports / totalLogs) * 1000) / 10 : 100;

  return {
    totalReports: totalLogs,
    completedReports,
    processingReports: warningLogs,
    failedReports: errorLogs,
    reportsThisMonth: logsThisMonth,
    successRate,
  };
}

async function getRecentReports(): Promise<Report[]> {
  const recentLogs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityName: true,
      severity: true,
      createdAt: true,
      userEmail: true,
      changes: true,
    },
  });

  return recentLogs.map((log) => {
    // Calculate approximate "size" based on changes field
    const changesSize = log.changes ? JSON.stringify(log.changes).length : 0;
    let size = "-";
    if (changesSize > 0) {
      if (changesSize > 1000000) {
        size = `${(changesSize / 1000000).toFixed(1)} MB`;
      } else if (changesSize > 1000) {
        size = `${(changesSize / 1000).toFixed(1)} KB`;
      } else {
        size = `${changesSize} B`;
      }
    }

    const status = getReportStatus(log.severity);

    return {
      id: log.id,
      name: getReportName(log.action, log.entityType, log.entityName),
      type: getReportType(log.action, log.entityType),
      generatedBy: log.userEmail || "System",
      date: log.createdAt.toISOString().split("T")[0],
      status,
      size: status === "Completed" ? size : "-",
      entityType: log.entityType,
      severity: log.severity,
    };
  });
}

export default async function AdminReportsPage() {
  // Check admin session
  const session = await adminAuth();
  if (!session?.user) {
    redirect("/admin/auth/login");
  }

  // Fetch reports data
  const [stats, reports] = await Promise.all([
    getReportStats(),
    getRecentReports(),
  ]);

  return <AdminReportsClient initialStats={stats} initialReports={reports} />;
}
