import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface Event {
  _id: string;
  ownerId: string;
  title: string;
  description?: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  capacity?: number;
  registeredCount?: number;
  isActive: boolean;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminEvents() {
  const router = useRouter();
  const { superAdmin, isAuthenticated, isLoading } = useSuperAdmin();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    averageCapacity: 0,
    organizationCount: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/superadmin/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated, isLoading]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      
      const response = await fetch('/api/superadmin/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      console.log('Super Admin Events API Response:', data);
      
      setEvents(data.events || []);
      
      // Calculate statistics
      const totalEvents = data.events?.length || 0;
      const activeEvents = data.events?.filter((e: Event) => e.isActive).length || 0;
      const totalRegistrations = data.events?.reduce((sum: number, e: Event) => sum + (e.registeredCount || 0), 0) || 0;
      const averageCapacity = totalEvents > 0 ? data.events.reduce((sum: number, e: Event) => sum + (e.capacity || 0), 0) / totalEvents : 0;
      const organizationCount = new Set(data.events?.map((e: Event) => e.ownerId)).size;
      
      setStats({
        totalEvents,
        activeEvents,
        totalRegistrations,
        averageCapacity: Math.round(averageCapacity),
        organizationCount
      });
      
    } catch (err) {
      setError('Failed to load events');
      console.error('Error fetching events:', err);
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventStatus = (event: Event) => {
    const eventDate = new Date(event.eventDate);
    const today = new Date();
    const isUpcoming = eventDate > today;
    const isActive = event.isActive;
    
    if (!isActive) return { status: 'Inactive', color: '#ED3500' };
    if (isUpcoming) return { status: 'Upcoming', color: '#093FB4' };
    return { status: 'Past', color: '#FFD8D8' };
  };

  const filteredEvents = events.filter(event => 
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.ownerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#FFFCFB]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093FB4]"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 bg-[#FFFCFB] min-h-screen p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#093FB4]">Event Management</h1>
                <p className="mt-1 text-[#093FB4] opacity-70">Monitor and manage all events across organizations</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#093FB4] to-[#072B82] shadow-lg">
              <Activity className="h-4 w-4 inline mr-2" />
              {stats.totalEvents.toLocaleString()} Total Events
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Events</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalEvents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#D12B00] shadow-md">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Active Events</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.activeEvents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#ED3500] shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Registrations</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalRegistrations.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#093FB4] shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Avg Capacity</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.averageCapacity.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Organizations</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.organizationCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#093FB4] opacity-50" />
              <Input
                placeholder="Search events by title, description, location, category, or owner ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-[#FFD8D8] focus:border-[#093FB4] bg-[#FFFCFB] rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-[#FFD8D8] rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-[#FFD8D8] rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-[#FFD8D8] rounded w-full mb-2"></div>
                    <div className="h-3 bg-[#FFD8D8] rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-full">
              <Card className="border-2 border-[#ED3500] bg-white shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-[#ED3500] mx-auto mb-4" />
                  <p className="text-[#ED3500] text-lg font-medium mb-4">{error}</p>
                  <Button 
                    onClick={fetchEvents}
                    className="bg-[#ED3500] hover:bg-[#D12B00] text-white border-none shadow-md"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-[#093FB4] opacity-50 mx-auto mb-4" />
                  <p className="text-[#093FB4] text-lg font-medium">
                    {searchTerm ? 'No events found matching your search' : 'No events available'}
                  </p>
                  <p className="text-[#093FB4] opacity-70 mt-2">
                    {searchTerm ? 'Try different keywords or clear your search' : 'Events will appear here when organizations create them'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const eventStatus = getEventStatus(event);
              return (
                <Card key={event._id} className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group">
                  <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-[#093FB4] group-hover:text-[#072B82] transition-colors">
                          {event.title}
                        </CardTitle>
                        <p className="text-sm text-[#093FB4] opacity-70 mt-1 font-mono">
                          Owner: {event.ownerId}
                        </p>
                      </div>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: eventStatus.color }}
                      >
                        {eventStatus.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {event.description && (
                      <p className="text-sm text-[#093FB4] opacity-80 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                        <Calendar className="h-4 w-4 mr-2 text-[#ED3500]" />
                        {formatDate(event.eventDate)}
                      </div>
                      
                      {event.eventTime && (
                        <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                          <Clock className="h-4 w-4 mr-2 text-[#ED3500]" />
                          {event.eventTime}
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                          <MapPin className="h-4 w-4 mr-2 text-[#ED3500]" />
                          {event.location}
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                        <Users className="h-4 w-4 mr-2 text-[#ED3500]" />
                        {event.registeredCount || 0} / {event.capacity || 'Unlimited'} registered
                      </div>
                    </div>
                    
                    {event.category && (
                      <div className="pt-3 border-t border-[#FFD8D8]">
                        <Badge className="bg-[#093FB4] text-white hover:bg-[#072B82]">
                          {event.category}
                        </Badge>
                      </div>
                    )}
                    
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-[#FFD8D8] text-[#093FB4]">
                            {tag}
                          </Badge>
                        ))}
                        {event.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs border-[#FFD8D8] text-[#093FB4]">
                            +{event.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
} 