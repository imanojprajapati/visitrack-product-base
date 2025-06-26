import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { CalendarDays, Users, TrendingUp, Eye, Filter } from 'lucide-react';

interface DashboardStats {
  totalEvents: number;
  totalAttendees: number;
  visitedCount: number;
  recentRegistrations: number;
}

interface EventData {
  eventName: string;
  attendeeCount: number;
  visitedCount: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface RegistrationTrend {
  date: string;
  registrations: number;
  visited: number;
}

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
}

const chartConfig = {
  registrations: {
    label: "Registrations",
    color: "#3F72AF",
  },
  visited: {
    label: "Visited",
    color: "#112D4E",
  },
  attendeeCount: {
    label: "Total Attendees",
    color: "#3F72AF",
  },
  visitedCount: {
    label: "Visited",
    color: "#112D4E",
  },
};

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, user, username, ownerId, role } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalAttendees: 0,
    visitedCount: 0,
    recentRegistrations: 0
  });
  const [eventData, setEventData] = useState<EventData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [registrationTrend, setRegistrationTrend] = useState<RegistrationTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, isAuthenticated, selectedEventId]);

  const fetchDashboardData = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      setLoading(true);

      // Fetch events
      const eventsResponse = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const eventsData = eventsResponse.ok ? await eventsResponse.json() : [];
      setEvents(eventsData);

      // Fetch visitors
      const visitorsResponse = await fetch('/api/visitors?limit=1000', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const visitorsData = visitorsResponse.ok ? await visitorsResponse.json() : { visitors: [] };
      let visitors = visitorsData.visitors || [];

      // Filter visitors by selected event if not 'all'
      if (selectedEventId !== 'all') {
        visitors = visitors.filter((v: any) => v.eventId === selectedEventId);
      }

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const visitedCount = visitors.filter((v: any) => v.status.toLowerCase() === 'visited').length;
      const recentRegistrations = visitors.filter((v: any) => v.visitorRegistrationDate === today).length;

      setStats({
        totalEvents: selectedEventId === 'all' ? eventsData.length : 1,
        totalAttendees: visitors.length,
        visitedCount,
        recentRegistrations
      });

      // Prepare event data for bar chart
      let eventAttendees;
      if (selectedEventId === 'all') {
        eventAttendees = eventsData.map((event: any) => {
          const eventVisitors = visitors.filter((v: any) => v.eventId === event._id);
          const visitedVisitors = eventVisitors.filter((v: any) => v.status.toLowerCase() === 'visited');
          return {
            eventName: event.eventName.length > 15 ? event.eventName.substring(0, 15) + '...' : event.eventName,
            attendeeCount: eventVisitors.length,
            visitedCount: visitedVisitors.length
          };
        });
        setEventData(eventAttendees.slice(0, 6)); // Show top 6 events
      } else {
        // For single event, show daily breakdown
        const selectedEvent = eventsData.find((e: any) => e._id === selectedEventId);
        if (selectedEvent) {
          const dailyData = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayVisitors = visitors.filter((v: any) => v.visitorRegistrationDate === dateStr);
            const dayVisited = dayVisitors.filter((v: any) => v.status.toLowerCase() === 'visited');
            
            dailyData.push({
              eventName: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              attendeeCount: dayVisitors.length,
              visitedCount: dayVisited.length
            });
          }
          setEventData(dailyData);
        }
      }

      // Prepare status data for pie chart
      const registrationCount = visitors.filter((v: any) => v.status.toLowerCase() === 'registration').length;
      setStatusData([
        { name: 'Registration', value: registrationCount, color: '#3F72AF' },
        { name: 'Visited', value: visitedCount, color: '#112D4E' }
      ]);

      // Prepare registration trend data (last 7 days)
      const trendData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayRegistrations = visitors.filter((v: any) => v.visitorRegistrationDate === dateStr).length;
        const dayVisited = visitors.filter((v: any) => 
          v.visitorRegistrationDate === dateStr && v.status.toLowerCase() === 'visited'
        ).length;
        
        trendData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          registrations: dayRegistrations,
          visited: dayVisited
        });
      }
      setRegistrationTrend(trendData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Visitrack</title>
        <meta name="description" content="Visitrack Admin Panel" />
      </Head>

      <AdminLayout>
        <div className="space-y-4 sm:space-y-6 bg-[#F9F7F7] min-h-screen p-4 sm:p-6">
          {/* Welcome Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#112D4E] mb-2">
              Welcome to Admin Panel
            </h1>
            <p className="text-[#3F72AF] text-sm sm:text-base">
              Hello, <span className="font-semibold text-[#112D4E]">{user?.fullName}</span>! 
              Welcome back to your Visitrack dashboard.
            </p>
          </div>

          {/* Event Filter */}
          <div className="mb-6">
            <Card className="border-[#DBE2EF]">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#3F72AF]" />
                    <span className="text-sm font-medium text-[#112D4E]">Filter by Event:</span>
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event._id} value={event._id}>
                            {event.eventName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedEventId !== 'all' && (
                    <span className="text-xs text-[#3F72AF] bg-[#DBE2EF] px-2 py-1 rounded">
                      Showing data for selected event only
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>



          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-gradient-to-r from-[#112D4E] to-[#3F72AF] text-white border-0">
              <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-[#DBE2EF] text-xs sm:text-sm">Total Events</p>
                    <p className="text-2xl sm:text-3xl font-bold">{loading ? '...' : stats.totalEvents}</p>
                </div>
                  <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 opacity-75" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#DBE2EF]">
              <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#3F72AF] text-xs sm:text-sm">Total Registrations</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#112D4E]">{loading ? '...' : stats.totalAttendees}</p>
                  </div>
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#3F72AF]" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#DBE2EF]">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#3F72AF] text-xs sm:text-sm">Visited</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{loading ? '...' : stats.visitedCount}</p>
                  </div>
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#DBE2EF]">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#3F72AF] text-xs sm:text-sm">Today's Registrations</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{loading ? '...' : stats.recentRegistrations}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
                    </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Event Attendees Bar Chart */}
            <Card className="border-[#DBE2EF]">
              <CardHeader>
                <CardTitle className="text-[#112D4E] text-lg sm:text-xl">
                  {selectedEventId === 'all' ? 'Event Attendance Overview' : 'Daily Attendance Trend'}
                </CardTitle>
                <CardDescription className="text-sm">
                  {selectedEventId === 'all' 
                    ? 'Total registrations vs visited by event' 
                    : 'Daily registrations vs visited for selected event'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {eventData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                    <BarChart data={eventData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="eventName" 
                        fontSize={10}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis fontSize={10} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="attendeeCount" fill="var(--color-attendeeCount)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="visitedCount" fill="var(--color-visitedCount)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-500 text-sm">
                    {loading ? 'Loading chart data...' : 'No event data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution Pie Chart */}
            <Card className="border-[#DBE2EF]">
              <CardHeader>
                <CardTitle className="text-[#112D4E] text-lg sm:text-xl">Registration Status</CardTitle>
                <CardDescription className="text-sm">Distribution of visitor statuses</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {statusData.length > 0 && statusData.some(d => d.value > 0) ? (
                  <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                          // Hide labels on very small screens to prevent overlap
                          if (typeof window !== 'undefined' && window.innerWidth < 400) {
                            return '';
                          }
                          return `${name} ${(percent * 100).toFixed(0)}%`;
                        }}
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-500 text-sm">
                    {loading ? 'Loading chart data...' : 'No status data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Registration Trend Chart */}
          <Card className="border-[#DBE2EF] mb-8">
            <CardHeader>
              <CardTitle className="text-[#112D4E] text-lg sm:text-xl">
                Registration Trend (Last 7 Days)
                {selectedEventId !== 'all' && (
                  <span className="text-sm font-normal text-[#3F72AF] ml-2">
                    - {events.find(e => e._id === selectedEventId)?.eventName}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {selectedEventId === 'all' 
                  ? 'Daily registration and visit trends across all events'
                  : 'Daily registration and visit trends for selected event'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {registrationTrend.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
                  <AreaChart data={registrationTrend} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={10} 
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis 
                      fontSize={10} 
                      tick={{ fontSize: 10 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="registrations" 
                      stackId="1"
                      stroke="var(--color-registrations)" 
                      fill="var(--color-registrations)"
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="visited" 
                      stackId="2"
                      stroke="var(--color-visited)" 
                      fill="var(--color-visited)"
                      fillOpacity={0.8}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-500 text-sm">
                  {loading ? 'Loading trend data...' : 'No trend data available'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
} 