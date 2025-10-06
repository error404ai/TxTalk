const DEFAULT_API_URL = "http://localhost:8000";

export const getBrowserApiBaseUrl = () => (typeof window === "undefined" ? DEFAULT_API_URL : (window.__TXTALK_API_URL__ ?? import.meta.env.VITE_API_URL ?? DEFAULT_API_URL));

export const getServerApiBaseUrl = () => import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;

declare global {
  interface Window {
    __REACT_QUERY_STATE__?: unknown;
    __TXTALK_API_URL__?: string;
  }
}
