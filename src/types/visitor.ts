export interface Visitor {
  _id?: string;
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  ownerId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  source: string;
  visitorRegistrationDate: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Additional dynamic fields from forms
  [key: string]: any;
}

export interface OTP {
  _id?: string;
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
} 