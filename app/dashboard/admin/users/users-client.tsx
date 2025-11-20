"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  X,
  Mail,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { CreateAdminDialog } from "./create-admin-dialog";

// Type definitions
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  status: "Active" | "Inactive" | "Suspended";
  joinDate: string;
  lastActive: string;
  courses: number;
  image: string | null;
  isTwoFactorEnabled: boolean;
  isAccountLocked: boolean;
  lastLoginAt: Date | null;
  emailVerified: Date | null;
}

interface Stats {
  total: number;
  active: number;
  instructors: number;
  newToday: number;
}

interface UsersClientProps {
  initialUsers: UserData[];
  initialStats: Stats;
}

export function UsersClient({ initialUsers, initialStats }: UsersClientProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState<Stats>(initialStats);
  const { toast } = useToast();

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    emailVerified: false,
    isTwoFactorEnabled: false,
    isAccountLocked: false,
  });

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
    }

    // Role filter removed - users no longer have roles

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, filterStatus, users]);

  // Handle view user details
  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  // Handle edit user
  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      emailVerified: !!user.emailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isAccountLocked: user.isAccountLocked,
    });
    setEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);

      // Track if any update fails
      const updates: Promise<Response>[] = [];

      // Update basic fields (name, email)
      updates.push(
        fetch("/api/admin/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            action: "update",
            data: {
              name: editForm.name,
              email: editForm.email,
            },
          }),
        })
      );

      // Handle email verified toggle
      if (editForm.emailVerified !== !!selectedUser.emailVerified) {
        if (editForm.emailVerified) {
          updates.push(
            fetch("/api/admin/users", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: selectedUser.id,
                action: "verify-email",
              }),
            })
          );
        }
        // Note: API doesn't support unverifying email, so we skip if going from verified to unverified
      }

      // Handle 2FA toggle
      if (editForm.isTwoFactorEnabled !== selectedUser.isTwoFactorEnabled) {
        updates.push(
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: selectedUser.id,
              action: editForm.isTwoFactorEnabled ? "enable-2fa" : "disable-2fa",
            }),
          })
        );
      }

      // Handle account lock toggle
      if (editForm.isAccountLocked !== selectedUser.isAccountLocked) {
        updates.push(
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: selectedUser.id,
              action: editForm.isAccountLocked ? "suspend" : "activate",
            }),
          })
        );
      }

      // Execute all updates
      const responses = await Promise.all(updates);

      // Check if any failed
      const failed = responses.find((res) => !res.ok);
      if (failed) {
        const errorData = await failed.json();
        throw new Error(errorData.error?.message || "Failed to update user");
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditDialogOpen(false);
      // Refresh page to get updated data
      window.location.reload();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle user actions (suspend/activate)
  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, action }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update user");
      }

      toast({
        title: "Success",
        description: `User ${action}d successfully`,
      });

      // Refresh page to get updated data
      window.location.reload();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update user",
        variant: "destructive",
      });
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: `User "${userToDelete.name || userToDelete.email}" has been deleted successfully`,
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);

      // Refresh page to get updated data
      window.location.reload();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete user",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "Suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // getRoleColor removed - users no longer have roles

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Page Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              Users Management
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Manage and monitor all platform users
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
          >
            <UserPlus className="mr-2 h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Add New User</span>
            <span className="sm:hidden">Add User</span>
          </Button>
        </motion.div>

        {/* Stats Grid - Gradient Cards */}
        <motion.div
          className="grid grid-cols-1 gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="initial"
          animate="animate"
        >
          {[
            {
              title: "Total Users",
              value: stats.total.toString(),
              description: "Total registered users",
              icon: Users,
              gradient: "from-blue-500 to-indigo-500",
              hoverGradient: "from-blue-400/20 to-indigo-700/20"
            },
            {
              title: "Active Users",
              value: stats.active.toString(),
              description: stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% of total users`
                : "Calculating...",
              icon: CheckCircle,
              gradient: "from-emerald-500 to-teal-500",
              hoverGradient: "from-emerald-400/20 to-teal-700/20"
            },
            {
              title: "Instructors",
              value: stats.instructors.toString(),
              description: "Including admins",
              icon: Shield,
              gradient: "from-purple-500 to-pink-500",
              hoverGradient: "from-purple-400/20 to-pink-700/20"
            },
            {
              title: "New Today",
              value: stats.newToday.toString(),
              description: "New registrations",
              icon: UserPlus,
              gradient: "from-orange-500 to-red-500",
              hoverGradient: "from-orange-400/20 to-red-700/20"
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className={cn(
                "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
                `bg-gradient-to-br ${stat.gradient}`
              )}>
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  stat.hoverGradient
                )} />
                <div className="relative p-3.5 sm:p-4 md:p-5">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white/90 truncate">{stat.title}</span>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-white/80 line-clamp-2">
                    {stat.description}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">All Users</span>
                </CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full md:w-[250px] bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50 focus:bg-white dark:focus:bg-slate-900 min-h-[44px] text-base sm:text-sm"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[150px] bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50 min-h-[44px] text-base sm:text-sm">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Mobile Card View / Desktop Table View */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">No users found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredUsers.map((user, idx) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                      <CardContent className="p-4 space-y-3">
                        {/* User Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden relative shrink-0">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || "User"}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {user.name
                                    ? user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                    : user.email?.[0]?.toUpperCase() || "U"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                                {user.name || "No name"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {user.email || "No email"}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-slate-500 dark:text-slate-400"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[calc(100vw-4rem)]">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              {!user.emailVerified && (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, "verify-email")}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Verify Email
                                </DropdownMenuItem>
                              )}
                              {user.status === "Suspended" ? (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, "suspend")}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={() => handleDeleteClick(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* User Details Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</p>
                            <Badge className={cn("mt-1 text-[10px]", getStatusColor(user.status))}>
                              {user.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Courses</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{user.courses}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Join Date</p>
                            <p className="mt-1 text-xs text-slate-900 dark:text-slate-100">{user.joinDate}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Last Active</p>
                            <p className="mt-1 text-xs text-slate-900 dark:text-slate-100 truncate">{user.lastActive}</p>
                          </div>
                        </div>

                        {/* Security Indicators */}
                        <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-1.5">
                            {user.isTwoFactorEnabled ? (
                              <Shield className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Shield className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                            )}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">2FA</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {user.emailVerified ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-red-500" />
                            )}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">Email</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableHead className="text-slate-600 dark:text-slate-300 text-left">
                      User
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-center">
                      Role
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-left">
                      Join Date
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-left">
                      Last Active
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-center">
                      Courses
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-center">
                      2FA
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-center">
                      Email Verified
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-left">
                      Verified At
                    </TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.02 }}
                    >
                      <TableCell className="text-left">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden relative">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || "User"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {user.name
                                  ? user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                  : user.email?.[0]?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {user.name || "No name"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-left">
                        {user.joinDate}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-left">
                        {user.lastActive}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-center">
                        {user.courses}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {user.isTwoFactorEnabled ? (
                            <Shield className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {user.emailVerified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 text-left">
                        {user.emailVerified ? (
                          <div className="text-xs">
                            {new Date(user.emailVerified).toLocaleDateString()}
                            <div className="text-slate-400 dark:text-slate-500">
                              {new Date(user.emailVerified).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          >
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                            <DropdownMenuItem
                              className="hover:bg-slate-100 dark:hover:bg-slate-700"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="hover:bg-slate-100 dark:hover:bg-slate-700"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            {!user.emailVerified && (
                              <DropdownMenuItem
                                className="hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={() =>
                                  handleUserAction(user.id, "verify-email")
                                }
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Verify Email
                              </DropdownMenuItem>
                            )}
                            {user.status === "Suspended" ? (
                              <DropdownMenuItem
                                className="hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={() =>
                                  handleUserAction(user.id, "activate")
                                }
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={() =>
                                  handleUserAction(user.id, "suspend")
                                }
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
              </div>
            </>
          )}

          {/* Results count */}
          {filteredUsers.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>

      {/* View User Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] sm:w-full bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shrink-0">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent truncate">
                  User Details
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  View complete information about this user
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedUser && (
            <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 py-4 sm:py-6 px-1 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
              {/* User Profile Card */}
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 flex items-center justify-center overflow-hidden relative shadow-md shrink-0">
                  {selectedUser.image ? (
                    <Image
                      src={selectedUser.image}
                      alt={selectedUser.name || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {selectedUser.name
                        ? selectedUser.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : selectedUser.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedUser.name || "No name"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">
                    {selectedUser.email || "No email"}
                  </p>
                </div>
              </div>

              {/* Information Section Header */}
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shrink-0"></div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Account Information
                </h3>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                {/* Status */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Status
                  </Label>
                  <div className="mt-2">
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>

                {/* Join Date */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Join Date
                  </Label>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedUser.joinDate}
                  </p>
                </div>

                {/* Last Active */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Last Active
                  </Label>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedUser.lastActive}
                  </p>
                </div>

                {/* Total Courses */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Total Courses
                  </Label>
                  <p className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">
                    {selectedUser.courses}
                  </p>
                </div>

                {/* Two-Factor Auth */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Two-Factor Auth
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    {selectedUser.isTwoFactorEnabled ? (
                      <>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-sm">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Enabled
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Status */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Account Status
                  </Label>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedUser.isAccountLocked ? (
                      <span className="text-red-600 dark:text-red-400">Locked</span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">Active</span>
                    )}
                  </p>
                </div>

                {/* Email Verified */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Email Verified
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    {selectedUser.emailVerified ? (
                      <>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-sm">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Verified
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
                          <X className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          Not Verified
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* User ID - Full Width */}
                <div className="col-span-2 p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    User ID
                  </Label>
                  <p className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-700">
                    {selectedUser.id}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 sm:pt-6 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="w-full sm:w-auto border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200 min-h-[44px] text-sm sm:text-base"
            >
              <X className="mr-2 h-4 w-4 shrink-0" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] sm:w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete User
            </AlertDialogTitle>
            {userToDelete && (
              <div className="space-y-3">
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {userToDelete.name || userToDelete.email}
                  </span>
                  ? This action cannot be undone and will permanently remove:
                </AlertDialogDescription>
                <ul className="space-y-1 list-disc list-inside text-sm text-slate-600 dark:text-slate-400 pl-1">
                  <li>User account and profile</li>
                  <li>All associated data and settings</li>
                  <li>Course enrollments and progress</li>
                  <li>User generated content</li>
                </ul>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={loading}
              className="w-full sm:w-auto border-slate-300 dark:border-slate-600 min-h-[44px] text-sm sm:text-base order-2 sm:order-1"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white min-h-[44px] text-sm sm:text-base order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg w-[calc(100vw-1rem)] sm:w-full bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shrink-0">
                <Edit className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 dark:from-purple-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Edit User Profile
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Update user information and permissions
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 py-4 sm:py-6 px-1">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                Basic Information
              </h3>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-name"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 min-h-[44px] text-base sm:text-sm"
                  placeholder="Enter user&apos;s full name"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-email"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email Address
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 min-h-[44px] text-base sm:text-sm"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
                  Permissions & Security
                </span>
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-3">
              {/* Email Verified Toggle */}
              <div className="group flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md group-hover:shadow-lg transition-shadow">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="edit-email-verified"
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      Email Verified
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mark user&apos;s email as verified
                    </p>
                  </div>
                </div>
                <Switch
                  id="edit-email-verified"
                  checked={editForm.emailVerified}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, emailVerified: checked })
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {/* 2FA Enabled Toggle */}
              <div className="group flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md group-hover:shadow-lg transition-shadow">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="edit-2fa"
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      Two-Factor Authentication
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enable 2FA for enhanced security
                    </p>
                  </div>
                </div>
                <Switch
                  id="edit-2fa"
                  checked={editForm.isTwoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, isTwoFactorEnabled: checked })
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {/* Account Locked Toggle */}
              <div className="group flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 shadow-md group-hover:shadow-lg transition-shadow">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="edit-account-locked"
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      Account Locked
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Suspend or activate user access
                    </p>
                  </div>
                </div>
                <Switch
                  id="edit-account-locked"
                  checked={editForm.isAccountLocked}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, isAccountLocked: checked })
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 sm:pt-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
                className="w-full sm:flex-initial border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200 min-h-[44px] text-sm sm:text-base"
              >
                <X className="mr-2 h-4 w-4 shrink-0" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={loading}
                className="w-full sm:flex-initial bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 shrink-0" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Create Admin Dialog */}
        <CreateAdminDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            // Refresh users list
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}
