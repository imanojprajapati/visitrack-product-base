import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { 
  MessageSquare,
  Send,
  Clipboard as Template,
  Mail,
  Users,
  User,
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Check,
  Clock
} from 'lucide-react';

interface Event {
  _id: string;
  eventName: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  ownerId: string;
  visitorCount?: number;
}

interface Visitor {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  company?: string;
  eventId: string;
  eventName: string;
  status: 'Registration' | 'Visited';
}

interface MessageTemplate {
  _id?: string;
  templateName: string;
  subject: string;
  message: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const Messages = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('send-message');
  const [loading, setLoading] = useState(false);

  // Send Message States
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitors, setSelectedVisitors] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Template Message States
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    templateName: '',
    subject: '',
    message: ''
  });

  // Search and Filter States
  const [visitorSearch, setVisitorSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch events on component mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchEvents();
      fetchTemplates();
    }
  }, [isAuthenticated, user?.id]);

  // Fetch visitors when event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchVisitors();
    } else {
      setVisitors([]);
      setSelectedVisitors([]);
      setSelectAll(false);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
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

  const fetchVisitors = async () => {
    if (!selectedEvent) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/visitors?eventId=${selectedEvent}&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVisitors(data.visitors);
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch visitors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      const response = await fetch('/api/message-templates', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const templatesData = await response.json();
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSelectAllVisitors = () => {
    if (selectAll) {
      setSelectedVisitors([]);
    } else {
      setSelectedVisitors(filteredVisitors.map(v => v._id));
    }
    setSelectAll(!selectAll);
  };

  const handleVisitorSelect = (visitorId: string) => {
    if (selectedVisitors.includes(visitorId)) {
      setSelectedVisitors(selectedVisitors.filter(id => id !== visitorId));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedVisitors, visitorId];
      setSelectedVisitors(newSelected);
      setSelectAll(newSelected.length === filteredVisitors.length);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedEvent || selectedVisitors.length === 0 || !emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select event, recipients, subject, and message",
        variant: "destructive"
      });
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      setSendingEmail(true);
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEvent,
          visitorIds: selectedVisitors,
          subject: emailSubject,
          message: emailMessage
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Message sent to ${selectedVisitors.length} recipients`,
        });
        // Reset form
        setEmailSubject('');
        setEmailMessage('');
        setSelectedVisitors([]);
        setSelectAll(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.templateName.trim() || !templateForm.subject.trim() || !templateForm.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all template fields",
        variant: "destructive"
      });
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      const url = editingTemplate ? `/api/message-templates/${editingTemplate._id}` : '/api/message-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
        });
        fetchTemplates();
        setShowTemplateForm(false);
        setEditingTemplate(null);
        setTemplateForm({ templateName: '', subject: '', message: '' });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save template');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      templateName: template.templateName,
      subject: template.subject,
      message: template.message
    });
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/message-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
        fetchTemplates();
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    setEmailSubject(template.subject);
    setEmailMessage(template.message);
    setActiveTab('send-message');
    toast({
      title: "Template Applied",
      description: "Template has been applied to send message form",
    });
  };

  // Filter visitors based on search
  const filteredVisitors = visitors.filter(visitor =>
    visitor.fullName.toLowerCase().includes(visitorSearch.toLowerCase()) ||
    visitor.email.toLowerCase().includes(visitorSearch.toLowerCase()) ||
    (visitor.company && visitor.company.toLowerCase().includes(visitorSearch.toLowerCase()))
  );

  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    template.templateName.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.subject.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              Messages
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Send messages to visitors and manage message templates
            </p>
          </div>
        </div>

        <div className="w-full">
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('send-message')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'send-message'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
            <button
              onClick={() => setActiveTab('template-message')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'template-message'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Template className="w-4 h-4" />
              Template Message
            </button>
          </div>

          {activeTab === 'send-message' && (
            <div className="space-y-6">
              {/* Event Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Select Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.eventName} - {event.eventLocation} ({new Date(event.eventStartDate).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Visitor Selection */}
              {selectedEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Select Recipients ({selectedVisitors.length} selected)
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search visitors..."
                            value={visitorSearch}
                            onChange={(e) => setVisitorSearch(e.target.value)}
                            className="pl-10 w-full sm:w-64"
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleSelectAllVisitors}
                          disabled={filteredVisitors.length === 0}
                          className="whitespace-nowrap"
                        >
                          {selectAll ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredVisitors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {visitors.length === 0 ? 'No visitors found for this event' : 'No visitors match your search'}
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredVisitors.map((visitor) => (
                            <div
                              key={visitor._id}
                              className={`relative p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                selectedVisitors.includes(visitor._id)
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }`}
                              onClick={() => handleVisitorSelect(visitor._id)}
                            >
                              {/* Selection indicator - top right corner */}
                              <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                selectedVisitors.includes(visitor._id)
                                  ? 'border-blue-500 bg-blue-500 shadow-sm'
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {selectedVisitors.includes(visitor._id) && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </div>

                              <div className="pr-8">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="font-medium text-gray-900 truncate">{visitor.fullName}</span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{visitor.email}</span>
                                  </div>
                                  {visitor.company && (
                                    <div className="truncate text-xs">{visitor.company}</div>
                                  )}
                                </div>
                                <Badge 
                                  variant={visitor.status === 'Visited' ? 'default' : 'secondary'}
                                  className={`mt-2 ${
                                    visitor.status === 'Visited' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-orange-100 text-orange-800 border-orange-200'
                                  }`}
                                >
                                  {visitor.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Message Composition */}
              {selectedEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Compose Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                      </label>
                      <Input
                        placeholder="Enter email subject..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <Textarea
                        placeholder="Enter your message..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        rows={8}
                        className="w-full resize-none"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="text-sm text-gray-600">
                        {selectedVisitors.length > 0 && (
                          <span>Ready to send to {selectedVisitors.length} recipient{selectedVisitors.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={sendingEmail || selectedVisitors.length === 0 || !emailSubject.trim() || !emailMessage.trim()}
                        className="flex items-center gap-2 w-full sm:w-auto"
                      >
                        {sendingEmail ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">Send Message</span>
                            <span className="sm:hidden">Send</span>
                            {selectedVisitors.length > 0 && (
                              <span className="hidden sm:inline">({selectedVisitors.length})</span>
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'template-message' && (
            <div className="space-y-6">
              {/* Template Actions */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative flex-1 w-full sm:max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search templates..."
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setShowTemplateForm(true);
                        setEditingTemplate(null);
                        setTemplateForm({ templateName: '', subject: '', message: '' });
                      }}
                      className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      New Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Template Form */}
              {showTemplateForm && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Template className="w-5 h-5 text-blue-600" />
                      {editingTemplate ? 'Edit Template' : 'Create New Template'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name
                      </label>
                      <Input
                        placeholder="Enter template name..."
                        value={templateForm.templateName}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, templateName: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <Input
                        placeholder="Enter email subject..."
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <Textarea
                        placeholder="Enter message template..."
                        value={templateForm.message}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={8}
                        className="w-full resize-none"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowTemplateForm(false);
                          setEditingTemplate(null);
                          setTemplateForm({ templateName: '', subject: '', message: '' });
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveTemplate}
                        className="w-full sm:w-auto"
                      >
                        {editingTemplate ? 'Update Template' : 'Save Template'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Templates List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Template className="w-5 h-5 text-blue-600" />
                    Message Templates ({filteredTemplates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      {templates.length === 0 ? 'No templates created yet' : 'No templates match your search'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTemplates.map((template) => (
                        <Card key={template._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 truncate">{template.templateName}</h3>
                                <p className="text-sm text-gray-600 mt-1 truncate">{template.subject}</p>
                              </div>
                              <div className="text-xs text-gray-500">
                                <p className="line-clamp-3">{template.message.substring(0, 100)}...</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t">
                                <div className="text-xs text-gray-500">
                                  {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUseTemplate(template)}
                                    className="h-8 px-2"
                                    title="Use Template"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditTemplate(template)}
                                    className="h-8 px-2"
                                    title="Edit Template"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteTemplate(template._id!)}
                                    className="h-8 px-2 text-red-600 hover:text-red-700"
                                    title="Delete Template"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Messages; 