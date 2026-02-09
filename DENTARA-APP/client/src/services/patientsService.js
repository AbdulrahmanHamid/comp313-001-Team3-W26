import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

const db = getFirestore();

export const listenToAllPatients = (callback) => {
  const patientsRef = collection(db, "patients");
  const unsubscribe = onSnapshot(patientsRef, (snapshot) => {
    const patientsList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(patientsList);
  });
  return unsubscribe;
};

export const getPatientById = async (patientId) => {
  try {
    const patientRef = doc(db, "patients", patientId);
    const patientSnap = await getDocs(query(collection(db, "patients"), where("__name__", "==", patientId)));
    if (patientSnap.docs.length > 0) {
      return { id: patientSnap.docs[0].id, ...patientSnap.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching patient:", error);
    return null;
  }
};

export const getPatientsByDoctor = async (doctorId) => {
  try {
    const patientsRef = collection(db, "patients");
    const q = query(patientsRef, where("doctorId", "==", doctorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching patients:", error);
    return [];
  }
};

export const addNewPatient = async (patientData) => {
  try {
    const patientsRef = collection(db, "patients");
    const docRef = await addDoc(patientsRef, {
      ...patientData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding patient:", error);
    throw error;
  }
};

export const updatePatient = async (patientId, patientData) => {
  try {
    const patientRef = doc(db, "patients", patientId);
    await updateDoc(patientRef, {
      ...patientData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    throw error;
  }
};

export const deletePatient = async (patientId) => {
  try {
    const patientRef = doc(db, "patients", patientId);
    await deleteDoc(patientRef);
  } catch (error) {
    console.error("Error deleting patient:", error);
    throw error;
  }
};

export const getAllPatients = async () => {
  try {
    const patientsRef = collection(db, "patients");
    const snapshot = await getDocs(patientsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching all patients:", error);
    return [];
  }
};
