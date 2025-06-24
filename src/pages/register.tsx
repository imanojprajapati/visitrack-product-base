import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    capacity: '',
    username: '',
    password: '',
    retypePassword: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.retypePassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    // Validate all fields
    if (!formData.fullName || !formData.phoneNumber || !formData.email || 
        !formData.capacity || !formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          capacity: parseInt(formData.capacity),
          username: formData.username,
          password: formData.password,
          role: 'admin' // Default role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Registration successful! You can now login.",
        });
        
        // Redirect to login or home page
        router.push('/');
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Registration failed',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - Visitrack</title>
        <meta name="description" content="Create your Visitrack account" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#4f46e5] hover:text-[#4338ca]">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <div className="mt-1">
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="visitrack-input"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <div className="mt-1">
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="visitrack-input"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="visitrack-input"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacity
                </Label>
                <div className="mt-1">
                  <select
                    id="capacity"
                    name="capacity"
                    required
                    value={formData.capacity}
                    onChange={handleChange}
                    className="visitrack-input"
                  >
                    <option value="">Select capacity</option>
                    <option value="3000">3,000</option>
                    <option value="6000">6,000</option>
                    <option value="10000">10,000</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </Label>
                <div className="mt-1">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="visitrack-input"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="mt-1">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="visitrack-input"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="retypePassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <div className="mt-1">
                  <Input
                    id="retypePassword"
                    name="retypePassword"
                    type="password"
                    required
                    value={formData.retypePassword}
                    onChange={handleChange}
                    className="visitrack-input"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full visitrack-button"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    By registering, you agree to our Terms of Service and Privacy Policy
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}