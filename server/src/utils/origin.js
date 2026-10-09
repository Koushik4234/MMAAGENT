/**
 * Allows a request when:
 *  - no allow-list is configured (dev), or
 *  - there is no Origin header (non-browser client), or
 *  - the origin is on the list, or
 *  - the origin is the same host that served the request (production single-server setup).
 */
export function isOriginAllowed(origin, requestHost, allowedOrigins) {
  if (!allowedOrigins.length || !origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}
