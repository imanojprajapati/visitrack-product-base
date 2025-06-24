import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ConfirmationDialog } from '../../components/ui/confirmation-dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { DatePicker } from '../../components/ui/date-picker';
import { TimePicker } from '../../components/ui/time-picker';
import { useToast } from '../../hooks/use-toast';
import { Event } from '../../types/event';
import { Edit, Trash2, Eye, Calendar, MapPin, Users, Clock } from 'lucide-react';

export default function EventManagement() {
  const { token, ownerId } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    eventName: '',
    status: 'draft' as 'upcoming' | 'draft' | 'cancel',
    eventStartDate: '',
    eventEndDate: '',
    eventStartTime: '',
    eventEndTime: '',
    eventLocation: '',
    registrationDeadline: '',
    eventInformation: '',
  });

  useEffect(() => {
    console.log('🔄 [Events Frontend] Auth state changed:', { 
      hasToken: !!token, 
      ownerId,
      tokenLength: token?.length || 0 
    });
    
    if (token && ownerId) {
      fetchEvents();
    } else {
      console.warn('⚠️ [Events Frontend] Missing required auth data:', { 
        hasToken: !!token, 
        hasOwnerId: !!ownerId 
      });
    }
  }, [token, ownerId]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Remove the redundant frontend filtering since API already filters by ownerId
        setEvents(data);
        console.log(`✅ [Events Frontend] Loaded ${data.length} events for current user`);
      } else {
        const errorData = await response.json();
        console.error('❌ [Events Frontend] Failed to fetch events:', errorData);
        toast({
          title: "Error",
          description: errorData.message || "Failed to fetch events",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [Events Frontend] Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleDateTimeChange = useCallback((event: { target: { name: string; value: string } }) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = selectedEvent !== null;
    
    // Debug logging for date validation
    console.log('Form submission data:', {
      eventStartDate: formData.eventStartDate,
      eventEndDate: formData.eventEndDate,
      isSameDay: formData.eventStartDate === formData.eventEndDate
    });
    
    if (isEdit) {
      setIsEditing(true);
    } else {
      setIsCreating(true);
    }

    try {
      let eventBanner = '';
      
      // Upload banner if provided
      if (bannerFile) {
        eventBanner = await uploadImage(bannerFile);
      } else if (selectedEvent && selectedEvent.eventBanner) {
        eventBanner = selectedEvent.eventBanner;
      }

      const url = '/api/events';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit 
        ? { eventId: selectedEvent!._id, ...formData, visitorCount: selectedEvent?.visitorCount || 0, eventBanner }
        : { ...formData, visitorCount: 0, eventBanner };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: isEdit ? "Event updated successfully" : "Event created successfully",
        });
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        resetForm();
        fetchEvents();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || (isEdit ? "Failed to update event" : "Failed to create event"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} event:`, error);
      toast({
        title: "Error",
        description: isEdit ? "Failed to update event" : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      if (isEdit) {
        setIsEditing(false);
      } else {
        setIsCreating(false);
      }
    }
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      eventName: event.eventName,
      status: event.status,
      eventStartDate: event.eventStartDate,
      eventEndDate: event.eventEndDate,
      eventStartTime: event.eventStartTime,
      eventEndTime: event.eventEndTime,
      eventLocation: event.eventLocation,
      registrationDeadline: event.registrationDeadline,
      eventInformation: event.eventInformation,
    });
    setBannerPreview(event.eventBanner || '');
    setIsEditModalOpen(true);
  };

  const handleView = (event: Event) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${eventToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
        fetchEvents();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const resetForm = () => {
    setFormData({
      eventName: '',
      status: 'draft',
      eventStartDate: '',
      eventEndDate: '',
      eventStartTime: '',
      eventEndTime: '',
      eventLocation: '',
      registrationDeadline: '',
      eventInformation: '',
    });
    setBannerFile(null);
    setBannerPreview('');
    setSelectedEvent(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancel':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const renderEventForm = useCallback((isEdit = false) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="eventName">Event Name *</Label>
        <Input
          id="eventName"
          name="eventName"
          value={formData.eventName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Status *</Label>
        <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="cancel">Cancel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="eventStartDate">Event Start Date *</Label>
          <DatePicker
            id="eventStartDate"
            name="eventStartDate"
            value={formData.eventStartDate}
            onChange={handleDateTimeChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="eventEndDate">Event End Date *</Label>
          <DatePicker
            id="eventEndDate"
            name="eventEndDate"
            value={formData.eventEndDate}
            onChange={handleDateTimeChange}
            min={formData.eventStartDate}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="eventStartTime">Event Start Time *</Label>
          <TimePicker
            id="eventStartTime"
            name="eventStartTime"
            value={formData.eventStartTime}
            onChange={handleDateTimeChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="eventEndTime">Event End Time *</Label>
          <TimePicker
            id="eventEndTime"
            name="eventEndTime"
            value={formData.eventEndTime}
            onChange={handleDateTimeChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="eventLocation">Event Location *</Label>
        <Input
          id="eventLocation"
          name="eventLocation"
          value={formData.eventLocation}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="registrationDeadline">Registration Deadline *</Label>
        <DatePicker
          id="registrationDeadline"
          name="registrationDeadline"
          value={formData.registrationDeadline}
          onChange={handleDateTimeChange}
          max={formData.eventStartDate}
          required
        />
      </div>

      <div>
        <Label htmlFor="eventInformation">Event Information *</Label>
        <Textarea
          id="eventInformation"
          name="eventInformation"
          value={formData.eventInformation}
          onChange={handleInputChange}
          rows={4}
          required
        />
      </div>

      <div>
        <Label htmlFor="eventBanner">Event Banner</Label>
        <Input
          id="eventBanner"
          name="eventBanner"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {bannerPreview && (
          <div className="mt-2">
            <img
              src={bannerPreview}
              alt="Banner preview"
              className="w-full h-32 object-cover rounded-md border border-[#DBE2EF]"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isCreating || isEditing}>
          {isCreating || isEditing ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Event' : 'Create Event')}
        </Button>
      </div>
    </form>
  ), [formData, bannerPreview, isCreating, isEditing, handleSubmit, handleInputChange, handleSelectChange, handleDateTimeChange, handleFileChange]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[#112D4E]">Loading events...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 bg-[#F9F7F7] min-h-screen p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#112D4E]">Event Management</h1>
            <p className="text-[#3F72AF]">Manage your events and create new ones</p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-[#DBE2EF]">
              <DialogHeader>
                <DialogTitle className="text-[#112D4E]">Create New Event</DialogTitle>
              </DialogHeader>
              {renderEventForm(false)}
            </DialogContent>
          </Dialog>
        </div>

        {/* Events List */}
        <div className="grid gap-6">
          {events.length === 0 ? (
            <Card className="p-8 text-center bg-white border-[#DBE2EF]">
              <h3 className="text-lg font-medium text-[#112D4E] mb-2">No events found</h3>
              <p className="text-[#3F72AF] mb-4">Create your first event to get started</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create Event
              </Button>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event._id} className="p-6 bg-white border-[#DBE2EF] hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-[#112D4E]">{event.eventName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-[#3F72AF] mb-3">{event.eventInformation}</p>
                  </div>
                  {event.eventBanner && (
                    <img
                      src={event.eventBanner}
                      alt={event.eventName}
                      className="w-24 h-16 object-cover rounded-md ml-4 border border-[#DBE2EF]"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#3F72AF]" />
                    <div>
                      <span className="font-medium text-[#112D4E]">Date:</span>
                      <p className="text-[#3F72AF]">
                        {formatDate(event.eventStartDate)} - {formatDate(event.eventEndDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#3F72AF]" />
                    <div>
                      <span className="font-medium text-[#112D4E]">Time:</span>
                      <p className="text-[#3F72AF]">
                        {formatTime(event.eventStartTime)} - {formatTime(event.eventEndTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#3F72AF]" />
                    <div>
                      <span className="font-medium text-[#112D4E]">Location:</span>
                      <p className="text-[#3F72AF]">{event.eventLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3F72AF]" />
                    <div>
                      <span className="font-medium text-[#112D4E]">Visitors:</span>
                      <p className="text-[#3F72AF]">{event.visitorCount || 0} / {event.capacity.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#DBE2EF]">
                  <div className="text-sm text-[#3F72AF]">
                    <span>Registration Deadline: {formatDate(event.registrationDeadline)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(event)}
                      className="text-[#3F72AF] hover:text-[#112D4E]"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(event)}
                      className="text-[#3F72AF] hover:text-[#112D4E]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                                                  onClick={() => handleDeleteClick(event._id!)}
                      disabled={isDeleting}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-[#DBE2EF]">
            <DialogHeader>
              <DialogTitle className="text-[#112D4E]">Edit Event</DialogTitle>
            </DialogHeader>
            {renderEventForm(true)}
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-[#DBE2EF]">
            <DialogHeader>
              <DialogTitle className="text-[#112D4E]">Event Details</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                {selectedEvent.eventBanner && (
                  <img
                    src={selectedEvent.eventBanner}
                    alt={selectedEvent.eventName}
                    className="w-full h-48 object-cover rounded-md border border-[#DBE2EF]"
                  />
                )}
                <div>
                  <h3 className="text-2xl font-bold text-[#112D4E] mb-2">{selectedEvent.eventName}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                  </span>
                </div>
                <p className="text-[#3F72AF]">{selectedEvent.eventInformation}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-[#112D4E]">Date:</span>
                    <p className="text-[#3F72AF]">
                      {formatDate(selectedEvent.eventStartDate)} - {formatDate(selectedEvent.eventEndDate)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-[#112D4E]">Time:</span>
                    <p className="text-[#3F72AF]">
                      {formatTime(selectedEvent.eventStartTime)} - {formatTime(selectedEvent.eventEndTime)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-[#112D4E]">Location:</span>
                    <p className="text-[#3F72AF]">{selectedEvent.eventLocation}</p>
                  </div>
                  <div>
                    <span className="font-medium text-[#112D4E]">Visitors:</span>
                    <p className="text-[#3F72AF]">{selectedEvent.visitorCount || 0} / {selectedEvent.capacity.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-[#112D4E]">Registration Deadline:</span>
                    <p className="text-[#3F72AF]">{formatDate(selectedEvent.registrationDeadline)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-[#112D4E]">Created:</span>
                    <p className="text-[#3F72AF]">{formatDate(selectedEvent.createdAt?.toString() || '')}</p>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Event"
          description="Are you sure you want to delete this event? This action cannot be undone and will permanently remove all event data and associated registrations."
          confirmText="Delete Event"
          cancelText="Cancel"
          onConfirm={handleDelete}
          variant="destructive"
        />
      </div>
    </AdminLayout>
  );
} 