"use client";

import { useState, useEffect } from "react";
// UserRole removed - users no longer have roles, use isTeacher flag instead
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  isTeacher: boolean;
  createdAt: string;
  emailVerified: Date | null;
}

const userTypeConfig = {
  teacher: {
    label: "Teacher",
    color: "bg-purple-100 text-purple-800",
    icon: GraduationCap
  },
  user: {
    label: "User",
    color: "bg-blue-100 text-blue-800",
    icon: Users
  }
};

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserType, setNewUserType] = useState<"teacher" | "user" | "">("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error: any) {
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = async (userId: string, isTeacher: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isTeacher }),
      });

      if (response.ok) {
        toast.success("User type updated successfully");
        fetchUsers();
        setEditingUser(null);
        setNewUserType("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update user type");
      }
    } catch (error: any) {
      toast.error("Error updating user type");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error: any) {
      toast.error("Error deleting user");
    }
  };

  const getUserTypeStats = () => {
    const stats = {
      teacher: 0,
      user: 0,
    };

    users.forEach(user => {
      if (user.isTeacher) {
        stats.teacher++;
      } else {
        stats.user++;
      }
    });

    return stats;
  };

  const stats = getUserTypeStats();

  if (loading) {
    return <div className="flex justify-center p-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* User Type Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(userTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {config.label}s
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats[type as keyof typeof stats] || 0}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const userType = user.isTeacher ? "teacher" : "user";
                const userInfo = userTypeConfig[userType];
                const Icon = userInfo.icon;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || "N/A"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={userInfo.color}>
                        <Icon className="w-3 h-3 mr-1" />
                        {userInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.emailVerified ? "default" : "secondary"}>
                        {user.emailVerified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user);
                                setNewUserType(user.isTeacher ? "teacher" : "user");
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User Type</DialogTitle>
                              <DialogDescription>
                                Change the user type for {user.name || user.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select
                                value={newUserType}
                                onValueChange={(value: "teacher" | "user") => setNewUserType(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(userTypeConfig).map(([type, config]) => (
                                    <SelectItem key={type} value={type}>
                                      <div className="flex items-center">
                                        <config.icon className="w-4 h-4 mr-2" />
                                        {config.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => {
                                  if (newUserType && editingUser) {
                                    handleUserTypeChange(editingUser.id, newUserType === "teacher");
                                  }
                                }}
                                disabled={!newUserType || (newUserType === "teacher") === user.isTeacher}
                              >
                                Update Type
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}