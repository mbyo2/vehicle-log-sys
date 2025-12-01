import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useNotificationTemplates, type NotificationTemplate } from '@/hooks/useNotificationTemplates';
import { useAuth } from '@/contexts/AuthContext';
import type { NotificationType, NotificationDelivery } from '@/hooks/useNotifications';

export function NotificationTemplateManager() {
  const { profile } = useAuth();
  const companyId = profile?.company_id?.get() || undefined;
  const userId = profile?.id?.get() || undefined;
  const { templates, createTemplate, updateTemplate, deleteTemplate, isLoading } = useNotificationTemplates(companyId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState({
    template_name: '',
    notification_type: 'maintenance' as NotificationType,
    delivery_method: 'email' as NotificationDelivery,
    subject_template: '',
    body_template: '',
    html_template: '',
    variables: [] as string[],
  });

  const handleSubmit = () => {
    if (editingTemplate) {
      updateTemplate.mutate({
        id: editingTemplate.id,
        ...formData,
      });
      setEditingTemplate(null);
    } else {
      createTemplate.mutate({
        ...formData,
        company_id: companyId,
        is_default: false,
        is_active: true,
        created_by: userId,
      });
    }
    setIsCreateOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      template_name: '',
      notification_type: 'maintenance',
      delivery_method: 'email',
      subject_template: '',
      body_template: '',
      html_template: '',
      variables: [],
    });
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      notification_type: template.notification_type,
      delivery_method: template.delivery_method,
      subject_template: template.subject_template || '',
      body_template: template.body_template,
      html_template: template.html_template || '',
      variables: template.variables || [],
    });
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Notification Templates</h2>
          <p className="text-muted-foreground">Customize notification messages for different events</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g., Custom Maintenance Email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Notification Type</Label>
                  <Select
                    value={formData.notification_type}
                    onValueChange={(value) => setFormData({ ...formData, notification_type: value as NotificationType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="vehicle_issue">Vehicle Issue</SelectItem>
                      <SelectItem value="document_expiry">Document Expiry</SelectItem>
                      <SelectItem value="user_action">User Action</SelectItem>
                      <SelectItem value="approval_required">Approval Required</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Delivery Method</Label>
                  <Select
                    value={formData.delivery_method}
                    onValueChange={(value) => setFormData({ ...formData, delivery_method: value as NotificationDelivery })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="in_app">In-App</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.delivery_method === 'email' && (
                <div>
                  <Label>Subject Template</Label>
                  <Input
                    value={formData.subject_template}
                    onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                    placeholder="e.g., Maintenance Alert: {{vehicle}}"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Use {`{{variableName}}`} for dynamic values
                  </p>
                </div>
              )}

              <div>
                <Label>Body Template</Label>
                <Textarea
                  value={formData.body_template}
                  onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                  placeholder="Enter your message template here..."
                  rows={4}
                />
              </div>

              {formData.delivery_method === 'email' && (
                <div>
                  <Label>HTML Template (optional)</Label>
                  <Textarea
                    value={formData.html_template}
                    onChange={(e) => setFormData({ ...formData, html_template: e.target.value })}
                    placeholder="Enter HTML template for rich email formatting..."
                    rows={6}
                  />
                </div>
              )}

              <div>
                <Label>Available Variables</Label>
                <Input
                  value={formData.variables.join(', ')}
                  onChange={(e) => setFormData({ ...formData, variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })}
                  placeholder="e.g., userName, vehicle, date"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Comma-separated list of variable names
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setEditingTemplate(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{template.template_name}</h3>
                  {template.is_default && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                  <Badge variant="outline">{template.notification_type}</Badge>
                  <Badge variant="outline">{template.delivery_method}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.body_template}
                </p>
                {template.variables && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(template)}
                  disabled={template.is_default}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTemplate.mutate(template.id)}
                  disabled={template.is_default}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}