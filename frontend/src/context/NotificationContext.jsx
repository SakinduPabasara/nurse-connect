import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import API from "../api/axios";
import { useAuth } from "./AuthContext";
import { connectSocket, disconnectSocket } from "../utils/socketClient";
import { notify } from "../utils/toast";

const NotificationContext = createContext({
  unreadCount: 0,
  refresh: () => {},
  notifications: [],
  addNewNotification: () => {},
});

const POLL_INTERVAL_MS = 30_000; // poll every 30 seconds

export const NotificationProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const timerRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await API.get("/notifications/unread-count");
      setUnreadCount(data.count ?? 0);
    } catch {
      // Silently ignore — don't break the app if this fails
    }
  }, [user]);

  // Expose a way to inject real-time notifications into state (used by TopBar/NotificationsPage)
  const addNewNotification = useCallback((notif) => {
    setNotifications((prev) => [notif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh(); // initial fetch

    // Poll every 5 minutes as a fallback
    timerRef.current = setInterval(refresh, 5 * 60 * 1000);

    // Connect Socket.IO
    const token = localStorage.getItem("token");
    if (token) {
      const socket = connectSocket(token);

      socket.on("notification:new", (notif) => {
        addNewNotification(notif);
        notify.success(`New Notification: ${notif.message}`);
      });

      socket.on("user:updated", (updated) => {
        if (!updated?._id || !user?._id) return;
        if (String(updated._id) === String(user._id)) {
          updateUser(updated);
        }
      });

      // Resync when reconnecting just in case changes were missed
      socket.on("connect", refresh);
    }

    return () => {
      clearInterval(timerRef.current);
      disconnectSocket();
    };
  }, [user, refresh, addNewNotification, updateUser]);

  // Reset to 0 on logout
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      disconnectSocket();
    }
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, refresh, notifications, addNewNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
