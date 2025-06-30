import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../hooks/use-toast';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function SuperAdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, isLoading: authLoading } = useSuperAdmin();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/superadmin');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        login(data.superAdmin, data.token);
        toast({
          title: "Login Successful",
          description: "Welcome to the Super Admin Dashboard",
        });
        router.push('/superadmin');
      } else {
        setError(data.message || 'Invalid credentials. Please check your username and password.');
        toast({
          title: "Login Failed",
          description: "Invalid credentials provided",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFCFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093FB4]"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFFCFB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093FB4] mx-auto mb-4"></div>
          <p className="text-[#093FB4]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFCFB] via-[#FFD8D8] to-[#FFFCFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#093FB4] to-[#072B82] rounded-2xl flex items-center justify-center shadow-2xl mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#093FB4] mb-2">Super Admin Portal</h1>
          <p className="text-[#093FB4] opacity-70">Secure system administration access</p>
        </div>

        {/* Login Card */}
        <Card className="border-2 border-[#FFD8D8] bg-white shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#093FB4] to-[#072B82] text-white border-b-0">
            <CardTitle className="text-center text-xl font-bold flex items-center justify-center">
              <Lock className="h-5 w-5 mr-2" />
              Administrator Login
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#093FB4] mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-[#093FB4] opacity-50" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 border-2 border-[#FFD8D8] focus:border-[#093FB4] bg-[#FFFCFB] rounded-lg text-[#093FB4] placeholder-[#093FB4] placeholder-opacity-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#093FB4] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-[#093FB4] opacity-50" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="pl-10 pr-10 h-12 border-2 border-[#FFD8D8] focus:border-[#093FB4] bg-[#FFFCFB] rounded-lg text-[#093FB4] placeholder-[#093FB4] placeholder-opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#093FB4] opacity-50 hover:opacity-75 transition-opacity"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-[#ED3500] bg-opacity-10 border-2 border-[#ED3500] rounded-lg p-3 flex items-center">
                  <AlertCircle className="h-5 w-5 text-[#ED3500] mr-2 flex-shrink-0" />
                  <span className="text-[#ED3500] text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full h-12 bg-gradient-to-r from-[#093FB4] to-[#072B82] hover:from-[#072B82] hover:to-[#093FB4] text-white font-semibold rounded-lg shadow-lg border-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-[#FFD8D8]">
              <p className="text-center text-xs text-[#093FB4] opacity-70">
                Super Admin access is restricted to authorized personnel only.
                <br />
                All login attempts are monitored and logged.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-80 rounded-lg border border-[#FFD8D8] shadow-sm">
            <Shield className="h-4 w-4 text-[#093FB4] mr-2" />
            <span className="text-xs text-[#093FB4] opacity-70">
              Secured with enterprise-grade authentication
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 