export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  defaultValue?: string;
  isDefault?: boolean; // For default fields that can't be deleted
}

export interface Form {
  _id?: string;
  ownerId: string;
  formName: string;
  eventId: string;
  eventName?: string;
  fields: FormField[];
  isActive: boolean;
  submissionCount: number;
  createdBy: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFormRequest {
  formName: string;
  eventId: string;
  fields: FormField[];
}

export interface FormSubmission {
  _id?: string;
  formId: string;
  ownerId: string;
  data: Record<string, any>;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
} 