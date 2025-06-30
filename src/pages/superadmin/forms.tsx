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
  FileText, 
  Edit, 
  Eye, 
  Calendar, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Building
} from 'lucide-react';

interface Form {
  _id: string;
  ownerId: string;
  title: string;
  description?: string;
  eventId?: string;
  eventTitle?: string;
  fields: any[];
  isActive: boolean;
  isPublic: boolean;
  submissionsCount?: number;
  lastSubmission?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminForms() {
  const router = useRouter();
  const { superAdmin, isAuthenticated, isLoading } = useSuperAdmin();
  const { toast } = useToast();
  
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalForms: 0,
    activeForms: 0,
    totalSubmissions: 0,
    organizationCount: 0,
    publicForms: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/superadmin/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchForms();
    }
  }, [isAuthenticated, isLoading]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      
      const response = await fetch('/api/superadmin/forms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }

      const data = await response.json();
      console.log('Super Admin Forms API Response:', data);
      
      setForms(data.forms || []);
      
      // Calculate statistics
      const totalForms = data.forms?.length || 0;
      const activeForms = data.forms?.filter((f: Form) => f.isActive).length || 0;
      const totalSubmissions = data.forms?.reduce((sum: number, f: Form) => sum + (f.submissionsCount || 0), 0) || 0;
      const organizationCount = new Set(data.forms?.map((f: Form) => f.ownerId)).size;
      const publicForms = data.forms?.filter((f: Form) => f.isPublic).length || 0;
      
      setStats({
        totalForms,
        activeForms,
        totalSubmissions,
        organizationCount,
        publicForms
      });
      
    } catch (err) {
      setError('Failed to load forms');
      console.error('Error fetching forms:', err);
      toast({
        title: "Error",
        description: "Failed to load forms. Please try again.",
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

  const getVisibilityColor = (isPublic: boolean) => {
    return isPublic ? '#093FB4' : '#FFD8D8';
  };

  const filteredForms = forms.filter(form => 
    form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.ownerId?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#093FB4]">Form Management</h1>
                <p className="mt-1 text-[#093FB4] opacity-70">Monitor and manage all forms across organizations</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#093FB4] to-[#072B82] shadow-lg">
              <Activity className="h-4 w-4 inline mr-2" />
              {stats.totalForms.toLocaleString()} Total Forms
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Forms</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalForms.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Active Forms</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.activeForms.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Submissions</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalSubmissions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#093FB4] shadow-md">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Public Forms</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.publicForms.toLocaleString()}</p>
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
                placeholder="Search forms by title, description, event, category, or owner ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-[#FFD8D8] focus:border-[#093FB4] bg-[#FFFCFB] rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Forms Grid */}
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
                    onClick={fetchForms}
                    className="bg-[#ED3500] hover:bg-[#D12B00] text-white border-none shadow-md"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-[#093FB4] opacity-50 mx-auto mb-4" />
                  <p className="text-[#093FB4] text-lg font-medium">
                    {searchTerm ? 'No forms found matching your search' : 'No forms available'}
                  </p>
                  <p className="text-[#093FB4] opacity-70 mt-2">
                    {searchTerm ? 'Try different keywords or clear your search' : 'Forms will appear here when organizations create them'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredForms.map((form) => (
              <Card key={form._id} className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-[#093FB4] group-hover:text-[#072B82] transition-colors">
                        {form.title}
                      </CardTitle>
                      <p className="text-sm text-[#093FB4] opacity-70 mt-1 font-mono">
                        Owner: {form.ownerId}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: getStatusColor(form.isActive) }}
                      >
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: getVisibilityColor(form.isPublic) }}
                      >
                        {form.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {form.description && (
                    <p className="text-sm text-[#093FB4] opacity-80 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                      <Calendar className="h-4 w-4 mr-2 text-[#ED3500]" />
                      Created: {formatDate(form.createdAt)}
                    </div>
                    
                    {form.eventTitle && (
                      <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                        <Activity className="h-4 w-4 mr-2 text-[#ED3500]" />
                        Event: {form.eventTitle}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                      <Users className="h-4 w-4 mr-2 text-[#ED3500]" />
                      {form.submissionsCount || 0} submissions
                    </div>
                    
                    <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                      <Edit className="h-4 w-4 mr-2 text-[#ED3500]" />
                      {form.fields?.length || 0} fields
                    </div>
                  </div>
                  
                  {form.category && (
                    <div className="pt-3 border-t border-[#FFD8D8]">
                      <Badge className="bg-[#093FB4] text-white hover:bg-[#072B82]">
                        {form.category}
                      </Badge>
                    </div>
                  )}
                  
                  {form.tags && form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {form.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-[#FFD8D8] text-[#093FB4]">
                          {tag}
                        </Badge>
                      ))}
                      {form.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-[#FFD8D8] text-[#093FB4]">
                          +{form.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {form.lastSubmission && (
                    <div className="pt-3 border-t border-[#FFD8D8] text-xs text-[#093FB4] opacity-70">
                      Last submission: {formatDate(form.lastSubmission)}
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