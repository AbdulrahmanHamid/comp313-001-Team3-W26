import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, where, updateDoc, doc, getDocs } from "firebase/firestore";

const db = getFirestore();

// Add a new communication log
export const addCommunicationLog = async (logData) => {
  try {
    const commsRef = collection(db, "communications");
    await addDoc(commsRef, {
      ...logData,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding communication log:", error);
    throw error;
  }
};

// Listen to all communications for the Clinic Dashboard
export const listenToAllCommunications = (callback) => {
  const commsRef = collection(db, "communications");
  const q = query(commsRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(list);
  });
};

// Update communication status (e.g., resolving a follow-up)
export const updateCommunicationStatus = async (logId, isResolved) => {
  try {
    const logRef = doc(db, "communications", logId);
    await updateDoc(logRef, {
      followUpResolved: isResolved,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating log:", error);
    throw error;
  }
};

// Fetch communications for a specific patient (Used in Doctor's Dashboard)
export const getPatientCommunications = async (patientId) => {
  try {
    const commsRef = collection(db, "communications");
    const q = query(commsRef, where("patientId", "==", patientId));
    const snapshot = await getDocs(q);
    
    // Sort manually since we are filtering by patientId
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error fetching patient communications:", error);
    return [];
  }
};