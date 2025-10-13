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

// Type definitions
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
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
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState<Stats>(initialStats);
  const { toast } = useToast();

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
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

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, filterRole, filterStatus, users]);

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
      role: user.role,
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

      // Update basic fields (name, email, role)
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
              role: editForm.role,
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "INSTRUCTOR":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "USER":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Users Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage and monitor all platform users
          </p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.total}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total registered users
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.active}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% of total users`
                : "Calculating..."}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Instructors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.instructors}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Including admins
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              New Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.newToday}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              New registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                All Users
              </CardTitle>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-[250px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full md:w-[150px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructors</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[150px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
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
        <CardContent>
          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400">No users found</p>
              </div>
            ) : (
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
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-slate-200 dark:border-slate-700"
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
                          <Badge className={getRoleColor(user.role)}>
                            {user.role === "USER"
                              ? "Student"
                              : user.role.charAt(0) +
                                user.role.slice(1).toLowerCase()}
                          </Badge>
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
                              className="hover:bg-slate-100 dark:hover:bg-slate-700"
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Results count */}
          {filteredUsers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  User Details
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  View complete information about this user
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedUser && (
            <div className="max-h-[60vh] overflow-y-auto space-y-6 py-6 px-1 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
              {/* User Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 flex items-center justify-center overflow-hidden relative shadow-md">
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
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedUser.name || "No name"}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {selectedUser.email || "No email"}
                  </p>
                </div>
              </div>

              {/* Information Section Header */}
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Account Information
                </h3>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Role
                  </Label>
                  <div className="mt-2">
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role === "USER"
                        ? "Student"
                        : selectedUser.role.charAt(0) +
                          selectedUser.role.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>

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
          <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200"
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              className="border-slate-300 dark:border-slate-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 dark:from-purple-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Edit User Profile
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Update user information and permissions
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-6">
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
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 h-11"
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
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 h-11"
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-role"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  User Role
                </Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 h-11">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="USER" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                        Student
                      </div>
                    </SelectItem>
                    <SelectItem value="INSTRUCTOR" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                        Instructor
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
          <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
                className="flex-1 sm:flex-initial border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
