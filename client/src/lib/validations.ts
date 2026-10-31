import { z } from 'zod';

/**
 * Format Zod validation errors into a key-value record for form field display.
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const pathKey = issue.path[0]?.toString();
    if (pathKey && !formatted[pathKey]) {
      formatted[pathKey] = issue.message;
    }
  }
  return formatted;
}

/**
 * 1. Landing Page Consultation Form Schema
 */
export const consultationFormSchema = z.object({
  coupleName: z
    .string()
    .trim()
    .min(1, 'Couple or partner names are required.')
    .min(3, 'Please enter at least 3 characters for the couple names.'),
  contactName: z
    .string()
    .trim()
    .min(1, 'Point of contact name is required.')
    .min(2, 'Please enter at least 2 characters for contact name.'),
  contactRelation: z.enum(['Bride', 'Groom', 'Parent', 'Family Rep']),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone or WhatsApp number is required for follow-up.')
    .refine(
      (val) => val.replace(/\D/g, '').length >= 10,
      'Please provide a valid phone number with at least 10 digits.'
    ),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required for sending the bridal dossier.')
    .email('Please enter a valid email address (e.g. couple@domain.com).'),
  cityPreference: z.enum(['Udaipur', 'Jaipur']),
  datesRough: z.string().min(1, 'Please select wedding season or dates.'),
  guestCount: z.number().int().positive(),
  budgetTier: z.string().min(1, 'Budget range is required.'),
  packagePreference: z.enum(['FULL_SERVICE', 'DAY_OF']),
  visionNotes: z.string().optional(),
});

export type ConsultationFormData = z.infer<typeof consultationFormSchema>;

/**
 * 2. Login Form Schema
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Work email is required.')
    .email('Please enter a valid work email address (e.g. user@royalknot.com).'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(6, 'Password must contain at least 6 characters.'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * 3. CRM Lead Intake Modal Schema
 */
export const leadIntakeSchema = z.object({
  coupleName: z
    .string()
    .trim()
    .min(1, 'Couple identifier or names are required.')
    .min(3, 'Please enter at least 3 characters for the couple names.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone or WhatsApp number is required.')
    .refine(
      (val) => val.replace(/\D/g, '').length >= 10,
      'Phone number must contain at least 10 digits.'
    ),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .optional()
    .or(z.literal('')),
  channel: z.string().min(1, 'Inquiry channel is required.'),
  cityPreference: z.enum(['Udaipur', 'Jaipur']),
  guestCount: z.number().int().positive().optional(),
  budgetMax: z.number().positive().optional(),
});

export type LeadIntakeData = z.infer<typeof leadIntakeSchema>;

/**
 * 4. Wedding Project Intake Schema
 */
export const weddingIntakeSchema = z.object({
  brideName: z
    .string()
    .trim()
    .min(1, "Bride's name is required.")
    .min(2, "Bride's name must be at least 2 characters."),
  groomName: z
    .string()
    .trim()
    .min(1, "Groom's name is required.")
    .min(2, "Groom's name must be at least 2 characters."),
  phone: z
    .string()
    .trim()
    .min(1, 'Contact phone number is required.')
    .refine(
      (val) => val.replace(/\D/g, '').length >= 10,
      'Phone must contain at least 10 digits.'
    ),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .optional()
    .or(z.literal('')),
  city: z.enum(['Udaipur', 'Jaipur', 'Jodhpur']),
  startDate: z.string().min(1, 'Start date is required.'),
  budget: z
    .number()
    .positive('Total budget must be a positive number greater than 0.'),
});

export type WeddingIntakeData = z.infer<typeof weddingIntakeSchema>;

/**
 * 5. Master Vendor Intake Schema
 */
export const vendorIntakeSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, 'Business name is required.')
    .min(2, 'Business name must be at least 2 characters.'),
  category: z.enum(['CATERER', 'DJ', 'DECORATOR']),
  city: z.string().min(1, 'City is required.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine(
      (val) => val.replace(/\D/g, '').length >= 10,
      'Phone must contain at least 10 digits.'
    ),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .optional()
    .or(z.literal('')),
});

export type VendorIntakeData = z.infer<typeof vendorIntakeSchema>;
