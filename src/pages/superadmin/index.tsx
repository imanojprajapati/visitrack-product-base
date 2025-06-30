import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { 
  Users, 
  Calendar, 
  Award, 
  FileText, 
  MessageSquare,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Building,
  Globe,
  BarChart3,
  PieChart,
  Monitor,
  Shield
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalEvents: number;
  totalVisitors: number;
  totalBadges: number;
  totalForms: number;
  totalMessages: number;
  totalOrganizations: number;
  activeUsers: number;
  recentActivity: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { superAdmin, isAuthenticated, isLoading } = useSuperAdmin();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalEvents: 0,
    totalVisitors: 0,
    totalBadges: 0,
    totalForms: 0,
    totalMessages: 0,
    totalOrganizations: 0,
    activeUsers: 0,
    recentActivity: 0,
    systemHealth: 'good'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/superadmin/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchSystemStats();
    }
  }, [isAuthenticated, isLoading]);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      
      const response = await fetch('/api/superadmin/system-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system statistics');
      }

      const data = await response.json();
      console.log('Super Admin System Stats API Response:', data);
      
      setStats(data.stats || stats);
      
    } catch (err) {
      setError('Failed to load system statistics');
      console.error('Error fetching system stats:', err);
      toast({
        title: "Error",
        description: "Failed to load system statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return '#093FB4';
      case 'good':
        return '#093FB4';
      case 'warning':
        return '#FFD8D8';
      case 'critical':
        return '#ED3500';
      default:
        return '#093FB4';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

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
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#093FB4]">Super Admin Dashboard</h1>
                <p className="mt-1 text-[#093FB4] opacity-70">Global system overview and management</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div 
              className="px-6 py-3 rounded-xl text-sm font-medium text-white shadow-lg flex items-center"
              style={{ backgroundColor: getHealthColor(stats.systemHealth) }}
            >
              {getHealthIcon(stats.systemHealth)}
              <span className="ml-2">System Health: {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Organizations</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalOrganizations.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#D12B00] shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Users</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalUsers.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Active Users</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.activeUsers.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Recent Activity</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.recentActivity.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Events Card */}
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
              <CardTitle className="flex items-center text-lg text-[#093FB4]">
                <Calendar className="h-5 w-5 mr-2 text-[#ED3500]" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#093FB4] mb-2">{stats.totalEvents.toLocaleString()}</p>
                <p className="text-[#093FB4] opacity-70">Total Events</p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FFD8D8]">
                <Button
                  onClick={() => router.push('/superadmin/events')}
                  className="w-full bg-[#093FB4] hover:bg-[#072B82] text-white border-none shadow-md"
                >
                  Manage Events
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Visitors Card */}
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
              <CardTitle className="flex items-center text-lg text-[#093FB4]">
                <Users className="h-5 w-5 mr-2 text-[#ED3500]" />
                Visitors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#093FB4] mb-2">{stats.totalVisitors.toLocaleString()}</p>
                <p className="text-[#093FB4] opacity-70">Total Visitors</p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FFD8D8]">
                <Button
                  onClick={() => router.push('/superadmin/visitors')}
                  className="w-full bg-[#093FB4] hover:bg-[#072B82] text-white border-none shadow-md"
                >
                  Manage Visitors
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges Card */}
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
              <CardTitle className="flex items-center text-lg text-[#093FB4]">
                <Award className="h-5 w-5 mr-2 text-[#ED3500]" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#093FB4] mb-2">{stats.totalBadges.toLocaleString()}</p>
                <p className="text-[#093FB4] opacity-70">Total Badges</p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FFD8D8]">
                <Button
                  onClick={() => router.push('/superadmin/badges')}
                  className="w-full bg-[#093FB4] hover:bg-[#072B82] text-white border-none shadow-md"
                >
                  Manage Badges
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Forms Card */}
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
              <CardTitle className="flex items-center text-lg text-[#093FB4]">
                <FileText className="h-5 w-5 mr-2 text-[#ED3500]" />
                Forms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#093FB4] mb-2">{stats.totalForms.toLocaleString()}</p>
                <p className="text-[#093FB4] opacity-70">Total Forms</p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FFD8D8]">
                <Button
                  onClick={() => router.push('/superadmin/forms')}
                  className="w-full bg-[#093FB4] hover:bg-[#072B82] text-white border-none shadow-md"
                >
                  Manage Forms
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Messages Card */}
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
              <CardTitle className="flex items-center text-lg text-[#093FB4]">
                <MessageSquare className="h-5 w-5 mr-2 text-[#ED3500]" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#093FB4] mb-2">{stats.totalMessages.toLocaleString()}</p>
                <p className="text-[#093FB4] opacity-70">Total Messages</p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FFD8D8]">
                <Button
                  onClick={() => router.push('/superadmin/messages')}
                  className="w-full bg-[#093FB4] hover:bg-[#072B82] text-white border-none shadow-md"
                >
                  Manage Messages
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Users Card */}
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
              <CardTitle className="flex items-center text-lg text-[#093FB4]">
                <Shield className="h-5 w-5 mr-2 text-[#ED3500]" />
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#093FB4] mb-2">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-[#093FB4] opacity-70">Admin Users</p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FFD8D8]">
                <Button
                  onClick={() => router.push('/superadmin/users')}
                  className="w-full bg-[#093FB4] hover:bg-[#072B82] text-white border-none shadow-md"
                >
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#093FB4] to-[#072B82] text-white border-b-0">
            <CardTitle className="flex items-center text-lg">
              <Globe className="h-5 w-5 mr-2" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <PieChart className="h-8 w-8 text-[#093FB4]" />
                </div>
                <p className="text-2xl font-bold text-[#093FB4]">{((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%</p>
                <p className="text-[#093FB4] opacity-70">User Activity Rate</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <BarChart3 className="h-8 w-8 text-[#ED3500]" />
                </div>
                <p className="text-2xl font-bold text-[#093FB4]">{stats.totalOrganizations.toLocaleString()}</p>
                <p className="text-[#093FB4] opacity-70">Active Organizations</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-8 w-8 text-[#093FB4]" />
                </div>
                <p className="text-2xl font-bold text-[#093FB4]">{stats.recentActivity.toLocaleString()}</p>
                <p className="text-[#093FB4] opacity-70">Recent Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-2 border-[#ED3500] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-[#ED3500] mx-auto mb-4" />
              <p className="text-[#ED3500] text-lg font-medium mb-4">{error}</p>
              <Button 
                onClick={fetchSystemStats}
                className="bg-[#ED3500] hover:bg-[#D12B00] text-white border-none shadow-md"
              >
                <Activity className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperAdminLayout>
  );
} 