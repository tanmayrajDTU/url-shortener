const BASE = import.meta.env.VITE_API_URL || '/api';

// Generate a persistent owner token on first visit, stored in localStorage.
// This scopes the dashboard to only show URLs created from this browser.
function getOwnerToken() {
  const key = 'snip_owner_token';
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

export const ownerToken = getOwnerToken();

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Owner-Token': ownerToken,   // sent on every request
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  createUrl:    (data) => req('/urls', { method: 'POST', body: JSON.stringify(data) }),
  getAllUrls:   ()     => req('/urls'),
  getUrl:       (code) => req(`/urls/${code}`),
  getAnalytics: (code) => req(`/urls/${code}/analytics`),
  deleteUrl:    (code) => req(`/urls/${code}`, { method: 'DELETE' }),
};
