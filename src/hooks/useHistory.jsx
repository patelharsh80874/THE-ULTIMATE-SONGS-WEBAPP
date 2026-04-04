import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import API_BASE_URL from "../config/api";

const HistoryContext = createContext(null);

export const HistoryProvider = ({ children }) => {
  const [historySongs, setHistorySongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistorySongs([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/users/history`, { withCredentials: true });
      
      if (data && data.length > 0) {
        const idsString = data.join(',');
        const saavnRes = await axios.get(`https://jiosaavn-roan.vercel.app/api/songs?ids=${idsString}`);
        // JioSaavn API might return songs in a different order, let's keep the history order
        const fetchedSongs = saavnRes.data.data;
        const orderedSongs = data.map(id => fetchedSongs.find(s => s.id === id)).filter(Boolean);
        setHistorySongs(orderedSongs);
      } else {
        setHistorySongs([]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <HistoryContext.Provider value={{ historySongs, loading, fetchHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};
