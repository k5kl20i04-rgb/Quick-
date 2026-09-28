/**
 * Secure Image Upload & Validation Module for Deposit Receipts
 *
 * Implements strict security controls:
 * 1. Binary header (Magic Numbers) inspection (allows only JPEG, PNG, WEBP)
 * 2. Strict file extension and MIME type verification (blocks .php, .exe, .svg, .html, etc.)
 * 3. File size limit enforcement (max 5MB)
 * 4. Sanitized randomized file renaming (UUIDs)
 * 5. Safe rendering policies and sanitization
 */

export const MAX_DEPOSIT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PROFILE_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface SecurityValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
  fileBuffer?: ArrayBuffer;
  sanitizedFileName?: string;
}

// Dangerous extensions strictly forbidden
const FORBIDDEN_EXTENSIONS = new Set([
  'php', 'phtml', 'php3', 'php4', 'php5', 'phps', 'phar',
  'exe', 'dll', 'so', 'bin', 'com', 'bat', 'cmd', 'sh', 'bash', 'vbs', 'scr', 'msi', 'drv',
  'svg', 'svgz', 'html', 'htm', 'xhtml', 'shtml', 'xml', 'js', 'mjs', 'jsx', 'ts', 'tsx',
  'pl', 'cgi', 'aspx', 'asp', 'jsp', 'py', 'rb', 'jar', 'vbe', 'jse', 'wsf', 'wsc'
]);

// Allowed extensions
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Inspects file binary array buffer header (Magic Numbers)
 */
export function verifyBinaryHeaderMagicNumbers(buffer: Uint8Array): { isValid: boolean; detectedMime?: string; extension?: string } {
  if (!buffer || buffer.length < 8) {
    return { isValid: false };
  }

  // 1. JPEG Magic Number: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: 'image/jpeg', extension: 'jpg' };
  }

  // 2. PNG Magic Number: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedMime: 'image/png', extension: 'png' };
  }

  // 3. WEBP Magic Number: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer.length >= 12 &&
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50    // P
  ) {
    return { isValid: true, detectedMime: 'image/webp', extension: 'webp' };
  }

  // Header failed magic number signature test
  return { isValid: false };
}

/**
 * Validates file on client side before upload / preview
 */
export async function validateDepositImageFile(file: File, lang: 'ar' | 'en' | 'ckb' = 'ar'): Promise<SecurityValidationResult> {
  const isAr = lang === 'ar';

  // 1. Check File Size Limit (Max 5MB)
  if (file.size > MAX_DEPOSIT_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: isAr
        ? `فشل التحقق من الأمان: حجم الملف (${sizeMb} ميجابايت) يتجاوز الحد الأقصى المسموح به (5 ميجابايت).`
        : `Security Error: File size (${sizeMb} MB) exceeds maximum allowed limit (5 MB).`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: isAr ? 'فشل التحقق من الأمان: الملف فارغ.' : 'Security Error: File is empty.',
    };
  }

  // 2. Check File Extension
  const nameParts = file.name.split('.');
  const rawExtension = (nameParts.length > 1 ? nameParts.pop() : '').toLowerCase().trim();

  if (FORBIDDEN_EXTENSIONS.has(rawExtension)) {
    return {
      isValid: false,
      error: isAr
        ? `حظر أمني: الامتداد (.${rawExtension}) محظور تماماً. يُسمح فقط بالصور بصيغ JPG و PNG.`
        : `Security Violation: Extension (.${rawExtension}) is strictly blocked. Only JPG and PNG allowed.`,
    };
  }

  if (!ALLOWED_EXTENSIONS.has(rawExtension)) {
    return {
      isValid: false,
      error: isAr
        ? `صيغة غير مدعومة: يُرجى اختيار صورة إيصال بصيغ (JPG, PNG) فقط.`
        : `Unsupported Format: Please select receipt image in (JPG, PNG) format only.`,
    };
  }

  // 3. Check Declared MIME Type
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: isAr
        ? `نوع الملف غير آمن (${file.type}). يُسمح بصور JPEG و PNG فقط.`
        : `Invalid MIME type (${file.type}). Only JPEG and PNG allowed.`,
    };
  }

  // 4. Binary Header Magic Numbers Inspection
  try {
    const slice = file.slice(0, 16);
    const arrayBuffer = await slice.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const magicCheck = verifyBinaryHeaderMagicNumbers(uint8Array);
    if (!magicCheck.isValid) {
      return {
        isValid: false,
        error: isAr
          ? 'فشل التحقق من التوقيع الثنائي (Magic Numbers Mismatch): الهيكل الداخلي للملف لا يطابق توقيع الصور المسموح بها.'
          : 'Security Violation: File header binary magic numbers do not match allowed image signatures.',
      };
    }

    return {
      isValid: true,
      mimeType: magicCheck.detectedMime,
      extension: magicCheck.extension,
      fileBuffer: arrayBuffer,
    };
  } catch (err) {
    return {
      isValid: false,
      error: isAr ? 'حدث خطأ أثناء قراءة البيانات الثنائية للملف.' : 'Error inspecting file binary headers.',
    };
  }
}

/**
 * Sanitizes and validates image URLs for safe rendering in <img> tags.
 * Rejects javascript:, data:text/html, script tags, SVG URLs, and unapproved protocols.
 */
