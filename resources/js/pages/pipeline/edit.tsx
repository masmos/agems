import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
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

import type { PipelineProject } from '@/types';
import { toast } from 'sonner';

interface PipelineEditProps {
  project: PipelineProject;
}

// Define the compliance status type for reuse
type ComplianceStatus = PipelineProject['compliance_status'];

const PipelineEdit: React.FC<PipelineEditProps> = ({ project }) => {
  const { data, setData, put, processing, errors } = useForm({
    project_name: project.project_name,
    description: project.description || '',
    progress_percentage: project.progress_percentage?.toString() || '0',
    status: project.status,
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    location: project.location || '',
    latitude: project.latitude?.toString() || '',
    longitude: project.longitude?.toString() || '',
    contractor: project.contractor || '',
    budget: project.budget?.toString() || '',
    actual_cost: project.actual_cost?.toString() || '',
    environmental_impact_score: project.environmental_impact_score?.toString() || '',
    compliance_status: project.compliance_status, // This is already the correct type
    notes: project.notes || '',
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    put(`/pipeline/${project.id}`, {
      onSuccess: () => {
        toast.success("Pipeline project updated successfully");
        router.visit(`/pipeline/${project.id}`);
      },
      onError: (errors) => {
        toast.error("Failed to update pipeline project");
      },
    });
  };

  const handleDelete = () => {
    router.delete(`/pipeline/${project.id}`, {
      onSuccess: () => {
        toast.success("Project deleted successfully");
        router.visit('/pipeline');
      },
      onError: () => {
        toast.error("Failed to delete project");
      },
    });
  };

  // Helper function to handle compliance status change with proper typing
  const handleComplianceChange = (value: string) => {
    // Type assertion is safe here because the Select only provides valid compliance status values
    setData('compliance_status', value as ComplianceStatus);
  };

  // Helper function for status change (if needed)
  const handleStatusChange = (value: string) => {
    setData('status', value as PipelineProject['status']);
  };

  return (
    <>
      <Head title={`Edit ${project.project_name} | Pipeline Project`} />

      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit(`/pipeline/${project.id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Heading
              title={`Edit: ${project.project_name}`}
              description="Update pipeline project information."
            />
          </div>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Current Progress</CardTitle>
              <CardDescription>Update project completion status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{data.progress_percentage}%</span>
                </div>
                <Progress value={parseFloat(data.progress_percentage)} className="h-3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress_percentage">Progress Percentage</Label>
                <Input
                  id="progress_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g., 75.5"
                  value={data.progress_percentage}
                  onChange={(e) => setData('progress_percentage', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Project details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={data.project_name}
                  onChange={(e) => setData('project_name', e.target.value)}
                  className={errors.project_name ? 'border-red-500' : ''}
                />
                {errors.project_name && (
                  <p className="text-sm text-red-500">{errors.project_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={data.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractor">Contractor</Label>
                  <Input
                    id="contractor"
                    value={data.contractor}
                    onChange={(e) => setData('contractor', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Schedule</CardTitle>
              <CardDescription>Project location and timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={data.location}
                  onChange={(e) => setData('location', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={data.latitude}
                    onChange={(e) => setData('latitude', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={data.longitude}
                    onChange={(e) => setData('longitude', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={data.start_date}
                    onChange={(e) => setData('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={data.end_date}
                    onChange={(e) => setData('end_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Budget and cost tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={data.budget}
                    onChange={(e) => setData('budget', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_cost">Actual Cost ($)</Label>
                  <Input
                    id="actual_cost"
                    type="number"
                    step="0.01"
                    value={data.actual_cost}
                    onChange={(e) => setData('actual_cost', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environmental & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental & Compliance</CardTitle>
              <CardDescription>Environmental impact and regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="environmental_impact_score">
                    Environmental Impact Score (0-100)
                  </Label>
                  <Input
                    id="environmental_impact_score"
                    type="number"
                    min="0"
                    max="100"
                    value={data.environmental_impact_score}
                    onChange={(e) => setData('environmental_impact_score', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    0-29: Low | 30-59: Medium | 60-79: High | 80-100: Critical
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compliance_status">Compliance Status</Label>
                  <Select
                    value={data.compliance_status}
                    onValueChange={handleComplianceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select compliance status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_assessed">Not Assessed</SelectItem>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
                      <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-2">
            <Button type="submit" disabled={processing}>
              <Save className="h-4 w-4 mr-2" />
              Update Project
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.visit(`/pipeline/${project.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

// Preserve layout configuration
(PipelineEdit as any).layout = {
  breadcrumbs: [
    {
      title: 'Pipeline Projects',
      href: '/pipeline',
    },
    {
      title: 'Edit',
      href: '#',
    },
  ],
};

export default PipelineEdit;