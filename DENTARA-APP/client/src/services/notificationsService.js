import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot } from "firebase/firestore";

// Listen to unread notifications for the staff
export const listenToActiveNotifications = (callback) => {
  const q = query(collection(db, "notifications"), where("isRead", "==", false));
  
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort newest first
    callback(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  });
};

// Mark a notification as read (Updates Firestore - AC Test 3)
export const markNotificationRead = async (notifId) => {
  try {
    await updateDoc(doc(db, "notifications", notifId), { isRead: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
  }
};

// Create a new notification (Triggered from Recall List - AC Test 4)
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