import React, { useState, useEffect, useCallback } from 'react';
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
import { useDebounceSearch } from '@/hooks/use-debounced-search';

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
  Clock,
  Info,
  Copy,
  ChevronDown,
  ChevronUp
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

  // Debounced search for visitors
  const visitorSearch = useDebounceSearch({
    delay: 1500,
    onSearch: useCallback((searchTerm: string) => {
      // Client-side filtering for visitors
    }, [])
  });

  // Debounced search for templates
  const templateSearch = useDebounceSearch({
    delay: 1500,
    onSearch: useCallback((searchTerm: string) => {
      // Client-side filtering for templates
    }, [])
  });

  // Template Variables Helper State
  const [showVariablesHelper, setShowVariablesHelper] = useState(false);
  const [activeTextarea, setActiveTextarea] = useState<'subject' | 'message' | 'templateSubject' | 'templateMessage' | null>(null);
  
  // Available template variables
  const templateVariables = [
    {
      category: 'Visitor Information',
      variables: [
        { name: '{visitorName}', description: 'Full name of the visitor', example: 'John Doe' },
        { name: '{visitorEmail}', description: 'Email address of the visitor', example: 'john@example.com' },
        { name: '{visitorPhone}', description: 'Phone number of the visitor', example: '+1234567890' },
        { name: '{visitorCompany}', description: 'Company name of the visitor', example: 'Tech Corp' },
        { name: '{visitorStatus}', description: 'Registration status', example: 'Registered / Visited' }
      ]
    },
    {
      category: 'Event Information',
      variables: [
        { name: '{eventName}', description: 'Name of the event', example: 'Tech Conference 2025' },
        { name: '{eventLocation}', description: 'Event location', example: 'Convention Center' },
        { name: '{eventDate}', description: 'Formatted event date', example: 'Monday, January 15, 2025' },
        { name: '{eventStartDate}', description: 'Event start date', example: '01/15/2025' },
        { name: '{eventEndDate}', description: 'Event end date', example: '01/17/2025' },
        { name: '{eventTime}', description: 'Event start time', example: '09:00 AM' }
      ]
    },
    {
      category: 'Sender Information',
      variables: [
        { name: '{senderName}', description: 'Name of the message sender', example: 'Event Organizer' },
        { name: '{senderEmail}', description: 'Email of the message sender', example: 'organizer@event.com' }
      ]
    },
    {
      category: 'System Information',
      variables: [
        { name: '{currentDate}', description: 'Current date', example: 'Monday, January 15, 2025' },
        { name: '{currentTime}', description: 'Current time', example: '02:30 PM' },
        { name: '{year}', description: 'Current year', example: '2025' }
      ]
    }
  ];

  // Function to insert variable into active textarea
  const insertVariable = (variable: string) => {
    if (!activeTextarea) return;
    
    switch (activeTextarea) {
      case 'subject':
        setEmailSubject(prev => prev + variable);
        break;
      case 'message':
        setEmailMessage(prev => prev + variable);
        break;
      case 'templateSubject':
        setTemplateForm(prev => ({ ...prev, subject: prev.subject + variable }));
        break;
      case 'templateMessage':
        setTemplateForm(prev => ({ ...prev, message: prev.message + variable }));
        break;
    }
  };

  // Copy variable to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${text} copied to clipboard`,
    });
  };

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
      // Fetch ALL visitors for the selected event (no limit for recipient selection)
      const response = await fetch(`/api/visitors?eventId=${selectedEvent}&all=true`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVisitors(data.visitors);
        console.log(`📊 [Messages] Fetched ${data.visitors.length} visitors for event ${selectedEvent} (unlimited)`);
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

  // Filtered data based on search
  const filteredVisitors = visitors.filter(visitor =>
    !visitorSearch.searchTerm ||
    visitor.fullName.toLowerCase().includes(visitorSearch.searchTerm.toLowerCase()) ||
    visitor.email.toLowerCase().includes(visitorSearch.searchTerm.toLowerCase()) ||
    visitor.phoneNumber.includes(visitorSearch.searchTerm) ||
    (visitor.company && visitor.company.toLowerCase().includes(visitorSearch.searchTerm.toLowerCase()))
  );

  // Filtered data based on search
  const filteredTemplates = templates.filter(template =>
    !templateSearch.searchTerm ||
    template.templateName.toLowerCase().includes(templateSearch.searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(templateSearch.searchTerm.toLowerCase()) ||
    template.message.toLowerCase().includes(templateSearch.searchTerm.toLowerCase())
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
                            value={visitorSearch.searchTerm}
                            onChange={(e) => visitorSearch.updateSearchTerm(e.target.value)}
                            className="pl-10 w-full sm:w-64"
                          />
                          {visitorSearch.isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
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
                <>
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
                          placeholder="Enter email subject... (e.g., Hello {visitorName}!)"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          onFocus={() => setActiveTextarea('subject')}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <Textarea
                          placeholder="Enter your message... (e.g., Dear {visitorName}, thank you for registering for {eventName}...)"
                          value={emailMessage}
                          onChange={(e) => setEmailMessage(e.target.value)}
                          onFocus={() => setActiveTextarea('message')}
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

                  {/* Template Variables Helper */}
                  <Card>
                    <CardHeader>
                      <CardTitle 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setShowVariablesHelper(!showVariablesHelper)}
                      >
                        <div className="flex items-center gap-2">
                          <Info className="w-5 h-5 text-blue-600" />
                          Template Variables
                        </div>
                        {showVariablesHelper ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    {showVariablesHelper && (
                      <CardContent>
                        <div className="text-sm text-gray-600 mb-4">
                          Click on any variable below to insert it into your subject or message. Variables will be automatically replaced with actual data for each recipient.
                        </div>
                        <div className="space-y-4">
                          {templateVariables.map((category) => (
                            <div key={category.category}>
                              <h4 className="font-medium text-gray-900 mb-2">{category.category}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {category.variables.map((variable) => (
                                  <div 
                                    key={variable.name}
                                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => insertVariable(variable.name)}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <code className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {variable.name}
                                        </code>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(variable.name);
                                          }}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {variable.description}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        Example: {variable.example}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {activeTextarea && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm text-blue-800">
                              <strong>Active field:</strong> {
                                activeTextarea === 'subject' ? 'Email Subject' :
                                activeTextarea === 'message' ? 'Message' :
                                activeTextarea === 'templateSubject' ? 'Template Subject' :
                                'Template Message'
                              }
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              Click any variable above to insert it into this field.
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </>
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
                        value={templateSearch.searchTerm}
                        onChange={(e) => templateSearch.updateSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                      />
                      {templateSearch.isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
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
                        placeholder="Enter email subject... (e.g., Welcome {visitorName} to {eventName})"
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                        onFocus={() => setActiveTextarea('templateSubject')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <Textarea
                        placeholder="Enter message template... (e.g., Dear {visitorName}, we're excited to see you at {eventName} on {eventDate}...)"
                        value={templateForm.message}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                        onFocus={() => setActiveTextarea('templateMessage')}
                        rows={8}
                        className="w-full resize-none"
                      />
                    </div>
                    
                    {/* Sample Templates */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Start Templates</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTemplateForm(prev => ({
                              ...prev,
                              templateName: 'Welcome Message',
                              subject: 'Welcome to {eventName}, {visitorName}!',
                              message: 'Dear {visitorName},\n\nThank you for registering for {eventName}!\n\nEvent Details:\n📅 Date: {eventDate}\n📍 Location: {eventLocation}\n🕒 Time: {eventTime}\n\nWe look forward to seeing you there!\n\nBest regards,\n{senderName}'
                            }));
                          }}
                          className="text-left justify-start h-auto p-2"
                        >
                          <div>
                            <div className="font-medium text-xs">Welcome Message</div>
                            <div className="text-xs text-gray-500">Basic welcome template</div>
                          </div>
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTemplateForm(prev => ({
                              ...prev,
                              templateName: 'Event Reminder',
                              subject: 'Reminder: {eventName} is tomorrow!',
                              message: 'Hi {visitorName},\n\nJust a friendly reminder that {eventName} is happening tomorrow!\n\n📅 Date: {eventDate}\n📍 Location: {eventLocation}\n🕒 Time: {eventTime}\n\nDon\'t forget to bring your registration confirmation.\n\nSee you soon!\n{senderName}'
                            }));
                          }}
                          className="text-left justify-start h-auto p-2"
                        >
                          <div>
                            <div className="font-medium text-xs">Event Reminder</div>
                            <div className="text-xs text-gray-500">Pre-event reminder</div>
                          </div>
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTemplateForm(prev => ({
                              ...prev,
                              templateName: 'Thank You',
                              subject: 'Thank you for attending {eventName}!',
                              message: 'Dear {visitorName},\n\nThank you for attending {eventName} on {eventDate}!\n\nWe hope you found the event valuable and informative.\n\nIf you have any feedback or questions, please don\'t hesitate to reach out.\n\nBest regards,\n{senderName}\n{senderEmail}'
                            }));
                          }}
                          className="text-left justify-start h-auto p-2"
                        >
                          <div>
                            <div className="font-medium text-xs">Thank You</div>
                            <div className="text-xs text-gray-500">Post-event message</div>
                          </div>
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTemplateForm(prev => ({
                              ...prev,
                              templateName: 'Event Update',
                              subject: 'Important Update: {eventName}',
                              message: 'Hello {visitorName},\n\nWe have an important update regarding {eventName}.\n\n[Your update message here]\n\nEvent Details:\n📅 Date: {eventDate}\n📍 Location: {eventLocation}\n\nIf you have any questions, please contact us.\n\nBest regards,\n{senderName}'
                            }));
                          }}
                          className="text-left justify-start h-auto p-2"
                        >
                          <div>
                            <div className="font-medium text-xs">Event Update</div>
                            <div className="text-xs text-gray-500">General update template</div>
                          </div>
                        </Button>
                      </div>
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
                      {filteredTemplates.map((template) => {
                        const hasVariables = template.subject.includes('{') || template.message.includes('{');
                        const variableCount = (template.subject + ' ' + template.message).match(/\{[^}]+\}/g)?.length || 0;
                        
                        return (
                        <Card key={template._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-gray-900 truncate">{template.templateName}</h3>
                                  {hasVariables && (
                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                      {variableCount} vars
                                    </Badge>
                                  )}
                                </div>
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
                        );
                      })}
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