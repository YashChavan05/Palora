export const API_BASE = "http://localhost:8000";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const signup = async (userData) => {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error("Signup failed");
  return response.json();
};

export const login = async (credentials) => {
  const formData = new URLSearchParams();
  formData.append("username", credentials.email);
  formData.append("password", credentials.password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });
  if (!response.ok) throw new Error("Login failed");
  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
  }
  return data;
};

export const getMe = async () => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
};

export const getCompanions = async () => {
  const response = await fetch(`${API_BASE}/companions`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch companions");
  return response.json();
};

export const createCompanion = async (companionData) => {
  // Backend expects multipart/form-data with Form fields + optional File
  const formData = new FormData();
  formData.append("name", companionData.name);
  formData.append("description", companionData.description);
  formData.append("personality", companionData.personality || "Friendly");
  formData.append("memories", JSON.stringify(companionData.memories || []));

  if (companionData.voiceFile) {
    formData.append("file", companionData.voiceFile, companionData.voiceFile.name);
  }

  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/companions`, {
    method: "POST",
    headers: {
      // Do NOT set Content-Type — browser sets it with boundary automatically
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || "Failed to create companion");
  }
  return response.json();
};

export const createChat = async (companionId) => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ companion_id: companionId }),
  });
  if (!response.ok) throw new Error("Failed to create chat");
  return response.json();
};

export const sendMessage = async (chatId, content) => {
  const response = await fetch(`${API_BASE}/chat/${chatId}/message`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      role: "user",
      content: content,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response; // return streaming response
};

export const getChatHistory = async (chatId) => {
  const response = await fetch(`${API_BASE}/chat/${chatId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch chat history");
  return response.json();
};

export const getChats = async () => {
  const response = await fetch(`${API_BASE}/chat/`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch chats");
  return response.json();
};

export const getMemories = async () => {
  const response = await fetch(`${API_BASE}/memories/`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch memories");
  return response.json();
};

export const createMemory = async (memoryData) => {
  const response = await fetch(`${API_BASE}/memories/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(memoryData),
  });
  if (!response.ok) throw new Error("Failed to create memory");
  return response.json();
};

export const updateMemory = async (memoryId, content) => {
  const response = await fetch(`${API_BASE}/memories/${memoryId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error("Failed to update memory");
  return response.json();
};

export const deleteMemory = async (memoryId) => {
  const response = await fetch(`${API_BASE}/memories/${memoryId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete memory");
  return response.json();
};

export const updateProfile = async (profileData) => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(profileData),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
};

export const getSettings = async () => {
  const response = await fetch(`${API_BASE}/auth/settings`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch settings");
  return response.json();
};

export const updateSettings = async (settingsData) => {
  const response = await fetch(`${API_BASE}/auth/settings`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(settingsData),
  });
  if (!response.ok) throw new Error("Failed to update settings");
  return response.json();
};

export const sendAnonymousMessage = async (message) => {
  const response = await fetch(`${API_BASE}/anonymous-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: message
    })
  });

  if (!response.ok) {
    throw new Error("Failed to send anonymous message");
  }

  return response.json();
};

export const getVoice = async (chatId) => {
  const response = await fetch(`${API_BASE}/chat/${chatId}/voice`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch voice");
  return response.blob();
};

export const sendVoiceChat = async (audioBlob, mimeType, companionId) => {
  const formData = new FormData();
  const ext = (mimeType || "audio/webm").includes("ogg") ? "ogg" : "webm";
  formData.append("audio", audioBlob, `voice_command.${ext}`);
  if (companionId) formData.append("companion_id", companionId);

  const response = await fetch(`${API_BASE}/voice-chat/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: formData,
  });

  if (!response.ok) throw new Error("Voice chat failed");
  return response.json();
};