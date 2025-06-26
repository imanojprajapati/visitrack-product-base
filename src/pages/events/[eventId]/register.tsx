'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/types/event';
import { Badge } from '@/types/badge';
import RegistrationLayout from '@/components/RegistrationLayout';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  isDefault: boolean;
}

interface EventForm {
  _id: string;
  eventId: string;
  eventName: string;
  fields: FormField[];
}

interface VisitorRegistrationData {
  visitorId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  eventName: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
}

type RegistrationStep = 'email' | 'otp' | 'form' | 'success';

const RegistrationPage = () => {
  const router = useRouter();
  const { eventId } = router.query;
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<RegistrationStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [event, setEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<EventForm | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [visitorData, setVisitorData] = useState<VisitorRegistrationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isExistingRegistration, setIsExistingRegistration] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchEventForm();
      fetchEventBadge();
    }
  }, [eventId]);

  // Removed Firebase initialization - using email-based OTP system

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const eventData = await response.json();
        setEvent(eventData);
      } else {
        toast({
          title: "Error",
          description: "Event not found",
          variant: "destructive",
        });
        router.push('/events');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    }
  };

  const fetchEventForm = async () => {
    try {
      const response = await fetch(`/api/forms/event/${eventId}`);
      if (response.ok) {
        const formData = await response.json();
        setEventForm(formData);
      } else {
        toast({
          title: "Error",
          description: "Registration form not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast({
        title: "Error",
        description: "Failed to load registration form",
        variant: "destructive",
      });
    }
  };

  const fetchEventBadge = async () => {
    try {
      const response = await fetch(`/api/badges/event/${eventId}`);
      if (response.ok) {
        const badgeData = await response.json();
        setBadge(badgeData);
      } else {
        console.log('No badge found for this event');
        // Badge is optional, so don't show error toast
      }
    } catch (error) {
      console.error('Error fetching badge:', error);
      // Badge is optional, so don't show error toast
    }
  };

  const handleSendOTP = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First check if visitor is already registered for this event
      const checkResponse = await fetch('/api/check-visitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          eventId 
        }),
      });

      const checkData = await checkResponse.json();

      if (checkResponse.ok && checkData.isRegistered) {
        // Visitor is already registered, redirect to success page
        setVisitorData(checkData.visitorData);
        setIsExistingRegistration(true);
        setCurrentStep('success');
        toast({
          title: "Already Registered",
          description: "You are already registered for this event. Here are your registration details.",
        });
        return;
      }

      // If not registered, proceed with OTP
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          eventName: event?.eventName 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('otp');
        setOtpTimer(60); // 60 seconds timer
        toast({
          title: "Success",
          description: "OTP sent successfully to your email address",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          otp 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // After OTP verification, try to fetch visitor data from dataset
        try {
          const visitorDataResponse = await fetch(`/api/visitor-dataset?email=${encodeURIComponent(email)}&ownerId=${encodeURIComponent(event?.ownerId || '')}`);
          
          if (visitorDataResponse.ok) {
            const visitorDataFromSet = await visitorDataResponse.json();
            
            // Pre-fill form with existing visitor data
            setFormData(prev => ({
              ...prev,
              email: email,
              fullName: visitorDataFromSet.fullName || '',
              phoneNumber: visitorDataFromSet.phoneNumber || '',
              company: visitorDataFromSet.company || '',
              city: visitorDataFromSet.city || '',
              state: visitorDataFromSet.state || '',
              country: visitorDataFromSet.country || '',
              pincode: visitorDataFromSet.pincode || ''
            }));
            
            toast({
              title: "Welcome back!",
              description: "Your information has been pre-filled. Please review and update if needed.",
            });
          } else {
            // No existing data found, just pre-fill email
            setFormData(prev => ({
              ...prev,
              email: email
            }));
            
            toast({
              title: "Success",
              description: "Email verified successfully. Please fill in your details.",
            });
          }
        } catch (visitorError) {
          console.error('Error fetching visitor data:', visitorError);
          // Continue with just email pre-filled
          setFormData(prev => ({
            ...prev,
            email: email
          }));
          
          toast({
            title: "Success",
            description: "Email verified successfully",
          });
        }
        
        setCurrentStep('form');
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (eventForm) {
      const requiredFields = eventForm.fields.filter(field => field.required);
      for (const field of requiredFields) {
        // Skip validation for source field (auto-filled) and email field (already verified)
        if (field.id === 'source' || field.id === 'email') {
          continue;
        }
        
        // Check if the field value exists and is not empty
        const fieldValue = formData[field.id];
        if (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim())) {
          toast({
            title: "Error",
            description: `${field.label} is required`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Ensure email is included in form data (it should be set during OTP verification)
    if (!formData.email) {
      setFormData(prev => ({
        ...prev,
        email: email
      }));
    }

    setIsLoading(true);
    try {
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

      // Use email from state if not in formData
      const finalEmail = formData.email || email;

      const registrationData = {
        eventId,
        eventName: event?.eventName,
        eventLocation: event?.eventLocation,
        eventStartDate: event?.eventStartDate,
        eventEndDate: event?.eventEndDate,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        company: formData.company || '',
        city: formData.city || '',
        state: formData.state || '',
        country: formData.country || '',
        pincode: formData.pincode || '',
        source: 'Website', // Default value as requested
        ...formData, // Include any additional form fields
        email: finalEmail, // Ensure email is set correctly (override any duplicates)
        visitorRegistrationDate: formattedDate, // Use YYYY-MM-DD format
        status: 'Registration'
      };

      console.log('📝 Registration data being submitted:', registrationData);
      console.log('📝 Current formData state:', formData);
      console.log('📝 Email from state:', email);

      const response = await fetch('/api/register-visitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Save/update visitor data in dataset for future use
        try {
          await fetch('/api/visitor-dataset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ownerId: event?.ownerId || '',
              fullName: formData.fullName,
              email: formData.email,
              phoneNumber: formData.phoneNumber,
              company: formData.company || '',
              city: formData.city || '',
              state: formData.state || '',
              country: formData.country || '',
              pincode: formData.pincode || ''
            }),
          });
          console.log('✅ Visitor dataset updated/created for owner:', event?.ownerId);
        } catch (datasetError) {
          console.error('Error saving visitor dataset:', datasetError);
          // Don't fail the registration if dataset save fails
        }
        
        // Store visitor data for success page
        setVisitorData({
          visitorId: result.visitorId,
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          company: formData.company || '',
          city: formData.city || '',
          state: formData.state || '',
          country: formData.country || '',
          pincode: formData.pincode || '',
          eventName: event?.eventName || '',
          eventLocation: event?.eventLocation || '',
          eventStartDate: event?.eventStartDate || '',
          eventEndDate: event?.eventEndDate || '',
          eventStartTime: event?.eventStartTime || '',
          eventEndTime: event?.eventEndTime || ''
        });

        setCurrentStep('success');
        setIsExistingRegistration(false);
        toast({
          title: "Success",
          description: "Registration completed successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to complete registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast({
        title: "Error",
        description: "Failed to complete registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const downloadQRCode = async () => {
    if (!visitorData?.visitorId) return;

    try {
      // Generate QR code with visitor ID
      const qrCodeDataURL = await QRCode.toDataURL(visitorData.visitorId, {
        width: 300,
        margin: 2,
        color: {
          dark: '#112D4E', // Use admin color palette
          light: '#FFFFFF'
        }
      });

      // Create download link
      const link = document.createElement('a');
      link.href = qrCodeDataURL;
      link.download = `visitor-qr-${visitorData.visitorId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "QR code downloaded successfully!",
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const downloadBadge = async () => {
    if (!visitorData || !badge) return;

    try {
      // Generate QR code for visitor ID
      const badgeQRCode = await QRCode.toDataURL(visitorData.visitorId, {
        width: 72, // 0.75 inch
        margin: 1,
        color: {
          dark: '#112D4E',
          light: '#FFFFFF'
        }
      });

      // Create a temporary badge element
      const badgeContainer = document.createElement('div');
      badgeContainer.style.width = '288px'; // 3 inches at 96 DPI
      badgeContainer.style.height = '384px'; // 4 inches at 96 DPI
      badgeContainer.style.backgroundColor = 'white';
      badgeContainer.style.border = '1px solid #ccc';
      badgeContainer.style.fontFamily = 'Arial, sans-serif';
      badgeContainer.style.position = 'absolute';
      badgeContainer.style.left = '-9999px';
      
      badgeContainer.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
          <!-- Row 1: Banner Image (1 inch height) -->
          <div style="width: 100%; height: 96px; background-color: #112D4E; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
            ${badge.badgeImage ? 
              `<img src="${badge.badgeImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="Banner" crossorigin="anonymous" />` :
              `<div style="color: white; font-size: 18px; font-weight: bold;">${visitorData.eventName}</div>`
            }
          </div>
          
          <!-- Row 2: QR Code (1 inch height) -->
          <div style="width: 100%; height: 96px; display: flex; align-items: center; justify-content: center; background-color: #F9F7F7;">
            <img src="${badgeQRCode}" style="width: 72px; height: 72px;" alt="QR Code" />
          </div>
          
          <!-- Row 3: Visitor Details (1.5 inch height) -->
          <div style="width: 100%; height: 144px; display: flex; align-items: center; justify-content: center; background-color: white;">
            <div style="width: 90%; height: 90%; background-color: #F9F7F7; border: 1px solid #DBE2EF; border-radius: 4px; padding: 6px; display: flex; flex-direction: column; justify-content: center; font-size: 9px; line-height: 1.2;">
              <div style="text-align: left; margin-bottom: 3px; word-break: break-all;">
                <strong style="color: #112D4E; font-size: 9px;">ID:</strong> <span style="font-size: 9px; font-family: monospace;">${visitorData.visitorId}</span>
              </div>
              <div style="text-align: left; margin-bottom: 3px;">
                <strong style="color: #112D4E; font-size: 9px;">${visitorData.fullName}</strong>
              </div>
              <div style="text-align: left; margin-bottom: 3px; font-size: 9px;">
                ${visitorData.email}
              </div>
              <div style="text-align: left; margin-bottom: 3px; font-size: 9px;">
                ${visitorData.phoneNumber}
              </div>
              <div style="text-align: left; margin-bottom: 3px; font-size: 9px;">
                <strong>${visitorData.eventName}</strong>
              </div>
              <div style="text-align: left; font-size: 9px;">
                ${visitorData.eventLocation} | ${visitorData.eventStartDate}
              </div>
            </div>
          </div>
          
          <!-- Row 4: VISITOR Label (0.5 inch height) - No border -->
          <div style="width: 100%; height: 48px; background-color: white; display: flex; align-items: center; justify-content: center; text-align: center;">
            <div style="color: #3F72AF; font-size: 24px; font-weight: bold; letter-spacing: 2px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">VISITOR</div>
          </div>
        </div>
      `;

      document.body.appendChild(badgeContainer);

      // Wait for images to load
      const images = badgeContainer.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve, reject) => {
          if (img.complete) {
            resolve(img);
          } else {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img); // Continue even if image fails to load
            // Timeout after 5 seconds
            setTimeout(() => resolve(img), 5000);
          }
        });
      });

      await Promise.all(imagePromises);

      // Convert to image
      const canvas = await html2canvas(badgeContainer, {
        width: 288,
        height: 384,
        background: 'white',
        allowTaint: true,
        useCORS: true
      });

      // Clean up
      document.body.removeChild(badgeContainer);

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `visitor-badge-${visitorData.visitorId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: "Success",
            description: "Badge downloaded successfully!",
          });
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error generating badge:', error);
      toast({
        title: "Error",
        description: "Failed to generate badge",
        variant: "destructive",
      });
    }
  };

  const renderFormField = (field: FormField) => {
    // Don't render source field as requested
    if (field.id === 'source') {
      return null;
    }

    // Determine if field should span full width (2 columns)
    const isFullWidth = field.type === 'radio' || field.id === 'fullName';
    const fieldClass = isFullWidth ? 'md:col-span-2' : '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.id} className={`space-y-2 ${fieldClass}`}>
            <Label htmlFor={field.id} className="text-sm sm:text-base font-medium text-[#112D4E]">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={field.required}
              disabled={field.id === 'email'} // Email is already verified
              className="h-10 sm:h-12 text-sm sm:text-base border-[#DBE2EF] focus:border-[#3F72AF] focus:ring-[#3F72AF] disabled:bg-[#F9F7F7] disabled:text-[#3F72AF]"
            />
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className={`space-y-3 ${fieldClass}`}>
            <Label className="text-sm sm:text-base font-medium text-[#112D4E]">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              {field.options?.map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={formData[field.id] === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-4 h-4 text-[#3F72AF] focus:ring-[#3F72AF] border-[#DBE2EF]"
                  />
                  <span className="text-sm sm:text-base text-[#112D4E]">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className={`space-y-2 ${fieldClass}`}>
            <Label htmlFor={field.id} className="text-sm sm:text-base font-medium text-[#112D4E]">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={formData[field.id] || ''}
              onValueChange={(value) => handleInputChange(field.id, value)}
            >
              <SelectTrigger className="h-10 sm:h-12 border-[#DBE2EF] focus:border-[#3F72AF] focus:ring-[#3F72AF]">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-[#3F72AF]"></div>
          <p className="mt-4 text-lg text-[#112D4E]">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Register for {event.eventName} - Visitrack</title>
        <meta name="description" content={`Register for ${event.eventName}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <RegistrationLayout badge={badge} event={event}>
        
        <div className="min-h-auto lg:min-h-[300px] bg-[#F9F7F7] py-4 sm:py-6 lg:py-8">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">

          {/* Progress Steps - One Line for All Devices */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                {['Email', 'OTP', 'Form', 'Success'].map((step, index) => {
                  const stepKeys: RegistrationStep[] = ['email', 'otp', 'form', 'success'];
                  const currentIndex = stepKeys.indexOf(currentStep);
                  const isActive = index === currentIndex;
                  const isCompleted = index < currentIndex;
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base font-medium ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-[#3F72AF] text-white'
                            : 'bg-[#DBE2EF] text-[#112D4E]'
                        }`}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <span className={`ml-1 sm:ml-2 md:ml-3 text-xs sm:text-sm md:text-base font-medium ${isActive ? 'text-[#3F72AF]' : 'text-[#112D4E]'}`}>
                        {step}
                      </span>
                      {index < 3 && <div className="w-3 sm:w-6 md:w-8 h-px bg-[#DBE2EF] mx-1 sm:mx-2 md:mx-4" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Container */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8 sm:mb-12 border border-[#DBE2EF]">
            {currentStep === 'email' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 text-[#112D4E]">Verify Your Email Address</h2>
                  <p className="text-sm sm:text-base text-[#3F72AF]">Enter your email address to receive an OTP</p>
                </div>
                
                <div className="space-y-4 max-w-md mx-auto">
                  <div>
                    <Label htmlFor="email" className="text-sm sm:text-base text-[#112D4E]">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 text-base sm:text-lg h-12 sm:h-14 border-[#DBE2EF] focus:border-[#3F72AF] focus:ring-[#3F72AF]"
                    />
                  </div>
                  
                  <Button
                    onClick={handleSendOTP}
                    disabled={isLoading || !email}
                    className="w-full h-12 sm:h-14 text-base sm:text-lg bg-[#3F72AF] hover:bg-[#112D4E] text-white"
                  >
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'otp' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 text-[#112D4E]">Verify OTP</h2>
                  <p className="text-sm sm:text-base text-[#3F72AF]">
                    Enter the 6-digit OTP sent to <span className="font-medium text-[#112D4E]">{email}</span>
                  </p>
                </div>
                
                <div className="space-y-4 max-w-md mx-auto">
                  <div>
                    <Label htmlFor="otp" className="text-sm sm:text-base text-[#112D4E]">Enter OTP *</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="mt-1 text-center text-lg sm:text-xl h-12 sm:h-14 tracking-widest border-[#DBE2EF] focus:border-[#3F72AF] focus:ring-[#3F72AF]"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('email')}
                      className="w-full sm:w-auto h-10 sm:h-12 border-[#DBE2EF] text-[#3F72AF] hover:bg-[#DBE2EF] hover:text-[#112D4E]"
                    >
                      Back
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      {otpTimer > 0 ? (
                        <span className="text-xs sm:text-sm text-[#3F72AF] text-center">
                          Resend OTP in {otpTimer}s
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleSendOTP}
                          disabled={isLoading}
                          className="w-full sm:w-auto h-10 sm:h-12 text-sm border-[#DBE2EF] text-[#3F72AF] hover:bg-[#DBE2EF] hover:text-[#112D4E]"
                        >
                          Resend OTP
                        </Button>
                      )}
                      
                      <Button
                        onClick={handleVerifyOTP}
                        disabled={isLoading || otp.length !== 6}
                        className="w-full sm:w-auto h-10 sm:h-12 bg-[#3F72AF] hover:bg-[#112D4E] text-white"
                      >
                        {isLoading ? 'Verifying...' : 'Verify OTP'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'form' && eventForm && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 text-[#112D4E]">Registration Details</h2>
                  <p className="text-sm sm:text-base text-[#3F72AF]">Please fill in your information below</p>
                </div>
                
                <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {eventForm.fields.map(renderFormField)}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-[#DBE2EF]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('otp')}
                      className="w-full sm:w-auto h-10 sm:h-12 border-[#DBE2EF] text-[#3F72AF] hover:bg-[#DBE2EF] hover:text-[#112D4E]"
                    >
                      Back
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto h-10 sm:h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Registration'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {currentStep === 'success' && visitorData && (
              <div className="text-center space-y-4 sm:space-y-6 max-w-2xl mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#112D4E] mb-2 sm:mb-4">
                    {isExistingRegistration ? 'Already Registered!' : 'Registration Completed!'}
                  </h2>
                  <p className="text-sm sm:text-base text-[#3F72AF] mb-4 sm:mb-6">
                    {isExistingRegistration 
                      ? `You are already registered for ${visitorData.eventName}. Here are your registration details and download options.`
                      : `Thank you for registering for ${visitorData.eventName}. You will receive a confirmation message shortly.`
                    }
                  </p>
                  
                  <div className="bg-[#F9F7F7] rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-left border border-[#DBE2EF]">
                    <h3 className="font-semibold mb-3 sm:mb-4 text-center text-base sm:text-lg text-[#112D4E]">Registration Details:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base text-[#3F72AF]">
                      <div className="space-y-2">
                        <p><strong className="text-[#112D4E]">Visitor ID:</strong> {visitorData.visitorId}</p>
                        <p><strong className="text-[#112D4E]">Full Name:</strong> {visitorData.fullName}</p>
                        <p><strong className="text-[#112D4E]">Email:</strong> {visitorData.email}</p>
                        <p><strong className="text-[#112D4E]">Phone Number:</strong> {visitorData.phoneNumber}</p>
                        {visitorData.company && <p><strong className="text-[#112D4E]">Company:</strong> {visitorData.company}</p>}
                        {visitorData.city && <p><strong className="text-[#112D4E]">City:</strong> {visitorData.city}</p>}
                        {visitorData.state && <p><strong className="text-[#112D4E]">State:</strong> {visitorData.state}</p>}
                        {visitorData.country && <p><strong className="text-[#112D4E]">Country:</strong> {visitorData.country}</p>}
                        {visitorData.pincode && <p><strong className="text-[#112D4E]">Pincode:</strong> {visitorData.pincode}</p>}
                      </div>
                      <div className="space-y-2">
                        <p><strong className="text-[#112D4E]">Event Name:</strong> {visitorData.eventName}</p>
                        <p><strong className="text-[#112D4E]">Event Location:</strong> {visitorData.eventLocation}</p>
                        <p><strong className="text-[#112D4E]">Event Start Date:</strong> {visitorData.eventStartDate}</p>
                        <p><strong className="text-[#112D4E]">Event End Date:</strong> {visitorData.eventEndDate}</p>
                        {visitorData.eventStartTime && <p><strong className="text-[#112D4E]">Event Start Time:</strong> {visitorData.eventStartTime}</p>}
                        {visitorData.eventEndTime && <p><strong className="text-[#112D4E]">Event End Time:</strong> {visitorData.eventEndTime}</p>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <Button
                    onClick={downloadQRCode}
                    className="w-full h-10 sm:h-12 text-sm sm:text-base bg-[#3F72AF] hover:bg-[#112D4E] text-white"
                  >
                    Download QR Code
                  </Button>
                  <Button
                    onClick={downloadBadge}
                    className="w-full h-10 sm:h-12 text-sm sm:text-base bg-[#3F72AF] hover:bg-[#112D4E] text-white"
                  >
                    Download Badge
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/events')}
                    className="w-full h-10 sm:h-12 text-sm sm:text-base border-[#DBE2EF] text-[#3F72AF] hover:bg-[#DBE2EF] hover:text-[#112D4E]"
                  >
                    Browse More Events
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </RegistrationLayout>
    </>
  );
};

export default RegistrationPage;