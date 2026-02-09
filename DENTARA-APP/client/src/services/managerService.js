import { db, storage } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

   // CLINIC KPIs
export const getClinicKPIs = async () => {
  try {
    const snapshot = await getDocs(collection(db, "appointments"));
    const appointments = snapshot.docs.map(doc => doc.data());
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === "Completed").length;
    const pending = appointments.filter(a => a.status === "Pending" || a.status === "Confirmed").length;
    const noShows = appointments.filter(a => a.status === "No-Show").length;
    const cancelled = appointments.filter(a => a.status === "Cancelled").length;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, noShows, cancelled, efficiency };
  } catch (error) {
    console.error("Error fetching Clinic KPIs:", error);
    return null;
  }
};

// for KPI DRILLDOWNS Charts & Trends
export const getKPITrends = async () => {
  try {
    const snapshot = await getDocs(collection(db, "appointments"));
    const appointments = snapshot.docs.map(doc => doc.data());

    const statusCounts = {};
    appointments.forEach(a => {
      const s = a.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    const days = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days[dateStr] = 0;
    }

    appointments.forEach(a => {
      if (a.date && days.hasOwnProperty(a.date)) {
        days[a.date]++;
      }
    });

    return { statusData: statusCounts, trendData: days, rawData: appointments };
  } catch (error) {
    console.error("Error fetching Trends:", error);
    return null;
  }
};

/* ==============================
   for GOAL MANAGEMENT
============================== */
export const listenToGoals = (callback) => {
  const q = query(collection(db, "goals"), orderBy("deadline", "asc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

export const addGoal = async (data) => {
  await addDoc(collection(db, "goals"), {
    ...data,
    status: "Active",
    createdAt: new Date().toISOString()
  });
};

// editing ALL fields
export const updateGoal = async (id, updatedData) => {
  const ref = doc(db, "goals", id);
  // Auto-update status if target is met
  let status = updatedData.status || "Active";
  if (Number(updatedData.current) >= Number(updatedData.target)) {
    status = "Achieved";
  } else {
    status = "Active";
  }
  
  await updateDoc(ref, { ...updatedData, status });
};

export const deleteGoal = async (id) => {
  await deleteDoc(doc(db, "goals", id));
};

// Listen to all alerts ordered by newest
export const listenToAllAlerts = (callback) => {
  const q = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// Create a new alert assign to Doctor
export const createAlert = async (alertData) => {
  await addDoc(collection(db, "alerts"), {
    ...alertData,
    isAcknowledged: false,
    createdAt: new Date().toISOString(),
    status: "Open"
  });
};

// update alert info
export const updateAlert = async (id, updatedData) => {
  const ref = doc(db, "alerts", id);
  await updateDoc(ref, updatedData);
};

export const resolveAlert = async (alertId) => {
  const alertRef = doc(db, "alerts", alertId);
  await updateDoc(alertRef, { status: "Resolved", resolvedAt: new Date().toISOString() });
};

// Reopen an alert
export const reopenAlert = async (alertId) => {
  const alertRef = doc(db, "alerts", alertId);
  await updateDoc(alertRef, { status: "Open", isAcknowledged: false, resolvedAt: null });
};

// Upload Report File to Storage to Firestore
export const uploadReport = async (file, title, uploaderEmail) => {
  //Create a reference in Firebase Storage
  const storageRef = ref(storage, `reports/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  await addDoc(collection(db, "reports"), {
    title: title,
    fileName: file.name,
    fileUrl: downloadURL,
    uploadedBy: uploaderEmail,
    uploadedAt: new Date().toISOString(),
    type: file.type
  });
};

// Listen to Reports List
export const listenToReports = (callback) => {
  const q = query(collection(db, "reports"), orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// Delete Report
export const deleteReport = async (reportId) => {
  await deleteDoc(doc(db, "reports", reportId));
};