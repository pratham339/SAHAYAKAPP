// api-config.js - Centralized API configuration

/**
 * Get the backend API base URL
 * - Uses VITE_BACKEND_URL environment variable if available
 * - Falls back to production URL if not set
 * - Falls back to localhost for local development
 */
export function getBackendUrl() {
  // Try to use Vite environment variable first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
    }
  }
  
  // Fallback to production URL
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://sahayakapp-k9rf.onrender.com';
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000';
}

/**
 * Make an API call to the backend
 * @param {string} endpoint - The API endpoint (e.g., '/api/auth/teacher/login')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise} Fetch promise
 */
export async function apiCall(endpoint, options = {}) {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${endpoint}`;
  
  // Ensure headers exist
  if (!options.headers) {
    options.headers = {};
  }
  
  // Set default Content-Type if not specified
  if (!options.headers['Content-Type'] && options.body) {
    options.headers['Content-Type'] = 'application/json';
  }
  
  return fetch(url, options);
}

/**
 * Make a POST request to the backend
 * @param {string} endpoint - The API endpoint
 * @param {object} data - Data to send in request body
 * @param {object} options - Additional fetch options
 * @returns {Promise} Fetch promise
 */
export async function apiPost(endpoint, data, options = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Make a GET request to the backend
 * @param {string} endpoint - The API endpoint
 * @param {object} options - Additional fetch options
 * @returns {Promise} Fetch promise
 */
export async function apiGet(endpoint, options = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'GET',
  });
}
