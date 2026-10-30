/** Where the dashboard lives. */
export const APP_URL: string = import.meta.env.VITE_APP_URL || "https://app.getcanal.app";
/** Canal API base (Firebase functions behind the app's hosting). */
export const API_BASE: string = import.meta.env.VITE_API_BASE || `${APP_URL}/api`;
