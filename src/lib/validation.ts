import { z } from 'zod';

/**
 * Flexible Phone Number Regex
 * Accepts optional leading '+', digits, spaces, hyphens, dots, parentheses
 * Allows empty/blank or length 3-30
 */
export const PHONE_REGEX = /^[0-9\s\-()+.*#]{3,30}$/;

/**
 * Flexible Name Validation:
 * Accepts Arabic, Kurdish, English, unicode letters, digits, spaces, hyphens, dots, slashes, brackets.
 * Requires at least 2 characters.
 */
export const NAME_REGEX = /^[\s\S]{2,100}$/;

/**
 * Flexible Email Validation:
 * Case-insensitive, trims whitespace, standard permissive email structure.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Zod Schema for User Registration / Sign-Up
 */
export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .transform((val) => (val || '').trim())
      .refine((val) => val.length >= 2, {
        message: 'يرجى إدخال الاسم الكامل (حرفين على الأقل) / Full name must be at least 2 characters',
      }),
    email: z
      .string()
      .min(1, { message: 'البريد الإلكتروني مطلوب / Email is required' })
      .transform((val) => (val || '').trim().toLowerCase())
      .refine((val) => EMAIL_REGEX.test(val), {
        message: 'يرجى إدخال بريد إلكتروني صحيح / Please enter a valid email address',
      }),
    phoneNumber: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val || '').trim())
      .refine((val) => !val || val.length === 0 || PHONE_REGEX.test(val), {
        message: 'يرجى إدخال رقم هاتف صحيح / Please enter a valid phone number',
      }),
    password: z.string().min(6, {
      message: 'كلمة المرور يجب أن لا تقل عن 6 خانات / Password must be at least 6 characters',
    }),
    confirmPassword: z.string().optional().or(z.literal('')),
    countryCode: z
      .string()
      .transform((val) => (val || '').trim())
      .refine((val) => val.length > 0, {
        message: 'يرجى اختيار الدولة / Please select your country',
      }),
    selectedGovernorate: z
      .string()
      .transform((val) => (val || '').trim())
      .refine((val) => val.length > 0, {
        message: 'يرجى اختيار المحافظة أو المدينة / Please select your governorate or city',
      }),
    agreedToLockup: z.boolean().optional().default(true),
  })
  .refine(
    (data) => !data.confirmPassword || data.password === data.confirmPassword,
    {
      message: 'كلمات المرور غير متطابقة / Passwords do not match',
      path: ['confirmPassword'],
    }
  );

/**
 * Zod Schema for User Login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'يرجى إدخال البريد الإلكتروني / Email is required' })
    .transform((val) => (val || '').trim().toLowerCase())
    .refine((val) => EMAIL_REGEX.test(val) || val.includes('admin') || !val.includes('@'), {
      message: 'يرجى إدخال بريد إلكتروني أو اسم مستخدم صحيح / Please enter a valid email or username',
    }),
  password: z.string().min(1, {
    message: 'يرجى إدخال كلمة المرور / Password is required',
  }),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Sanitize and format phone number for storage
 */
export function formatPhoneNumber(dialCode: string = '', rawPhone: string = ''): string {
  if (!rawPhone) return '';
  const cleanPhone = rawPhone.trim().replace(/[^\d+]/g, '');
  if (!cleanPhone) return '';

  // If user already included dial code with +, don't duplicate
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }

  // Remove leading zeros if present after dialcode
  const sanitizedLocal = cleanPhone.replace(/^0+/, '');
  if (!sanitizedLocal) return '';
  return dialCode ? `${dialCode.trim()} ${sanitizedLocal}` : sanitizedLocal;
}

