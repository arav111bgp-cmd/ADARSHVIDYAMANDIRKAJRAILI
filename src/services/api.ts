import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { handleStandaloneDemoRequest } from './standaloneDemo';

// Dynamically determine appropriate API Base URL for Web and Native Android App
export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  
  if (Capacitor.isNativePlatform()) {
    // Physical Android Device connected via USB ADB reverse or LAN
    return 'http://127.0.0.1:3001';
  }
  
  // Local Web Development
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

let activeBaseUrl: string | null = null;

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isNative = Capacitor.isNativePlatform();
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  const primaryBase = getApiBaseUrl();

  const candidateBases = envUrl 
    ? [envUrl] 
    : activeBaseUrl
      ? Array.from(new Set([activeBaseUrl, primaryBase, isNative ? 'http://127.0.0.1:3001' : 'http://localhost:3001', 'http://192.168.216.249:3001']))
      : isNative 
        ? ['http://127.0.0.1:3001', 'http://192.168.216.249:3001']
        : ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://192.168.216.249:3001'];

  const urls = Array.from(new Set(candidateBases.map((b) => `${b}${endpoint}`)));

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  let lastError: any = null;

  for (const url of urls) {
    if (isNative) {
      // Use native CapacitorHttp on Android device to bypass Chromium WebView PNA/CORS restrictions
      try {
        let parsedData: any = undefined;
        if (options.body) {
          try {
            parsedData = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          } catch (e) {
            parsedData = options.body;
          }
        }

        const capRes = await CapacitorHttp.request({
          method: (options.method || 'GET').toUpperCase(),
          url,
          headers: {
            ...defaultHeaders,
            ...(options.headers as any)
          },
          data: parsedData,
          connectTimeout: 3000,
          readTimeout: 3000
        });

        const data = capRes.data;
        const status = capRes.status;

        if (status >= 200 && status < 300) {
          const baseCandidate = candidateBases.find((b) => url.startsWith(b));
          if (baseCandidate) activeBaseUrl = baseCandidate;
          return data as T;
        }

        const errMsg = data?.error || `HTTP Error: ${status}`;
        const err: any = new Error(errMsg);
        err.status = status;
        err.data = data;
        throw err;
      } catch (error: any) {
        lastError = error;
        if (error.status) {
          // Explicit HTTP response error from server (e.g. 401 Unauthorized), do not fallback
          throw error;
        }
        console.warn(`[API CapacitorHttp Warning] Target ${url} unreachable:`, error?.message || error);
      }
    } else {
      // Use standard fetch in browser
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...defaultHeaders,
            ...options.headers
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const errMsg = data?.error || `HTTP Error: ${response.status} ${response.statusText}`;
          const err: any = new Error(errMsg);
          err.status = response.status;
          err.data = data;
          if (response.status === 404) {
            console.warn(`[API Fetch 404] Endpoint ${endpoint} returned 404 from ${url}. Falling back to Standalone Demo Engine...`);
            return handleStandaloneDemoRequest<T>(endpoint, options);
          }
          throw err;
        }

        const baseCandidate = candidateBases.find((b) => url.startsWith(b));
        if (baseCandidate) activeBaseUrl = baseCandidate;
        return data as T;
      } catch (error: any) {
        clearTimeout(timeoutId);
        lastError = error;
        if (error.status && error.status !== 404) {
          throw error;
        }
        console.warn(`[API Fetch Warning] Target ${url} unreachable or returned 404:`, error?.message || error);
      }
    }
  }

  // Network targets unreachable (USB disconnected / PC off / offline). Fallback to Standalone Demo Engine!
  console.log(`[API FALLBACK] Network server unreachable. Routing ${endpoint} to Standalone Demo Engine...`);
  try {
    return handleStandaloneDemoRequest<T>(endpoint, options);
  } catch (standaloneErr) {
    throw standaloneErr;
  }
}


