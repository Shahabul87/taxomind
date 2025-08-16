'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { 
  Building2, Users, BookOpen, TrendingUp, Settings, 
  Shield, AlertTriangle, CheckCircle, Plus, Filter,
  Search, MoreHorizontal, Eye, Edit, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface Organization {
  id: string;
  name: string;
  domain?: string;
  slug: string;
  subscriptionTier: string;
  maxUsers: number;
  maxCourses: number;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  courseCount: number;
  analyticsCount: number;
}

interface OrganizationOverviewProps {
  className?: string;
}

export function OrganizationOverview({ className }: OrganizationOverviewProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(tierFilter !== 'all' && { tier: tierFilter }),
        ...(statusFilter !== 'all' && { active: statusFilter }),
      });

      const response = await fetch(`/api/enterprise/organizations?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrganizations(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error: any) {
      logger.error('Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, tierFilter, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const getSubscriptionTierColor = (tier: string) => {
    switch (tier) {
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'PROFESSIONAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'STARTER': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'FREE': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getUtilizationPercentage = (used: number, max: number) => {
    return Math.round((used / max) * 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Organization Management
            </h2>
            <p className="text-muted-foreground">
              Manage multi-tenant organizations and their resources
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="STARTER">Starter</SelectItem>
              <SelectItem value="PROFESSIONAL">Professional</SelectItem>
              <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchOrganizations}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Organizations</p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Organizations</p>
                  <p className="text-2xl font-bold text-green-600">
                    {organizations.filter(org => org.isActive).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">
                    {organizations.reduce((sum, org) => sum + org.userCount, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">
                    {organizations.reduce((sum, org) => sum + org.courseCount, 0)}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
        <div className="space-y-4">
          {organizations.map((org) => (
            <Card key={org.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                  {/* Organization Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {org.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {org.domain || org.slug}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Tier */}
                  <div className="text-center">
                    <Badge className={getSubscriptionTierColor(org.subscriptionTier)}>
                      {org.subscriptionTier}
                    </Badge>
                  </div>

                  {/* Usage Statistics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Users</span>
                      <span className="font-medium">{org.userCount}/{org.maxUsers}</span>
                    </div>
                    <Progress 
                      value={getUtilizationPercentage(org.userCount, org.maxUsers)} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Courses</span>
                      <span className="font-medium">{org.courseCount}/{org.maxCourses}</span>
                    </div>
                    <Progress 
                      value={getUtilizationPercentage(org.courseCount, org.maxCourses)} 
                      className="h-2"
                    />
                  </div>

                  {/* Status */}
                  <div className="text-center">
                    <Badge 
                      variant={org.isActive ? "default" : "secondary"}
                      className={org.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {org.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} organizations
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}