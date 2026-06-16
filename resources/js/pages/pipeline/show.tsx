import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { 
  ArrowLeft, 
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Building2,
  Percent,
  Shield,
  Pencil,
  Trash2,
  Activity,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { PipelineProject, Inspection, Alert } from '@/types';
import { toast } from 'sonner';

interface PipelineShowProps {
  project: PipelineProject & {
    alerts: Alert[];
    alerts_count: number;
    inspections_count: number;
  };
  inspections: Inspection[];
  alertStats: Record<string, number>;
  progressHistory: Array<{
    date: string;
    progress: number;
    status: string;
  }>;
}

const PipelineShow: React.FC<PipelineShowProps> = ({ 
  project, 
  inspections, 
  alertStats,
  progressHistory 
}) => {

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
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
  
  const handleDelete = () => {
    router.delete(`/pipeline/${project.id}`, {
      onSuccess: () => {
        toast.success("Project deleted successfully");
       
        router.visit('/pipeline');
      },
      onError: () => {
        toast.error("Failed to delete project");
        
      }
    });
  };
  
  const risk = getRiskLevel(project.environmental_impact_score);
  const daysRemaining = project.end_date ? Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isOverBudget = project.actual_cost && project.budget && project.actual_cost > project.budget;
  const budgetVariance = project.budget && project.actual_cost ? project.actual_cost - project.budget : null;
  
  return (
    <AppLayout>
      <Head title={`${project.project_name} | Pipeline Project`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/pipeline')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Heading 
                  title={project.project_name} 
                  description={project.location || 'Location not specified'}
                />
                <Badge className={getStatusBadge(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
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
                {project.contractor && (
                  <Badge variant="outline">
                    <Building2 className="h-3 w-3 mr-1" />
                    {project.contractor}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/pipeline/${project.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    project and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Overall completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress_percentage}%</span>
              </div>
              <Progress value={project.progress_percentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Started: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</span>
                <span>Expected: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</span>
                {daysRemaining !== null && (
                  <span>{daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Completed'}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{project.alerts_count}</div>
              <p className="text-xs text-muted-foreground">
                {alertStats?.critical || 0} critical
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inspections</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.inspections_count}</div>
              <p className="text-xs text-muted-foreground">
                Total inspections conducted
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${project.budget?.toLocaleString() || 'N/A'}
              </div>
              {isOverBudget && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  ${budgetVariance?.toLocaleString()} over budget
                </p>
              )}
              {budgetVariance !== null && !isOverBudget && budgetVariance < 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  ${Math.abs(budgetVariance).toLocaleString()} under budget
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Environmental Impact</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.environmental_impact_score || 'N/A'}
              </div>
              {project.environmental_impact_score && (
                <p className={`text-xs ${risk.label === 'Low' ? 'text-green-600' : risk.label === 'Medium' ? 'text-yellow-600' : risk.label === 'High' ? 'text-orange-600' : 'text-red-600'}`}>
                  Risk Level: {risk.label}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Progress History Chart */}
        {progressHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Progress History</CardTitle>
              <CardDescription>Project completion over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2}
                      name="Progress %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Additional Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Comprehensive project information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project Name</label>
                  <p className="mt-1">{project.project_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="mt-1 capitalize">{project.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="mt-1">{project.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contractor</label>
                  <p className="mt-1">{project.contractor || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="mt-1">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="mt-1">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Budget</label>
                  <p className="mt-1">${project.budget?.toLocaleString() || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actual Cost</label>
                  <p className="mt-1">${project.actual_cost?.toLocaleString() || 'Not recorded'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{project.description || 'No description provided'}</p>
                </div>
                {project.notes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="mt-1 text-sm">{project.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Inspections */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspections</CardTitle>
              <CardDescription>Latest compliance inspections</CardDescription>
            </CardHeader>
            <CardContent>
              {inspections.length > 0 ? (
                <div className="space-y-4">
                  {inspections.slice(0, 5).map((inspection) => (
                    <div key={inspection.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{inspection.location}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inspection.inspection_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {inspection.findings?.substring(0, 100)}
                          {inspection.findings && inspection.findings.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      <Badge variant={
                        inspection.status === 'compliant' ? 'default' :
                        inspection.status === 'non_compliant' ? 'destructive' : 'secondary'
                      }>
                        {inspection.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>No inspections recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

// Preserve layout configuration
(PipelineShow as any).layout = {
  breadcrumbs: [
    {
      title: 'Pipeline Projects',
      href: '/pipeline',
    },
    {
      title: 'Project Details',
      href: '#',
    },
  ],
};

export default PipelineShow;