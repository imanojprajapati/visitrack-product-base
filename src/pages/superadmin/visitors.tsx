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
  User, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Building, 
  Activity,
  Check,
  X,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface Visitor {
  _id: string;
  ownerId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  registrationDate: string;
  eventId?: string;
  eventTitle?: string;
  checkInStatus: 'pending' | 'checked-in' | 'checked-out';
  checkInTime?: string;
  checkOutTime?: string;
  qrCode?: string;
  specialRequests?: string;
  dietaryRestrictions?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminVisitors() {
  const router = useRouter();
  const { superAdmin, isAuthenticated, isLoading } = useSuperAdmin();
  const { toast } = useToast();
  
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalVisitors: 0,
    checkedInVisitors: 0,
    pendingVisitors: 0,
    organizationCount: 0,
    todayRegistrations: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/superadmin/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchVisitors();
    }
  }, [isAuthenticated, isLoading]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      
      const response = await fetch('/api/superadmin/visitors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch visitors');
      }

      const data = await response.json();
      console.log('Super Admin Visitors API Response:', data);
      
      setVisitors(data.visitors || []);
      
      // Calculate statistics
      const totalVisitors = data.visitors?.length || 0;
      const checkedInVisitors = data.visitors?.filter((v: Visitor) => v.checkInStatus === 'checked-in').length || 0;
      const pendingVisitors = data.visitors?.filter((v: Visitor) => v.checkInStatus === 'pending').length || 0;
      const organizationCount = new Set(data.visitors?.map((v: Visitor) => v.ownerId)).size;
      
      // Calculate today's registrations
      const today = new Date().toDateString();
      const todayRegistrations = data.visitors?.filter((v: Visitor) => 
        new Date(v.registrationDate).toDateString() === today
      ).length || 0;
      
      setStats({
        totalVisitors,
        checkedInVisitors,
        pendingVisitors,
        organizationCount,
        todayRegistrations
      });
      
    } catch (err) {
      setError('Failed to load visitors');
      console.error('Error fetching visitors:', err);
      toast({
        title: "Error",
        description: "Failed to load visitors. Please try again.",
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in':
        return '#093FB4';
      case 'checked-out':
        return '#FFD8D8';
      case 'pending':
        return '#ED3500';
      default:
        return '#FFD8D8';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked-in':
        return <Check className="h-3 w-3" />;
      case 'checked-out':
        return <X className="h-3 w-3" />;
      case 'pending':
        return <Activity className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const filteredVisitors = visitors.filter(visitor => 
    visitor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.ownerId?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#093FB4]">Visitor Management</h1>
                <p className="mt-1 text-[#093FB4] opacity-70">Monitor and manage all visitors across organizations</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#093FB4] to-[#072B82] shadow-lg">
              <Activity className="h-4 w-4 inline mr-2" />
              {stats.totalVisitors.toLocaleString()} Total Visitors
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Visitors</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalVisitors.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#D12B00] shadow-md">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Checked In</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.checkedInVisitors.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#ED3500] shadow-md">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Pending</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.pendingVisitors.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Today's Registrations</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.todayRegistrations.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <Building className="h-6 w-6 text-white" />
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
                placeholder="Search visitors by name, email, company, job title, event, or owner ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-[#FFD8D8] focus:border-[#093FB4] bg-[#FFFCFB] rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visitors Table */}
        <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="text-white bg-gradient-to-r from-[#093FB4] to-[#072B82] border-b-0">
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2" />
              Visitor Directory ({filteredVisitors.length} visitors)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#093FB4]"></div>
                <span className="ml-3 text-[#093FB4]">Loading visitors...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-[#ED3500] mx-auto mb-4" />
                <p className="text-[#ED3500] text-lg font-medium mb-4">{error}</p>
                <Button 
                  onClick={fetchVisitors}
                  className="bg-[#ED3500] hover:bg-[#D12B00] text-white border-none shadow-md"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : filteredVisitors.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-[#093FB4] opacity-50 mx-auto mb-4" />
                <p className="text-[#093FB4] text-lg font-medium">
                  {searchTerm ? 'No visitors found matching your search' : 'No visitors available'}
                </p>
                <p className="text-[#093FB4] opacity-70 mt-2">
                  {searchTerm ? 'Try different keywords or clear your search' : 'Visitors will appear here when they register for events'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-[#FFD8D8]">
                  <thead className="bg-[#FFFCFB]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Visitor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Professional
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Check-in Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Organization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#FFD8D8]">
                    {filteredVisitors.map((visitor) => (
                      <tr key={visitor._id} className="hover:bg-[#FFFCFB] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                              {visitor.fullName?.charAt(0)?.toUpperCase() || 'V'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-[#093FB4]">{visitor.fullName || 'No Name'}</div>
                              <div className="text-sm text-[#093FB4] opacity-70">
                                Registered: {formatDate(visitor.registrationDate)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                              <Mail className="h-4 w-4 mr-2 text-[#ED3500]" />
                              {visitor.email}
                            </div>
                            {visitor.phoneNumber && (
                              <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                                <Phone className="h-4 w-4 mr-2 text-[#ED3500]" />
                                {visitor.phoneNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {visitor.company && (
                              <div className="flex items-center text-[#093FB4] opacity-70 mb-1">
                                <Building className="h-4 w-4 mr-2 text-[#ED3500]" />
                                {visitor.company}
                              </div>
                            )}
                            {visitor.jobTitle && (
                              <div className="text-[#093FB4] opacity-70 text-xs">
                                {visitor.jobTitle}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {visitor.eventTitle ? (
                              <div className="font-medium text-[#093FB4]">{visitor.eventTitle}</div>
                            ) : (
                              <div className="text-[#093FB4] opacity-50">No event specified</div>
                            )}
                            {visitor.eventId && (
                              <div className="text-[#093FB4] opacity-70 text-xs font-mono">
                                ID: {visitor.eventId}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                              style={{ backgroundColor: getStatusColor(visitor.checkInStatus) }}
                            >
                              {getStatusIcon(visitor.checkInStatus)}
                              <span className="ml-1 capitalize">{visitor.checkInStatus}</span>
                            </span>
                            {visitor.checkInTime && (
                              <div className="text-xs text-[#093FB4] opacity-70">
                                In: {formatDate(visitor.checkInTime)}
                              </div>
                            )}
                            {visitor.checkOutTime && (
                              <div className="text-xs text-[#093FB4] opacity-70">
                                Out: {formatDate(visitor.checkOutTime)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-[#093FB4]">Owner ID</div>
                            <div className="text-[#093FB4] opacity-70 font-mono text-xs">{visitor.ownerId}</div>
                            {visitor.source && (
                              <div className="text-[#093FB4] opacity-70 text-xs mt-1">
                                Source: {visitor.source}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
} 