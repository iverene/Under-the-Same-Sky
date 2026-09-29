const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/messages'; // Make sure port matches your backend

// Paged wall fetch. Returns { rows, nextCursor }. Tolerates the legacy
// bare-array shape so a not-yet-redeployed backend never blanks the sky.
export const fetchMessages = async ({ cursor, limit } = {}) => {
  try {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    const response = await fetch(qs ? `${API_URL}?${qs}` : API_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const body = await response.json();
    if (Array.isArray(body)) return { rows: body, nextCursor: null };
    return { rows: body.data || [], nextCursor: body.nextCursor || null };
  } catch (error) {
    console.error("API Error:", error);
    return { rows: [], nextCursor: null };
  }
};

export const sendMessage = async (messageData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });
  if (!response.ok) throw new Error('Failed to send');
  return await response.json();
};