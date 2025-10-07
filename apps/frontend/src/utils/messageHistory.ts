export interface MessageHistoryItem {
  id: string;
  message: string;
  recipientAddress: string;
  timestamp: number;
  signature?: string;
}

const STORAGE_KEY = "solana_message_history";

export const getMessageHistory = (walletAddress: string): MessageHistoryItem[] => {
  try {
    const allHistory = localStorage.getItem(STORAGE_KEY);
    if (!allHistory) return [];

    const parsed = JSON.parse(allHistory);
    return parsed[walletAddress] || [];
  } catch (error) {
    console.error("Error reading message history:", error);
    return [];
  }
};

export const saveMessageToHistory = (walletAddress: string, message: string, recipientAddress: string, signature?: string): void => {
  try {
    const allHistory = localStorage.getItem(STORAGE_KEY);
    const parsed = allHistory ? JSON.parse(allHistory) : {};

    if (!parsed[walletAddress]) {
      parsed[walletAddress] = [];
    }

    const newMessage: MessageHistoryItem = {
      id: crypto.randomUUID(),
      message,
      recipientAddress,
      timestamp: Date.now(),
      signature,
    };

    parsed[walletAddress].unshift(newMessage);

    if (parsed[walletAddress].length > 100) {
      parsed[walletAddress] = parsed[walletAddress].slice(0, 100);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error("Error saving message to history:", error);
  }
};

export const clearMessageHistory = (walletAddress: string): void => {
  try {
    const allHistory = localStorage.getItem(STORAGE_KEY);
    if (!allHistory) return;

    const parsed = JSON.parse(allHistory);
    delete parsed[walletAddress];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error("Error clearing message history:", error);
  }
};
