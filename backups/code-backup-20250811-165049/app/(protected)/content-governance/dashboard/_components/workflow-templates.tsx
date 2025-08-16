"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Settings, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  contentType: string;
  category?: string;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  stages: Stage[];
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Stage {
  id?: string;
  name: string;
  description?: string;
  order: number;
  isRequired: boolean;
  isParallel: boolean;
  requiredRoles: string[];
  minApprovals: number;
  timeLimit?: number;
  escalationAfter?: number;
  autoApprove?: string;
}

export function WorkflowTemplates() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/content-governance/workflows');
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data.templates);
      } else {
        toast.error(data.error || 'Failed to fetch templates');
      }
    } catch (error) {
      toast.error('Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: any) => {
    try {
      const response = await fetch('/api/content-governance/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Template created successfully');
        setTemplates([data.template, ...templates]);
        setIsCreateDialogOpen(false);
      } else {
        toast.error(data.error || 'Failed to create template');
      }
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workflow Templates</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Workflow Template</DialogTitle>
            </DialogHeader>
            <CreateTemplateForm onSubmit={handleCreateTemplate} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {/* Handle delete */}}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline">{template.contentType}</Badge>
                  {template.category && (
                    <Badge variant="secondary">{template.category}</Badge>
                  )}
                  {template.isDefault && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span>{template.stages.length} stages</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Used {template.usageCount} times</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-500">
                    Stages: {template.stages.map(s => s.name).join(' → ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              No workflow templates found. Create your first template to get started.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CreateTemplateForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contentType: '',
    category: '',
    isDefault: false,
    stages: [{
      name: '',
      description: '',
      order: 0,
      isRequired: true,
      isParallel: false,
      requiredRoles: ['TEACHER'],
      minApprovals: 1,
      timeLimit: 24,
      escalationAfter: 48,
      autoApprove: 'NONE'
    }]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [...formData.stages, {
        name: '',
        description: '',
        order: formData.stages.length,
        isRequired: true,
        isParallel: false,
        requiredRoles: ['TEACHER'],
        minApprovals: 1,
        timeLimit: 24,
        escalationAfter: 48,
        autoApprove: 'NONE'
      }]
    });
  };

  const removeStage = (index: number) => {
    setFormData({
      ...formData,
      stages: formData.stages.filter((_, i) => i !== index)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="contentType">Content Type</Label>
          <Select 
            value={formData.contentType} 
            onValueChange={(value) => setFormData({...formData, contentType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="chapter">Chapter</SelectItem>
              <SelectItem value="section">Section</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="article">Article</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData({...formData, isDefault: checked})}
        />
        <Label htmlFor="isDefault">Set as default template</Label>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Approval Stages</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStage}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
        </div>
        
        {formData.stages.map((stage, index) => (
          <div key={index} className="border rounded p-3 mb-3">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">Stage {index + 1}</h4>
              {formData.stages.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeStage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Stage Name</Label>
                <Input
                  value={stage.name}
                  onChange={(e) => {
                    const newStages = [...formData.stages];
                    newStages[index] = {...stage, name: e.target.value};
                    setFormData({...formData, stages: newStages});
                  }}
                  required
                />
              </div>
              <div>
                <Label>Required Approvals</Label>
                <Input
                  type="number"
                  value={stage.minApprovals}
                  onChange={(e) => {
                    const newStages = [...formData.stages];
                    newStages[index] = {...stage, minApprovals: parseInt(e.target.value)};
                    setFormData({...formData, stages: newStages});
                  }}
                  min="1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Create Template</Button>
      </div>
    </form>
  );
}