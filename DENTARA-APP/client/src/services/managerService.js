import { db, storage } from "../firebase/firebaseConfig";
import { collection, addDoc, onSnapshot, deleteDoc, doc, getDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Upload a new report to Firebase Storage and save metadata to Firestore
export const uploadReport = async (file, title, uploaderEmail) => {
  const storagePath = `reports/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  await addDoc(collection(db, "reports"), {
    title: title,
    fileName: file.name,
    storagePath: storagePath, // Saved to allow complete deletion later
    fileUrl: downloadURL,
    type: file.type,
    uploadedBy: uploaderEmail,
    uploadedAt: new Date().toISOString()
  });
};

// Listen to all reports ordered by date
export const listenToReports = (callback) => {
  const q = query(collection(db, "reports"), orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

// Permanently delete a report from both Firestore AND Firebase Storage
export const deleteReport = async (id) => {
  const reportRef = doc(db, "reports", id);
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