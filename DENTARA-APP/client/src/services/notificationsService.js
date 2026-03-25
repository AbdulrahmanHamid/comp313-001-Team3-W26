import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot } from "firebase/firestore";

// Listen to unread notifications for the staff
export const listenToActiveNotifications = (callback) => {
  const q = query(collection(db, "notifications"), where("isRead", "==", false));
  
  return onSnapshot(q, (snapshot) => {
    let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Only show the notification if today's date is greater than or equal to the target date.
    // If no target date exists, show it immediately.
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    
    list = list.filter(notif => {
      if (!notif.targetDate) return true;
      return todayStr >= notif.targetDate;
    });

    // Sort newest first
    callback(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  });
};

// Mark a notification as read (Updates Firestore)
export const markNotificationRead = async (notifId) => {
  try {
    await updateDoc(doc(db, "notifications", notifId), { isRead: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
  }
};

// Create a new notification (Triggered from Recall List or Comm Logs)
export const createNotification = async (data) => {
  try {
    await addDoc(collection(db, "notifications"), {
      ...data,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};