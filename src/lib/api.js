/**
 * SmartMemory Admin API Client
 * 
 * Handles all API calls to the SmartMemory backend service for superadmin operations.
 */

import { errorTracker } from './errorTracking';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001';

class SuperAdminAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('admin_access_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('admin_access_token', token);
    } else {
      localStorage.removeItem('admin_access_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('admin_access_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { ...options, headers };

    try {
      let response = await fetch(url, config);

      if (response.status === 401 && !options.__isRetry && endpoint !== '/auth/refresh') {
        const storedRefresh = localStorage.getItem('admin_refresh_token');
        
        if (storedRefresh) {
          try {
            const refreshResp = await fetch(`${this.baseURL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: storedRefresh }),
            });

            if (refreshResp.ok) {
              const refreshData = await refreshResp.json();
              this.setToken(refreshData.access_token);
              if (refreshData.refresh_token) {
                localStorage.setItem('admin_refresh_token', refreshData.refresh_token);
              }

              const retryHeaders = { ...headers, Authorization: `Bearer ${refreshData.access_token}` };
              const retryConfig = { ...config, headers: retryHeaders, __isRetry: true };
              response = await fetch(url, retryConfig);
            }
          } catch (refreshErr) {
            console.error('[API] Token refresh error:', refreshErr);
          }
        }
      }

      if (response.status === 401) {
        this.setToken(null);
        localStorage.removeItem('admin_refresh_token');
        const error = new Error('Authentication required');
        errorTracker.captureException(error, 'warning', { endpoint, status: 401 });
        throw error;
      }

      if (response.status === 403) {
        const error = new Error('Superadmin access required');
        errorTracker.captureException(error, 'warning', { endpoint, status: 403 });
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
        const error = new Error(errorData.detail || `HTTP ${response.status}`);
        errorTracker.captureException(error, 'error', {
          endpoint,
          status: response.status,
          method: options.method || 'GET',
        });
        throw error;
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    } catch (error) {
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        errorTracker.captureException(error, 'error', { endpoint, type: 'network_error' });
      }
      throw error;
    }
  }

  // ===== AUTH ENDPOINTS =====

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(data.tokens.access_token);
    localStorage.setItem('admin_refresh_token', data.tokens.refresh_token);

    return data.user;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
      localStorage.removeItem('admin_refresh_token');
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // ===== SUPERADMIN ENDPOINTS =====

  async listAllUsers(limit = 50, offset = 0, search = null) {
    let url = `/superadmin/users?limit=${limit}&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.request(url);
  }

  async getUser(userId) {
    return this.request(`/superadmin/users/${userId}`);
  }

  async updateUser(userId, updates) {
    return this.request(`/superadmin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId) {
    return this.request(`/superadmin/users/${userId}`, { method: 'DELETE' });
  }

  async impersonateUser(userId) {
    return this.request(`/superadmin/users/${userId}/impersonate`, { method: 'POST' });
  }

  async listAllTenants(limit = 50, offset = 0, search = null) {
    let url = `/superadmin/tenants?limit=${limit}&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.request(url);
  }

  async getTenant(tenantId) {
    return this.request(`/superadmin/tenants/${tenantId}`);
  }

  async updateTenant(tenantId, updates) {
    return this.request(`/superadmin/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTenant(tenantId) {
    return this.request(`/superadmin/tenants/${tenantId}`, { method: 'DELETE' });
  }

  async getTenantStats(tenantId) {
    return this.request(`/superadmin/tenants/${tenantId}/stats`);
  }

  async getSystemStats() {
    return this.request('/superadmin/stats');
  }

  async getSystemHealth() {
    return this.request('/superadmin/health');
  }

  async getBillingOverview() {
    return this.request('/superadmin/billing');
  }

  async getRevenueMetrics(period = '30d') {
    return this.request(`/superadmin/billing/revenue?period=${period}`);
  }

  async getSubscriptionMetrics() {
    return this.request('/superadmin/billing/subscriptions');
  }

  async getFeatureFlags() {
    return this.request('/superadmin/feature-flags');
  }

  async updateFeatureFlag(flagName, enabled, tenantIds = null) {
    return this.request(`/superadmin/feature-flags/${flagName}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled, tenant_ids: tenantIds }),
    });
  }

  async getActivityLogs(limit = 100, offset = 0, filters = {}) {
    let url = `/superadmin/activity?limit=${limit}&offset=${offset}`;
    if (filters.user_id) url += `&user_id=${filters.user_id}`;
    if (filters.action) url += `&action=${filters.action}`;
    if (filters.since) url += `&since=${filters.since}`;
    return this.request(url);
  }

  async getErrorLogs(limit = 100, since = null) {
    let url = `/superadmin/errors?limit=${limit}`;
    if (since) url += `&since=${since}`;
    return this.request(url);
  }

  async getDatabaseStats() {
    return this.request('/superadmin/database/stats');
  }

  async runDatabaseMaintenance(operation) {
    return this.request('/superadmin/database/maintenance', {
      method: 'POST',
      body: JSON.stringify({ operation }),
    });
  }
}

export const api = new SuperAdminAPI();
export default api;
