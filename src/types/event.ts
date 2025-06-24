export type EventCategory = 'Conference' | 'Workshop' | 'Seminar' | 'Meeting' | 'General' | 'Other';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'upcoming';

export interface Event {
  _id?: string;
  ownerId: string;
  eventName: string;
  status: 'upcoming' | 'draft' | 'cancel';
  eventStartDate: string;
  eventEndDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  capacity: number;
  visitorCount: number;
  registrationDeadline: string;
  eventInformation: string;
  eventBanner?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category?: EventCategory;
  startDate: string;
  endDate: string;
  time: string;
  endTime: string;
  location: string;
  venue?: string;
  organizer?: string;
  banner?: string;
  status?: EventStatus;
  capacity?: number;
  registrationDeadline?: string;
  formId?: string;
} 