export function sanitizeImageUrl(urlStr: string | null | undefined): string {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // Block malicious protocols and inline script payloads
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:image/svg+xml') ||
    lower.includes('<script') ||
    lower.includes('onerror=') ||
    lower.includes('onload=')
  ) {
    console.warn('🛡️ [Security] Blocked unsafe image URL payload:', trimmed.slice(0, 40));
    return '';
  }

  // Allow trusted data URLs (JPEG, PNG, WEBP base64 only)
  if (
    lower.startsWith('data:image/jpeg;base64,') ||
    lower.startsWith('data:image/png;base64,') ||
    lower.startsWith('data:image/jpg;base64,') ||
    lower.startsWith('data:image/webp;base64,')
  ) {
    return trimmed;
  }

  // Allow application internal secure uploads route
  if (lower.startsWith('/api/uploads/receipts/') || lower.startsWith('/api/uploads/profiles/')) {
    return trimmed;
  }

  // Allow safe HTTP/HTTPS URLs
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch {
      return '';
    }
  }

  return '';
}

/**
 * Securely uploads a validated image file to the backend isolated storage API
 */
export async function uploadDepositReceiptSecurely(
  file: File,
  lang: 'ar' | 'en' | 'ckb' = 'ar'
): Promise<{ success: boolean; url?: string; error?: string }> {
  // First client-side verification
  const validation = await validateDepositImageFile(file, lang);
  if (!validation.isValid || !validation.mimeType) {
    return { success: false, error: validation.error || 'Security check failed.' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      resolve({
        success: false,
        error: lang === 'ar' ? 'فشلت قراءة الملف.' : 'Failed to read file buffer.',
      });
    };

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;

        // Post to secure endpoint
        const resp = await fetch('/api/deposit/upload-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileData: base64Data,
            originalName: file.name,
          }),
        });

        const data = await resp.json();

        if (resp.ok && data.success && data.secureUrl) {
          resolve({
            success: true,
            url: data.secureUrl,
          });
        } else {
          resolve({
            success: false,
            error: data.error || (lang === 'ar' ? 'فشل رفع الملف إلى السيرفر' : 'Failed to upload image to server'),
          });
        }
      } catch (err: any) {
        resolve({
          success: false,
          error: err.message || 'Network error uploading receipt.',
        });
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates profile picture on client side (max 2MB, JPG/PNG/WEBP, magic numbers)
 */
export async function validateProfilePictureFile(
  file: File,
  lang: 'ar' | 'en' | 'ckb' = 'ar'
): Promise<SecurityValidationResult> {
  const isAr = lang === 'ar';

  // 1. Check File Size Limit (Max 2MB for profile pictures)
  if (file.size > MAX_PROFILE_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: isAr
        ? `فشل التحقق من الأمان: حجم الصورة الشخصية (${sizeMb} MB) يتجاوز الحد المسموح به (2 MB).`
        : `Security Error: Profile picture size (${sizeMb} MB) exceeds maximum allowed limit (2 MB).`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: isAr ? 'فشل التحقق من الأمان: الملف فارغ.' : 'Security Error: File is empty.',
    };
  }

  // 2. Check File Extension
  const nameParts = file.name.split('.');
  const rawExtension = (nameParts.length > 1 ? nameParts.pop() : '').toLowerCase().trim();

  if (FORBIDDEN_EXTENSIONS.has(rawExtension)) {
    return {
      isValid: false,
      error: isAr
        ? `حظر أمني: الامتداد (.${rawExtension}) محظور تماماً.`
        : `Security Violation: Extension (.${rawExtension}) is strictly blocked.`,
    };
  }

  if (!ALLOWED_EXTENSIONS.has(rawExtension)) {
    return {
      isValid: false,
      error: isAr
        ? `صيغة غير مدعومة: يُرجى اختيار صورة شخصية بصيغ (JPG, PNG) فقط.`
        : `Unsupported Format: Please select profile picture in (JPG, PNG) format only.`,
    };
  }

  // 3. Binary Header Magic Numbers Inspection
  try {
    const arrayBuffer = await file.slice(0, 16).arrayBuffer();
    const headerBytes = new Uint8Array(arrayBuffer);
    const magicResult = verifyBinaryHeaderMagicNumbers(headerBytes);

    if (!magicResult.isValid) {
      return {
        isValid: false,
        error: isAr
          ? `فشل فحص الأمان المتقدم: التوقيع الرقمي للحدث غير مطابق لصور JPG/PNG (Magic Numbers Mismatch).`
          : `Security Violation: Binary header validation failed (Magic Numbers Mismatch). Allowed formats: JPG, PNG.`,
      };
    }

    return {
      isValid: true,
      mimeType: magicResult.detectedMime,
      extension: magicResult.extension,
      sanitizedFileName: `avatar_${crypto.randomUUID()}.${magicResult.extension}`,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: isAr ? 'فشل فحص الأمان لملف الصورة.' : 'Failed to inspect image header.',
    };
  }
}

/**
 * Securely uploads a profile picture to backend isolated storage API
 */
export async function uploadProfilePictureSecurely(
  file: File,
  lang: 'ar' | 'en' | 'ckb' = 'ar'
): Promise<{ success: boolean; url?: string; error?: string }> {
  const validation = await validateProfilePictureFile(file, lang);
  if (!validation.isValid) {
    return { success: false, error: validation.error || 'Security check failed.' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      resolve({
        success: false,
        error: lang === 'ar' ? 'فشلت قراءة الملف.' : 'Failed to read file buffer.',
      });
    };

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;

        const resp = await fetch('/api/user/upload-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileData: base64Data,
            originalName: file.name,
          }),
        });

        const data = await resp.json();

        if (resp.ok && data.success && data.secureUrl) {
          resolve({
            success: true,
            url: data.secureUrl,
          });
        } else {
          resolve({
            success: false,
            error: data.error || (lang === 'ar' ? 'فشل رفع الصورة الشخصية' : 'Failed to upload profile picture'),
          });
        }
      } catch (err: any) {
        resolve({
          success: false,
          error: err.message || 'Network error uploading profile picture.',
        });
      }
    };

    reader.readAsDataURL(file);
  });
}
