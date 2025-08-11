/**
 * Core types for HighLevel Booking Platform
 */

export interface Resource {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  resourceId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrenceRule?: string; // RRULE format
  recurrenceParentId?: string;
  seriesId?: string;
  originalStartTime?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingException {
  id: string;
  bookingId: string;
  exceptionDate: Date;
  exceptionType: 'cancelled' | 'modified';
  newStartTime?: Date;
  newEndTime?: Date;
  newTitle?: string;
  newDescription?: string;
  createdAt: Date;
}

// Request/Response types for API

export interface CreateBookingRequest {
  resourceId: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  recurrenceRule?: string; // RRULE format
  createdBy?: string;
}

export interface CreateBookingResponse {
  success: boolean;
  booking?: Booking;
  conflicts?: ConflictingBooking[];
  suggestions?: AvailableSlot[];
  error?: string;
}

export interface ConflictingBooking {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  bookingType: 'single' | 'recurring';
  message?: string; // Optional message explaining the conflict
  localTimeInfo?: {
    startTime: {
      localDate: string;
      localTime: string;
      localDateTime: string;
      utcDateTime: string;
    };
    endTime: {
      localDate: string;
      localTime: string;
      localDateTime: string;
      utcDateTime: string;
    };
  };
}

export interface AvailabilityRequest {
  resourceId: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  duration?: number; // Duration in minutes, defaults to 60
}

export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

export interface AvailabilityResponse {
  success: boolean;
  resourceId: string;
  requestedRange: {
    startDate: Date;
    endDate: Date;
  };
  availableSlots: AvailableSlot[];
  totalSlots: number;
  error?: string;
}

export interface CancelBookingRequest {
  bookingId: string;
  cancelType: 'single' | 'series' | 'instance';
  instanceDate?: string; // Required for 'instance' type
}

export interface CancelBookingResponse {
  success: boolean;
  message: string;
  affectedInstances?: number;
  error?: string;
}

// Recurrence types
export interface RecurrencePattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number; // Every N days/weeks/months
  byWeekDay?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR']
  byMonthDay?: number[]; // [1, 15] for 1st and 15th
  count?: number; // Number of occurrences
  until?: Date; // End date
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
}

// Database connection types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

// Performance testing types
export interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

export interface SpikeTestMetrics extends LoadTestMetrics {
  peakRPS: number;
  sustainedRPS: number;
  recoveryTime: number;
}

// Utility types
export type BookingStatus = 'confirmed' | 'cancelled' | 'modified';
export type TimeSlot = {
  start: Date;
  end: Date;
};

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// Configuration types
export interface ServerConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}