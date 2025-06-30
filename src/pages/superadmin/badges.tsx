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
  Award, 
  Star, 
  Eye, 
  Calendar, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Building,
  Palette
} from 'lucide-react';

interface BadgeItem {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  eventId?: string;
  eventTitle?: string;
  design: {
    backgroundColor: string;
    textColor: string;
    logoUrl?: string;
    template?: string;
  };
  isActive: boolean;
  assignedCount?: number;
  lastAssigned?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminBadges() {
  const router = useRouter();
  const { superAdmin, isAuthenticated, isLoading } = useSuperAdmin();
  const { toast } = useToast();
  
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalBadges: 0,
    activeBadges: 0,
    totalAssigned: 0,
    organizationCount: 0,
    uniqueDesigns: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/superadmin/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchBadges();
    }
  }, [isAuthenticated, isLoading]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      
      const response = await fetch('/api/superadmin/badges', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      const data = await response.json();
      console.log('Super Admin Badges API Response:', data);
      
      setBadges(data.badges || []);
      
      // Calculate statistics
      const totalBadges = data.badges?.length || 0;
      const activeBadges = data.badges?.filter((b: BadgeItem) => b.isActive).length || 0;
      const totalAssigned = data.badges?.reduce((sum: number, b: BadgeItem) => sum + (b.assignedCount || 0), 0) || 0;
      const organizationCount = new Set(data.badges?.map((b: BadgeItem) => b.ownerId)).size;
      const uniqueDesigns = new Set(data.badges?.map((b: BadgeItem) => `${b.design.backgroundColor}-${b.design.textColor}`)).size;
      
      setStats({
        totalBadges,
        activeBadges,
        totalAssigned,
        organizationCount,
        uniqueDesigns
      });
      
    } catch (err) {
      setError('Failed to load badges');
      console.error('Error fetching badges:', err);
      toast({
        title: "Error",
        description: "Failed to load badges. Please try again.",
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

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#093FB4' : '#ED3500';
  };

  const filteredBadges = badges.filter(badge => 
    badge.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.ownerId?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#093FB4]">Badge Management</h1>
                <p className="mt-1 text-[#093FB4] opacity-70">Monitor and manage all badges across organizations</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#093FB4] to-[#072B82] shadow-lg">
              <Activity className="h-4 w-4 inline mr-2" />
              {stats.totalBadges.toLocaleString()} Total Badges
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Badges</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalBadges.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Active Badges</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.activeBadges.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#ED3500] shadow-md">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Assigned</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalAssigned.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#093FB4] shadow-md">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Unique Designs</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.uniqueDesigns.toLocaleString()}</p>
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
                placeholder="Search badges by name, description, event, category, or owner ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-[#FFD8D8] focus:border-[#093FB4] bg-[#FFFCFB] rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges Grid */}
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
                    onClick={fetchBadges}
                    className="bg-[#ED3500] hover:bg-[#D12B00] text-white border-none shadow-md"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : filteredBadges.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <Award className="h-12 w-12 text-[#093FB4] opacity-50 mx-auto mb-4" />
                  <p className="text-[#093FB4] text-lg font-medium">
                    {searchTerm ? 'No badges found matching your search' : 'No badges available'}
                  </p>
                  <p className="text-[#093FB4] opacity-70 mt-2">
                    {searchTerm ? 'Try different keywords or clear your search' : 'Badges will appear here when organizations create them'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredBadges.map((badge) => (
              <Card key={badge._id} className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-[#093FB4] group-hover:text-[#072B82] transition-colors">
                        {badge.name}
                      </CardTitle>
                      <p className="text-sm text-[#093FB4] opacity-70 mt-1 font-mono">
                        Owner: {badge.ownerId}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: getStatusColor(badge.isActive) }}
                      >
                        {badge.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {/* Badge Preview */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                        style={{ 
                          backgroundColor: badge.design.backgroundColor,
                          color: badge.design.textColor
                        }}
                      >
                        <Award className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {badge.description && (
                    <p className="text-sm text-[#093FB4] opacity-80 line-clamp-2">
                      {badge.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                      <Calendar className="h-4 w-4 mr-2 text-[#ED3500]" />
                      Created: {formatDate(badge.createdAt)}
                    </div>
                    
                    {badge.eventTitle && (
                      <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                        <Activity className="h-4 w-4 mr-2 text-[#ED3500]" />
                        Event: {badge.eventTitle}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                      <Star className="h-4 w-4 mr-2 text-[#ED3500]" />
                      {badge.assignedCount || 0} assigned
                    </div>
                    
                    <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                      <Palette className="h-4 w-4 mr-2 text-[#ED3500]" />
                      Design: {badge.design.template || 'Custom'}
                    </div>
                  </div>
                  
                  {/* Design Preview */}
                  <div className="pt-3 border-t border-[#FFD8D8]">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-[#093FB4] opacity-70">Colors:</span>
                      <div className="flex space-x-1">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: badge.design.backgroundColor }}
                          title={`Background: ${badge.design.backgroundColor}`}
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: badge.design.textColor }}
                          title={`Text: ${badge.design.textColor}`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {badge.category && (
                    <div className="pt-3 border-t border-[#FFD8D8]">
                      <Badge className="bg-[#093FB4] text-white hover:bg-[#072B82]">
                        {badge.category}
                      </Badge>
                    </div>
                  )}
                  
                  {badge.tags && badge.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {badge.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-[#FFD8D8] text-[#093FB4]">
                          {tag}
                        </Badge>
                      ))}
                      {badge.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-[#FFD8D8] text-[#093FB4]">
                          +{badge.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {badge.lastAssigned && (
                    <div className="pt-3 border-t border-[#FFD8D8] text-xs text-[#093FB4] opacity-70">
                      Last assigned: {formatDate(badge.lastAssigned)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
} 