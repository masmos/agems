import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  Percent,
  Shield,
  Eye,
  Pencil,
  MapPinPlusInsideIcon,
  Droplet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PipelineProject } from '@/types';

interface PipelineIndexProps {
  projects: {
    data: (PipelineProject & { alerts_count: number; inspections_count: number })[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
  };
  stats: {
    total: number;
    active: number;
    completed: number;
    high_risk: number;
    non_compliant: number;
    average_progress: number;
  };
  statusCounts: Record<string, number>;
  filters: {
    search: string;
    status: string;
    compliance: string;
  };
}

const PipelineIndex: React.FC<PipelineIndexProps> = ({ 
  projects, 
  stats, 
  statusCounts,
  filters 
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [complianceFilter, setComplianceFilter] = useState(filters.compliance || 'all');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.visit('/pipeline?search=' + encodeURIComponent(searchTerm) + 
      '&status=' + (statusFilter !== 'all' ? statusFilter : '') +
      '&compliance=' + (complianceFilter !== 'all' ? complianceFilter : ''));
  };
  
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      in_progress: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getComplianceBadge = (status: string) => {
    const colors: Record<string, string> = {
      compliant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      partially_compliant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      non_compliant: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      not_assessed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getRiskLevel = (score: number | null) => {
    if (!score) return { label: 'Not Assessed', color: 'bg-gray-100 text-gray-800' };
    if (score < 30) return { label: 'Low', color: 'bg-green-100 text-green-800' };
    if (score < 60) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    if (score < 80) return { label: 'High', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Critical', color: 'bg-red-100 text-red-800' };
  };
  
  return (
    <>
      <Head title="Pipeline Projects | AGEMS" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Heading 
            title="Pipeline Projects" 
            description="Manage oil and gas pipeline construction projects and monitor environmental impact." 
          />
          <Button asChild>
            <Link href="/pipeline/create">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Droplet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} active projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.average_progress)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed} projects completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.high_risk}</div>
              <p className="text-xs text-muted-foreground">
                Projects with high environmental impact
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.non_compliant}</div>
              <p className="text-xs text-muted-foreground">
                Requiring corrective action
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects by name, location, or contractor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={complianceFilter} onValueChange={setComplianceFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Compliance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Compliance</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
              <SelectItem value="non_compliant">Non-Compliant</SelectItem>
              <SelectItem value="not_assessed">Not Assessed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((project) => {
            const risk = getRiskLevel(project.environmental_impact_score);
            const daysRemaining = project.end_date ? Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg hover:text-primary transition-colors">
                        <Link href={`/pipeline/${project.id}`}>
                          {project.project_name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {project.location || 'Location not specified'}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusBadge(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress_percentage}%</span>
                      </div>
                      <Progress value={project.progress_percentage} className="h-2" />
                    </div>
                    
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {project.contractor && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{project.contractor}</span>
                        </div>
                      )}
                      {project.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {new Date(project.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {daysRemaining !== null && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Completed'}
                          </span>
                        </div>
                      )}
                      {project.budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            ${project.budget.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Badge variant="outline" className={getComplianceBadge(project.compliance_status)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {project.compliance_status?.replace('_', ' ')}
                      </Badge>
                      
                      {project.environmental_impact_score && (
                        <Badge variant="outline" className={risk.color}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Risk: {risk.label}
                        </Badge>
                      )}
                      
                      {project.alerts_count > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {project.alerts_count} Alerts
                        </Badge>
                      )}
                      
                      {project.inspections_count > 0 && (
                        <Badge variant="outline">
                          {project.inspections_count} Inspections
                        </Badge>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/pipeline/${project.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/pipeline/${project.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* No Results */}
        {projects.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Droplet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pipeline projects found</p>
            <Button asChild className="mt-4">
              <Link href="/pipeline/create">
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Link>
            </Button>
          </div>
        )}
        
        {/* Pagination */}
        {/* {projects.total > projects.per_page && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {projects.from} to {projects.to} of {projects.total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(projects.prev_page_url)}
                disabled={!projects.prev_page_url}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(projects.next_page_url)}
                disabled={!projects.next_page_url}
              >
                Next
              </Button>
            </div>
          </div>
        )} */}
      </div>
    </>
  );
};

// Preserve layout configuration
(PipelineIndex as any).layout = {
  breadcrumbs: [
    {
      title: 'Pipeline Projects',
      href: '/pipeline',
    },
  ],
};

export default PipelineIndex;