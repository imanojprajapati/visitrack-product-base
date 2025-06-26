import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { Form, FormField } from '@/types/form';
import { Plus, Edit, Trash2, Eye, Settings, GripVertical, Copy, Calendar, AlertCircle } from 'lucide-react';

const FormBuilder = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  // Form creation/editing state
  const [formData, setFormData] = useState({
    formName: '',
    eventId: '',
  });

  const [fields, setFields] = useState<FormField[]>([]);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [newField, setNewField] = useState<Partial<FormField>>({
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
    defaultValue: ''
  });

  // Default fields that every form should have
  const defaultFields: FormField[] = [
    {
      id: 'fullName',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      required: true,
      isDefault: true
    },
    {
      id: 'phoneNumber',
      type: 'tel',
      label: 'Phone Number',
      placeholder: 'Enter your phone number',
      required: true,
      isDefault: true
    },
    {
      id: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'Enter your email address',
      required: true,
      isDefault: true
    },
    {
      id: 'company',
      type: 'text',
      label: 'Company',
      placeholder: 'Enter your company name',
      required: false,
      isDefault: true
    },
    {
      id: 'city',
      type: 'text',
      label: 'City',
      placeholder: 'Enter your city',
      required: false,
      isDefault: true
    },
    {
      id: 'state',
      type: 'text',
      label: 'State',
      placeholder: 'Enter your state',
      required: false,
      isDefault: true
    },
    {
      id: 'country',
      type: 'text',
      label: 'Country',
      placeholder: 'Enter your country',
      required: false,
      isDefault: true
    },
    {
      id: 'pincode',
      type: 'text',
      label: 'Pincode',
      placeholder: 'Enter your pincode',
      required: false,
      isDefault: true
    },
    {
      id: 'source',
      type: 'text',
      label: 'Source',
      placeholder: 'Enter source',
      required: true,
      defaultValue: 'Website',
      isDefault: true
    }
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchForms();
      fetchEvents();
    }
  }, [user?.id, isAuthenticated]);

  // Fetch events for the dropdown
  const fetchEvents = async () => {
    if (!user?.id) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Fetch forms
  const fetchForms = async () => {
    if (!user?.id) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/forms', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch forms');
      }

      const formsData = await response.json();
      setForms(formsData);
      console.log(`Fetched ${formsData.length} forms`);
    } catch (error: any) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load forms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize form with default fields
  const initializeForm = () => {
    setFormData({ formName: '', eventId: '' });
    setFields([...defaultFields]);
    setSelectedForm(null);
  };

  // Get available events for form creation (exclude events that already have forms)
  const getAvailableEvents = () => {
    const eventsWithForms = new Set(forms.map(form => form.eventId));
    return events.filter(event => !eventsWithForms.has(event._id));
  };

  // Get available events for form editing (exclude events that already have forms, except current form's event)
  const getAvailableEventsForEdit = () => {
    const eventsWithForms = new Set(
      forms
        .filter(form => form._id !== selectedForm?._id) // Exclude current form
        .map(form => form.eventId)
    );
    return events.filter(event => !eventsWithForms.has(event._id));
  };

  // Handle create form
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.formName.trim()) {
      toast({
        title: "Validation Error",
        description: "Form name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.eventId) {
      toast({
        title: "Validation Error",
        description: "Please select an event.",
        variant: "destructive"
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one field is required.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          formName: formData.formName.trim(),
          eventId: formData.eventId,
          fields,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create form');
      }

      toast({
        title: "Success!",
        description: "Form created successfully.",
      });

      setCreateModalOpen(false);
      initializeForm();
      fetchForms();
    } catch (error: any) {
      console.error('Error creating form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle edit form
  const handleEditForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedForm || !formData.formName.trim()) {
      return;
    }

    if (!formData.eventId) {
      toast({
        title: "Validation Error",
        description: "Please select an event.",
        variant: "destructive"
      });
      return;
    }

    setEditing(true);

    try {
      const response = await fetch('/api/forms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          formId: selectedForm._id,
          formName: formData.formName.trim(),
          eventId: formData.eventId,
          fields,
          isActive: selectedForm.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update form');
      }

      toast({
        title: "Success!",
        description: "Form updated successfully.",
      });

      setEditModalOpen(false);
      initializeForm();
      fetchForms();
    } catch (error: any) {
      console.error('Error updating form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEditing(false);
    }
  };

  // Handle delete form
  const handleDeleteClick = (formId: string) => {
    setFormToDelete(formId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteForm = async () => {
    if (!formToDelete) return;

    try {
      const response = await fetch(`/api/forms?id=${formToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete form');
      }

      toast({
        title: "Success!",
        description: "Form deleted successfully.",
      });

      fetchForms();
    } catch (error: any) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFormToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  // Handle edit form modal
  const handleEditClick = (form: Form) => {
    setSelectedForm(form);
    setFormData({
      formName: form.formName,
      eventId: form.eventId || '',
    });
    setFields([...form.fields]);
    setEditModalOpen(true);
  };

  // Handle view form modal
  const handleViewClick = (form: Form) => {
    setSelectedForm(form);
    setViewModalOpen(true);
  };

  // Field management functions
  const handleAddField = () => {
    setEditingField(null);
    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: []
    });
    setFieldModalOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setNewField({
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || '',
      required: field.required,
      options: field.options || [],
      defaultValue: field.defaultValue || ''
    });
    setFieldModalOpen(true);
  };

  const handleSaveField = () => {
    if (!newField.label?.trim()) {
      toast({
        title: "Validation Error",
        description: "Field label is required.",
        variant: "destructive"
      });
      return;
    }

    const fieldData: FormField = {
      id: editingField?.id || `field_${Date.now()}`,
      type: newField.type as FormField['type'],
      label: newField.label.trim(),
      placeholder: newField.placeholder?.trim() || '',
      required: newField.required || false,
      options: newField.options || [],
      defaultValue: newField.defaultValue || '',
      isDefault: editingField?.isDefault || false
    };

    if (editingField) {
      // Update existing field
      setFields(fields.map(f => f.id === editingField.id ? fieldData : f));
    } else {
      // Add new field
      setFields([...fields, fieldData]);
    }

    setFieldModalOpen(false);
    setEditingField(null);
    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
      defaultValue: ''
    });
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleFieldTypeChange = (type: string) => {
    setNewField({
      ...newField,
      type: type as FormField['type'],
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : []
    });
  };

  const handleAddOption = () => {
    setNewField({
      ...newField,
      options: [...(newField.options || []), `Option ${(newField.options?.length || 0) + 1}`]
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const updatedOptions = [...(newField.options || [])];
    updatedOptions[index] = value;
    setNewField({
      ...newField,
      options: updatedOptions
    });
  };

  const handleRemoveOption = (index: number) => {
    setNewField({
      ...newField,
      options: newField.options?.filter((_, i) => i !== index) || []
    });
  };

  // Reset modals
  const handleCreateModalOpen = (open: boolean) => {
    if (open) {
      initializeForm();
    }
    setCreateModalOpen(open);
  };

  const handleEditModalOpen = (open: boolean) => {
    if (!open) {
      initializeForm();
    }
    setEditModalOpen(open);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Checking authentication...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Redirecting to login...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading forms...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Form Builder - Visitrack Admin</title>
          <meta name="description" content="Create and manage custom forms" />
        </Head>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
                <p className="mt-2 text-gray-600">Create and manage custom forms for your events</p>
              </div>
              
              <Button 
                onClick={() => handleCreateModalOpen(true)} 
                className="flex items-center gap-2"
                disabled={getAvailableEvents().length === 0}
                title={getAvailableEvents().length === 0 ? "No events available for new forms" : "Create a new form"}
              >
                <Plus className="w-5 h-5" />
                Create Form
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{forms.length}</div>
                <p className="text-xs text-muted-foreground">Created forms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-xs text-muted-foreground">Available events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining Events</CardTitle>
                <AlertCircle className={`h-4 w-4 ${getAvailableEvents().length === 0 ? 'text-red-500' : 'text-green-500'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getAvailableEvents().length === 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {getAvailableEvents().length}
                </div>
                <p className="text-xs text-muted-foreground">Events without forms</p>
              </CardContent>
            </Card>
          </div>

          {/* Forms Grid */}
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms</h3>
              <p className="mt-1 text-sm text-gray-500">
                {getAvailableEvents().length === 0 
                  ? "All your events already have forms. Each event can have only one form."
                  : "Get started by creating your first form."
                }
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => handleCreateModalOpen(true)}
                  disabled={getAvailableEvents().length === 0}
                  title={getAvailableEvents().length === 0 ? "No events available for new forms" : "Create your first form"}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Form
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <Card key={form._id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg truncate">{form.formName}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {form.eventName || 'No event selected'}
                        </CardDescription>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        form.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Fields:</span>
                        <span className="font-medium">{form.fields.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Submissions:</span>
                        <span className="font-medium">{form.submissionCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">{new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created by:</span>
                        <span className="font-medium">{form.createdBy.username}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClick(form)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(form)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(form._id!)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Form Modal */}
          <Dialog open={createModalOpen} onOpenChange={handleCreateModalOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Form</DialogTitle>
                <DialogDescription>
                  Build a custom form with default fields and additional custom fields.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateForm} className="space-y-6">
                {/* Form Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="formName">Form Name *</Label>
                    <Input
                      id="formName"
                      value={formData.formName}
                      onChange={(e) => setFormData({ ...formData, formName: e.target.value })}
                      placeholder="Enter form name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventSelect">Select Event *</Label>
                    <Select value={formData.eventId} onValueChange={(value) => setFormData({ ...formData, eventId: value })}>
                      <SelectTrigger id="eventSelect">
                        <SelectValue placeholder="Choose an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableEvents().length === 0 ? (
                          <div className="px-2 py-1 text-sm text-gray-500">
                            No events available. All events already have forms.
                          </div>
                        ) : (
                          getAvailableEvents().map((event) => (
                          <SelectItem key={event._id} value={event._id}>
                            {event.eventName}
                          </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {getAvailableEvents().length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        All events already have forms. Each event can have only one form.
                      </p>
                    )}
                  </div>
                </div>

                {/* Fields Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Form Fields</Label>
                    <Button type="button" onClick={handleAddField} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{field.label}</div>
                            <div className="text-xs text-gray-500">
                              {field.type} {field.required && '(Required)'} {field.isDefault && '(Default)'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditField(field)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteField(field.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={creating || getAvailableEvents().length === 0} 
                    className="flex-1"
                  >
                    {creating ? 'Creating...' : 'Create Form'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Form Modal */}
          <Dialog open={editModalOpen} onOpenChange={handleEditModalOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Form</DialogTitle>
                <DialogDescription>
                  Update form details and manage fields.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleEditForm} className="space-y-6">
                {/* Form Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFormName">Form Name *</Label>
                    <Input
                      id="editFormName"
                      value={formData.formName}
                      onChange={(e) => setFormData({ ...formData, formName: e.target.value })}
                      placeholder="Enter form name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEventSelect">Select Event *</Label>
                    <Select value={formData.eventId} onValueChange={(value) => setFormData({ ...formData, eventId: value })}>
                      <SelectTrigger id="editEventSelect">
                        <SelectValue placeholder="Choose an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableEventsForEdit().length === 0 ? (
                          <div className="px-2 py-1 text-sm text-gray-500">
                            No other events available. All events already have forms.
                          </div>
                        ) : (
                          getAvailableEventsForEdit().map((event) => (
                          <SelectItem key={event._id} value={event._id}>
                            {event.eventName}
                          </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {getAvailableEventsForEdit().length === 0 && formData.eventId && (
                      <p className="text-sm text-blue-600 mt-1">
                        This form is linked to its current event. Other events already have forms.
                      </p>
                    )}
                  </div>
                </div>

                {/* Fields Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">Form Fields</Label>
                    <Button type="button" onClick={handleAddField} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{field.label}</div>
                            <div className="text-xs text-gray-500">
                              {field.type} {field.required && '(Required)'} {field.isDefault && '(Default)'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditField(field)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteField(field.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={editing} className="flex-1">
                    {editing ? 'Updating...' : 'Update Form'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Form Modal */}
          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Form Details</DialogTitle>
              </DialogHeader>
              
              {selectedForm && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedForm.formName}</h3>
                    <p className="text-gray-600">{selectedForm.eventName || 'No event selected'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedForm.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedForm.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Fields:</span>
                      <span className="ml-2">{selectedForm.fields.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">Submissions:</span>
                      <span className="ml-2">{selectedForm.submissionCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-2">{new Date(selectedForm.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Form Fields:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedForm.fields.map((field) => (
                        <div key={field.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{field.label}</span>
                          <div className="text-sm text-gray-500">
                            {field.type} {field.required && '(Required)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Field Modal */}
          <Dialog open={fieldModalOpen} onOpenChange={setFieldModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fieldType">Field Type</Label>
                  <Select value={newField.type} onValueChange={handleFieldTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Phone</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fieldLabel">Label *</Label>
                  <Input
                    id="fieldLabel"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="Enter field label"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                  <Input
                    id="fieldPlaceholder"
                    value={newField.placeholder}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="Enter placeholder text"
                  />
                </div>

                <div>
                  <Label htmlFor="fieldDefaultValue">Default Value</Label>
                  <Input
                    id="fieldDefaultValue"
                    value={newField.defaultValue || ''}
                    onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value })}
                    placeholder="Enter default value (optional)"
                  />
                </div>

                {(newField.type === 'select' || newField.type === 'radio' || newField.type === 'checkbox') && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Options</Label>
                      <Button type="button" onClick={handleAddOption} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {newField.options?.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => handleUpdateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="fieldRequired"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="fieldRequired">Required field</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" onClick={handleSaveField} className="flex-1">
                    {editingField ? 'Update Field' : 'Add Field'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setFieldModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title="Delete Form"
            description="Are you sure you want to delete this form? This action cannot be undone and will permanently remove all form data and submissions."
            confirmText="Delete Form"
            cancelText="Cancel"
            onConfirm={handleDeleteForm}
            variant="destructive"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default FormBuilder; 