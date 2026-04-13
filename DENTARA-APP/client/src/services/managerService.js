import { db, storage } from "../firebase/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, deleteDoc, onSnapshot, where, getDoc, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { formatDateLocal } from "../utils/dateUtils";

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

// M6-2: Filtered KPI Trends (date range + provider) converted to Real-Time
// Replaces both getKPITrends and getFilteredKPITrends
export const listenToFilteredKPITrends = (filters = {}, callback) => {
  const { startDate, endDate, doctorId } = filters;

  // Date filtering is done client-side to avoid index errors
  const q = doctorId
    ? query(collection(db, "appointments"), where("doctorId", "==", doctorId))
    : collection(db, "appointments");

  return onSnapshot(q, (snapshot) => {
    let appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Apply date filters client-side
    if (startDate) appointments = appointments.filter(a => a.date >= startDate);
    if (endDate) appointments = appointments.filter(a => a.date <= endDate);

    // Status counts
    const statusCounts = {};
    appointments.forEach(a => {
      const s = a.status || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // Build trend data from actual date range
    const days = {};
    if (startDate && endDate) {
      // Create local dates to prevent timezone shifting
      const startParts = startDate.split('-');
      const endParts = endDate.split('-');
      const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days[formatDateLocal(d)] = 0;
      }
    } else {
      // Default: last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        days[formatDateLocal(d)] = 0;
      }
    }

    appointments.forEach(a => {
      if (a.date && days.hasOwnProperty(a.date)) {
        days[a.date]++;
      }
    });

    callback({ statusData: statusCounts, trendData: days, rawData: appointments });
  }, (error) => {
    console.error("Error fetching filtered KPI trends:", error);
    callback(null);
  });
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

// Upload Report File to Storage to Firestore (Updated for CS-1 & CS-2)
export const uploadReport = async (file, title, uploaderEmail) => {
  //Create a reference in Firebase Storage
  const storagePath = `reports/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  await addDoc(collection(db, "reports"), {
    title: title,
    fileName: file.name,
    storagePath: storagePath, // Saved to allow complete deletion later
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

// Delete Report (Updated for CS-2 Test 3 to delete from Cloud Storage too)
export const deleteReport = async (reportId) => {
  const reportRef = doc(db, "reports", reportId);
  const reportSnap = await getDoc(reportRef);

  if (reportSnap.exists()) {
    const data = reportSnap.data();
    
    // Delete the actual file from the Cloud Storage bucket
    if (data.storagePath) {
      const storageRef = ref(storage, data.storagePath);
      try {
        await deleteObject(storageRef);
      } catch (e) {
        console.error("Error deleting from storage (file may no longer exist):", e);
      }
    }
    
    // Delete the metadata document from Firestore
    await deleteDoc(reportRef);
  }
};

// ==========================================
// NEW: CLOUD DATA BACKUP FUNCTIONS (CS-3)
// ==========================================

// Gathers all patient data, converts to JSON, and uploads to cloud storage
export const triggerPatientBackup = async (triggeredByEmail) => {
  // 1. Fetch all patient records
  const patientsSnap = await getDocs(collection(db, "patients"));

  // AC Test 3: Gracefully handle an empty database
  if (patientsSnap.empty) {
    throw new Error("EMPTY_DATABASE");
  }

  // 2. Map data and convert to formatted JSON string
  const patientsData = patientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const jsonString = JSON.stringify(patientsData, null, 2);
  
  // 3. Create a Blob object from the JSON string
  const blob = new Blob([jsonString], { type: "application/json" });

  // 4. Upload the Blob to the 'backups' folder in Firebase Storage (AC Test 1)
  const fileName = `patients_backup_${Date.now()}.json`;
  const storagePath = `backups/${fileName}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(snapshot.ref);

  // 5. Save the backup event metadata to track the Last Backup Date
  const backupRef = await addDoc(collection(db, "backups"), {
    fileName: fileName,
    storagePath: storagePath,
    fileUrl: downloadURL,
    triggeredBy: triggeredByEmail,
    timestamp: new Date().toISOString()
  });

  return backupRef.id;
};

// Listens to the single most recent backup event
export const listenToLatestBackup = (callback) => {
  const q = query(collection(db, "backups"), orderBy("timestamp", "desc"), limit(1));
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      callback(snapshot.docs[0].data());
    } else {
      callback(null);
    }
  });
};