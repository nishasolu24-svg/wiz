/**
 * Safe fetch helper that prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * when querying endpoints on static hosts like Cloudflare Pages or when servers return empty / HTML bodies.
 * Automatically routes /api calls to the Cloud Run backend when running on remote static hosts like Cloudflare Pages.
 */

export const CLOUD_RUN_API_BASE_URL = 'https://ais-pre-vhycugzsp3gwgy4ynpvyin-887852554651.asia-southeast1.run.app';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customApiUrl = localStorage.getItem('wizsheet_api_url');
    if (customApiUrl && customApiUrl.trim().startsWith('http')) {
      return customApiUrl.trim().replace(/\/+$/, '');
    }

    const host = window.location.hostname;
    const isLocalOrContainer = host === 'localhost' || host === '127.0.0.1' || host.includes('.run.app');
    if (!isLocalOrContainer) {
      // On Cloudflare Pages (*.pages.dev) or custom static domain, route API calls to the live Cloud Run backend
      return CLOUD_RUN_API_BASE_URL;
    }
  }

  const envApiUrl = (import.meta as any).env?.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim().startsWith('http')) {
    return envApiUrl.trim().replace(/\/+$/, '');
  }

  return '';
}

export function resolveApiUrl(path: string): string {
  if (!path.startsWith('/')) return path;
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  rawText: string;
  isJson: boolean;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    let resolvedInput = input;
    if (typeof input === 'string' && input.startsWith('/')) {
      resolvedInput = resolveApiUrl(input);
    }

    const response = await fetch(resolvedInput, init);
    const rawText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    let parsedData: T | null = null;
    let isJson = false;

    if (rawText && (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('['))) {
      try {
        parsedData = JSON.parse(rawText);
        isJson = true;
      } catch (e) {
        isJson = false;
      }
    }

    return {
      ok: response.ok && isJson,
      status: response.status,
      data: parsedData,
      rawText,
      isJson,
      error: !response.ok ? (parsedData as any)?.error || `Request failed with status ${response.status}` : undefined,
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      rawText: '',
      isJson: false,
      error: netErr?.message || 'Network error or host unreachable',
    };
  }
}
