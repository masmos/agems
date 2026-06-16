import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { ArrowLeft, Save } from 'lucide-react';
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
import { toast } from 'sonner';


const PipelineCreate: React.FC = () => {

  const { data, setData, post, processing, errors } = useForm({
    project_name: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    location: '',
    latitude: '',
    longitude: '',
    contractor: '',
    budget: '',
    actual_cost: '',
    environmental_impact_score: '',
    compliance_status: 'not_assessed',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    post('/pipeline', {
      onSuccess: () => {
        toast.success("Pipeline project created successfully");
        
        router.visit('/pipeline');
      },
      onError: (errors) => {
        toast.error("Failed to create pipeline project");
      },
    });
  };

  return (
    <>
      <Head title="Create Pipeline Project | AGEMS" />

      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.visit('/pipeline')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Heading
            title="Create Pipeline Project"
            description="Add a new pipeline construction project to monitor."
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g., East African Crude Oil Pipeline - Segment A"
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
                  placeholder="Describe the project scope, objectives, and environmental considerations..."
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
                    onValueChange={(value) => setData('status', value)}
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
                    placeholder="e.g., China Petroleum Pipeline Engineering"
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
                  placeholder="e.g., Buliisa District, Albertine Graben"
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
                    placeholder="e.g., 1.8467"
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
                    placeholder="e.g., 31.4167"
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
                    placeholder="e.g., 1000000"
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
                    placeholder="e.g., 950000"
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
                    placeholder="e.g., 75"
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
                    onValueChange={(value) => setData('compliance_status', value)}
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
                  placeholder="Additional notes about environmental concerns, mitigation measures, etc."
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
              Create Project
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.visit('/pipeline')}
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
(PipelineCreate as any).layout = {
  breadcrumbs: [
    {
      title: 'Pipeline Projects',
      href: '/pipeline',
    },
    {
      title: 'Create',
      href: '#',
    },
  ],
};

export default PipelineCreate;