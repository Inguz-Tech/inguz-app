import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format Brazilian phone numbers: 5511985218470 → +55 (11) 98521-8470
export function formatBrazilianPhone(phone: string): string {
  // Remove @lid suffix and non-numeric characters
  const cleaned = phone.replace(/@.*$/, '').replace(/\D/g, '');
  
  // Check if it's a Brazilian number (starts with 55 and has 12-13 digits)
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const rest = cleaned.slice(4);
    
    // Format based on length (mobile: 9 digits, landline: 8 digits)
    if (rest.length === 9) {
      return `+${countryCode} (${areaCode}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    } else if (rest.length === 8) {
      return `+${countryCode} (${areaCode}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }
  
  // Return original if not matching expected format
  return phone.replace(/@.*$/, '');
}
