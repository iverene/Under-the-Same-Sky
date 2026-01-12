const API_URL = 'http://localhost:5000/api/messages'; // Make sure port matches your backend

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
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });
  if (!response.ok) throw new Error('Failed to send');
  return await response.json();
};