import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const VANCOUVER_TZ = 'America/Vancouver';

/**
 * Gets the current date in Vancouver as a YYYY-MM-DD string
 */
export function getVancouverDate() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VANCOUVER_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Gets the current time in Vancouver as an HH:mm string (24-hour)
 */
export function getVancouverTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', {
    timeZone: VANCOUVER_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Formats an ISO string to a human-readable Vancouver time/date string
 */
export function formatVancouverDateTime(isoString: string | null | undefined, includeTime = true) {
  if (!isoString) return '-';
  
  // If it's just a YYYY-MM-DD date string, don't let new Date() shift it due to TZ
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    if (!includeTime) return isoString;
    // If time is requested but not present in string, we can't really provide Vancouver time reliably from just a date
    return isoString;
  }

  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-CA', {
      timeZone: VANCOUVER_TZ,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
      hour12: true
    });
  } catch (e) {
    return isoString;
  }
}

/**
 * Gets the current timestamp in ISO format
 */
export function getCurrentIsoTimestamp() {
  return new Date().toISOString();
}
