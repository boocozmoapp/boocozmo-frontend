// src/services/api.ts
const API_BASE = "https://boocozmo-api.onrender.com";

// User Authentication
export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  signup: async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  },

  validateSession: async (email: string) => {
    const response = await fetch(`${API_BASE}/validate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  // Offers
  getOffers: async () => {
    const response = await fetch(`${API_BASE}/offers`);
    return response.json();
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitOffer: async (offerData: any) => {
    const response = await fetch(`${API_BASE}/submit-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerData),
    });
    return response.json();
  },

  getUserOffers: async (email: string) => {
    const response = await fetch(`${API_BASE}/my-offers?email=${encodeURIComponent(email)}`);
    return response.json();
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateOffer: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE}/offers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteOffer: async (id: number, email: string) => {
    const response = await fetch(`${API_BASE}/my-offers/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  closeDeal: async (offer_id: number) => {
    const response = await fetch(`${API_BASE}/close-deal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id }),
    });
    return response.json();
  },

  saveOffer: async (offer_id: number, saved_by: string) => {
    const response = await fetch(`${API_BASE}/save-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id, saved_by }),
    });
    return response.json();
  },

  unsaveOffer: async (offer_id: number, saved_by: string) => {
    const response = await fetch(`${API_BASE}/unsave-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offer_id, saved_by }),
    });
    return response.json();
  },

  getSavedOffers: async (email: string) => {
    const response = await fetch(`${API_BASE}/saved-offers?email=${encodeURIComponent(email)}`);
    return response.json();
  },

  // Chats
  getChats: async (userEmail: string) => {
    const response = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(userEmail)}`);
    return response.json();
  },

  getChatMessages: async (chat_id: number) => {
    const response = await fetch(`${API_BASE}/chats/${chat_id}`);
    return response.json();
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: async (messageData: any) => {
    const response = await fetch(`${API_BASE}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    });
    return response.json();
  },

  createChat: async (user1: string, user2: string, offer_id: number, title?: string) => {
    const response = await fetch(`${API_BASE}/create-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1, user2, offer_id, title }),
    });
    return response.json();
  },

  markMessagesRead: async (chat_id: number, user: string) => {
    const response = await fetch(`${API_BASE}/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, user }),
    });
    return response.json();
  },

  getUnreadCount: async (email: string) => {
    const response = await fetch(`${API_BASE}/unread-messages?email=${encodeURIComponent(email)}`);
    return response.json();
  },

  // User data
  getUsernames: async (emails: string[]) => {
    const response = await fetch(`${API_BASE}/get-usernames`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    });
    return response.json();
  },

  // Search
  searchOffers: async (query: string, price?: string) => {
    const params = new URLSearchParams({ query });
    if (price) params.append('price', price);
    const response = await fetch(`${API_BASE}/search-offers?${params}`);
    return response.json();
  },
};