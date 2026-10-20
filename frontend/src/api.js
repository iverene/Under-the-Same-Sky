const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api/messages' : '/api/messages');

export const fetchMessages = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return []; // Return empty array so map doesn't crash
  }
};

export const sendMessage = async (messageData) => {
  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });
  } catch {
    // fetch only rejects on network/CORS failure, never on 4xx/5xx
    throw new Error('Network error — could not reach the server');
  }
  if (!response.ok) {
    // Surface the backend's own reason (rate limit, validation, DB) so the
    // banner tells the user what actually happened instead of "Failed to send".
    let detail = null;
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') detail = body.error;
    } catch {
      // Non-JSON error body — keep the status-only message.
    }
    throw new Error(detail ? `${detail} (${response.status})` : `Failed to send (${response.status})`);
  }
  return await response.json();
};