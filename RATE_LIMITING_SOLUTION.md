# Rate Limiting Solution

## Problem
The application was experiencing "Too many requests from this IP, please try again later" errors due to excessive API calls without proper rate limiting, retry mechanisms, or request management.

## Solution Overview

### 1. Enhanced API Service (`src/services/api.ts`)

#### Request Queue and Throttling
- **RequestQueue Class**: Manages concurrent requests with a maximum limit (5 concurrent requests)
- **Request Caching**: Implements intelligent caching with TTL (Time To Live) to reduce redundant API calls
- **Queue Processing**: Automatically processes queued requests when capacity becomes available

#### Retry Mechanism with Exponential Backoff
- **Automatic Retries**: Up to 3 retry attempts for failed requests
- **Exponential Backoff**: Delays increase exponentially (1s, 2s, 4s, max 10s)
- **Smart Retry Logic**: Only retries on rate limiting (429) and server errors (5xx)
- **Request Timeout**: 30-second timeout to prevent hanging requests

#### Enhanced Error Handling
- **Rate Limit Detection**: Specifically handles 429 status codes
- **Retry-After Header**: Respects server-provided retry delays
- **User-Friendly Messages**: Converts technical errors to readable messages
- **Request Tracking**: Adds unique request IDs for debugging

### 2. Custom Hooks

#### `useApiError` Hook (`src/hooks/useApiError.ts`)
- **Centralized Error Handling**: Consistent error processing across components
- **Rate Limit Awareness**: Special handling for rate limiting errors
- **Retry Management**: Tracks retry attempts and provides retry functionality
- **Toast Notifications**: User-friendly error messages with appropriate styling

#### `useDebouncedApi` Hook (`src/hooks/useDebouncedApi.ts`)
- **Request Debouncing**: Prevents rapid successive API calls
- **Configurable Delays**: Customizable debounce timing (default 300ms)
- **Loading States**: Manages loading indicators during debounced requests
- **Cleanup Handling**: Proper cleanup to prevent memory leaks

### 3. Component Updates

#### Attendance Page (`src/pages/Attendance.tsx`)
- **Enhanced Error Handling**: Uses the new error handling hook
- **Retry Indicators**: Visual feedback during retry attempts
- **Success Reset**: Resets retry counters on successful operations
- **Improved UX**: Better loading states and error messages

## Key Features

### Request Management
- **Concurrent Request Limiting**: Maximum 5 simultaneous requests
- **Request Queuing**: Queues excess requests for later processing
- **Request Caching**: 5-minute cache for GET requests to reduce API load
- **Cache Invalidation**: Automatic cache clearing on data modifications

### Error Recovery
- **Automatic Retries**: Up to 3 attempts with exponential backoff
- **Rate Limit Handling**: Respects server retry-after headers
- **Graceful Degradation**: Continues operation even with some failed requests
- **User Feedback**: Clear indication of retry status and error messages

### Performance Optimizations
- **Request Deduplication**: Prevents duplicate requests for the same data
- **Intelligent Caching**: Different TTL for different types of data
- **Request Batching**: Queues requests to prevent overwhelming the server
- **Timeout Management**: Prevents requests from hanging indefinitely

## Configuration

### Rate Limiting Settings
```typescript
const RATE_LIMIT_CONFIG = {
  maxRetries: 3,                    // Maximum retry attempts
  baseDelay: 1000,                  // Base delay in milliseconds
  maxDelay: 10000,                  // Maximum delay in milliseconds
  retryDelayMultiplier: 2,          // Exponential backoff multiplier
  maxConcurrentRequests: 5,         // Maximum concurrent requests
  requestTimeout: 30000,            // Request timeout in milliseconds
};
```

### Cache Settings
- **Default TTL**: 5 minutes (300,000ms) for most data
- **Attendance Data**: 1 minute (60,000ms) for real-time data
- **User Data**: 5 minutes for user information
- **Statistics**: 5 minutes for dashboard statistics

## Usage Examples

### Basic API Call with Error Handling
```typescript
const { handleError, isRetrying } = useApiError();

const fetchData = async () => {
  try {
    const response = await api.getData();
    // Handle success
  } catch (error) {
    handleError(error, 'Failed to load data');
  }
};
```

### Debounced API Call
```typescript
const { data, loading, error } = useDebouncedApi(
  () => api.searchData(searchTerm),
  [searchTerm],
  { delay: 300 }
);
```

### Cache Management
```typescript
import { clearApiCache } from '../services/api';

// Clear all cached data
clearApiCache();
```

## Benefits

1. **Reduced Server Load**: Request queuing and caching minimize API calls
2. **Better User Experience**: Clear error messages and retry indicators
3. **Improved Reliability**: Automatic retry with exponential backoff
4. **Performance**: Intelligent caching reduces redundant requests
5. **Debugging**: Request tracking and detailed error logging
6. **Scalability**: Configurable limits and timeouts for different environments

## Monitoring

The solution includes comprehensive logging for:
- Rate limit violations
- Retry attempts and delays
- Request queue status
- Cache hits and misses
- Error patterns and frequencies

This information can be used to fine-tune the configuration and monitor the health of the API integration.
