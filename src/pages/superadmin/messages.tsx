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
  MessageSquare, 
  Send, 
  Users, 
  Mail, 
  Calendar, 
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building,
  Eye
} from 'lucide-react';

interface Message {
  _id: string;
  ownerId: string;
  subject: string;
  content: string;
  recipients: string[];
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  templateId?: string;
  eventId?: string;
  eventTitle?: string;
  sentAt?: string;
  scheduledAt?: string;
  type: 'email' | 'sms' | 'notification';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminMessages() {
  const router = useRouter();
  const { superAdmin, isAuthenticated, isLoading } = useSuperAdmin();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalMessages: 0,
    sentMessages: 0,
    totalRecipients: 0,
    organizationCount: 0,
    deliveryRate: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/superadmin/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [isAuthenticated, isLoading]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      
      const response = await fetch('/api/superadmin/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      console.log('Super Admin Messages API Response:', data);
      
      setMessages(data.messages || []);
      
      // Calculate statistics
      const totalMessages = data.messages?.length || 0;
      const sentMessages = data.messages?.filter((m: Message) => m.status === 'sent' || m.status === 'delivered').length || 0;
      const totalRecipients = data.messages?.reduce((sum: number, m: Message) => sum + (m.sentCount || 0), 0) || 0;
      const organizationCount = new Set(data.messages?.map((m: Message) => m.ownerId)).size;
      const totalDelivered = data.messages?.reduce((sum: number, m: Message) => sum + (m.deliveredCount || 0), 0) || 0;
      const deliveryRate = totalRecipients > 0 ? Math.round((totalDelivered / totalRecipients) * 100) : 0;
      
      setStats({
        totalMessages,
        sentMessages,
        totalRecipients,
        organizationCount,
        deliveryRate
      });
      
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
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
      case 'sent':
      case 'delivered':
        return '#093FB4';
      case 'draft':
        return '#FFD8D8';
      case 'failed':
        return '#ED3500';
      default:
        return '#FFD8D8';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return '#093FB4';
      case 'sms':
        return '#ED3500';
      case 'notification':
        return '#FFD8D8';
      default:
        return '#FFD8D8';
    }
  };

  const filteredMessages = messages.filter(message => 
    message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.ownerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.type?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#093FB4]">Message Management</h1>
                <p className="mt-1 text-[#093FB4] opacity-70">Monitor and manage all messages across organizations</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#093FB4] to-[#072B82] shadow-lg">
              <Activity className="h-4 w-4 inline mr-2" />
              {stats.totalMessages.toLocaleString()} Total Messages
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Messages</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalMessages.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#D12B00] shadow-md">
                  <Send className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Sent Messages</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.sentMessages.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Recipients</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.totalRecipients.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Delivery Rate</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{stats.deliveryRate}%</p>
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
                placeholder="Search messages by subject, content, event, type, or owner ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-[#FFD8D8] focus:border-[#093FB4] bg-[#FFFCFB] rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Messages Grid */}
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
                    onClick={fetchMessages}
                    className="bg-[#ED3500] hover:bg-[#D12B00] text-white border-none shadow-md"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-[#093FB4] opacity-50 mx-auto mb-4" />
                  <p className="text-[#093FB4] text-lg font-medium">
                    {searchTerm ? 'No messages found matching your search' : 'No messages available'}
                  </p>
                  <p className="text-[#093FB4] opacity-70 mt-2">
                    {searchTerm ? 'Try different keywords or clear your search' : 'Messages will appear here when organizations send them'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <Card key={message._id} className="border-2 border-[#FFD8D8] bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group">
                <CardHeader className="bg-gradient-to-r from-[#FFFCFB] to-white border-b-2 border-[#FFD8D8]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-[#093FB4] group-hover:text-[#072B82] transition-colors">
                        {message.subject}
                      </CardTitle>
                      <p className="text-sm text-[#093FB4] opacity-70 mt-1 font-mono">
                        Owner: {message.ownerId}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: getStatusColor(message.status) }}
                      >
                        {message.status}
                      </span>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: getTypeColor(message.type) }}
                      >
                        {message.type}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-[#093FB4] opacity-80 line-clamp-3">
                    {message.content}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                      <Calendar className="h-4 w-4 mr-2 text-[#ED3500]" />
                      Created: {formatDate(message.createdAt)}
                    </div>
                    
                    {message.sentAt && (
                      <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                        <Send className="h-4 w-4 mr-2 text-[#ED3500]" />
                        Sent: {formatDate(message.sentAt)}
                      </div>
                    )}
                    
                    {message.eventTitle && (
                      <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                        <Activity className="h-4 w-4 mr-2 text-[#ED3500]" />
                        Event: {message.eventTitle}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                      <Users className="h-4 w-4 mr-2 text-[#ED3500]" />
                      {message.sentCount || 0} recipients
                    </div>
                  </div>
                  
                  {/* Delivery Statistics */}
                  <div className="pt-3 border-t border-[#FFD8D8]">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-[#093FB4] opacity-70">Sent</p>
                        <p className="text-lg font-bold text-[#093FB4]">{message.sentCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#093FB4] opacity-70">Delivered</p>
                        <p className="text-lg font-bold text-[#093FB4]">{message.deliveredCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#093FB4] opacity-70">Read</p>
                        <p className="text-lg font-bold text-[#093FB4]">{message.readCount || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  {message.tags && message.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-[#FFD8D8] text-[#093FB4]">
                          {tag}
                        </Badge>
                      ))}
                      {message.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-[#FFD8D8] text-[#093FB4]">
                          +{message.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {message.scheduledAt && (
                    <div className="pt-3 border-t border-[#FFD8D8] text-xs text-[#093FB4] opacity-70">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Scheduled: {formatDate(message.scheduledAt)}
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