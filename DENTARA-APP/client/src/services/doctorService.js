import { db } from "../firebase/firebaseConfig";
import {collection,addDoc,updateDoc,deleteDoc,doc,query,where,getDocs,getDoc,onSnapshot,orderBy} from "firebase/firestore";
import { getTodayLocal } from "../utils/dateUtils";

//  getting doctor appointment by date
export const listenToDoctorAppointments = (doctorId, date, callback) => {
    const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId),
        where("date", "==", date)
    );

    return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort by time
        list.sort((a, b) => {
            const timeA = new Date(`1970-01-01 ${a.time}`);
            const timeB = new Date(`1970-01-01 ${b.time}`);
            return timeA - timeB;
        });
        callback(list);
    });
};

// DOCTOR'S TODAY APPOINTMENTS
export const listenToDoctorTodayAppointments = (doctorId, callback) => {
    const today = getTodayLocal();
    return listenToDoctorAppointments(doctorId, today, callback);
};

// alerts
export const listenToDoctorAlerts = (doctorId, callback) => {
    const q = query(
        collection(db, "alerts"),
        where("doctorId", "==", doctorId),
        where("isAcknowledged", "==", false)
    );

    return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
    });
};

// alert managment 
export const acknowledgeAlert = async (alertId) => {
    const ref = doc(db, "alerts", alertId);
    await updateDoc(ref, { isAcknowledged: true });
};

// UPDATE APPOINTMENT STATUS
export const updateAppointmentStatus = async (appointmentId, newStatus) => {
    const ref = doc(db, "appointments", appointmentId);
    await updateDoc(ref, { status: newStatus });
};

// added new Appointment
export const addDoctorAppointment = async (data) => {
    return addDoc(collection(db, "appointments"), {
        ...data,
        status: "Confirmed",
        createdAt: new Date().toISOString(),
    });
};

// GET ALL PATIENTS
export const getAllPatients = async () => {
    const patientsSnapshot = await getDocs(collection(db, "patients"));
    return patientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

// 🔵 LISTEN TO ALL PATIENTS
export const listenToAllPatients = (callback) => {
    return onSnapshot(collection(db, "patients"), (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
    });
};

// add New Patient
export const addNewPatient = async (data) => {
    return addDoc(collection(db, "patients"), {
        ...data,
        createdAt: new Date().toISOString(),
    });
};

// get Patient By Id
export const getPatientById = async (patientId) => {
    const patientDoc = await getDoc(doc(db, "patients", patientId));
    if (patientDoc.exists()) {
        return { id: patientDoc.id, ...patientDoc.data() };
    }
    return null;
};

// get Patient Treatments 
export const getPatientTreatments = async (patientId) => {
    const q = query(
        collection(db, "treatments"),
        where("patientId", "==", patientId)
    );
    const snapshot = await getDocs(q);
    const allTreatments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

    // Filter out clinical notes, sort by date it will show in the patients page
    return allTreatments
        .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// get Patient Clinical Notes
export const getPatientClinicalNotes = async (patientId) => {
    const q = query(
        collection(db, "treatments"),
        where("patientId", "==", patientId)
    );
    const snapshot = await getDocs(q);
    const allTreatments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

    // Filter only clinical notes, sort by date
    return allTreatments
        .filter((item) => item.treatment === "Clinical Note")
        .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// add Clinical Note
export const addClinicalNote = async (patientId, patientName, doctorName, notes) => {
    return addDoc(collection(db, "treatments"), {
        patientId: patientId,
        patientName: patientName,
        date: getTodayLocal(),
        doctor: doctorName,
        treatment: "Clinical Note",
        notes: notes,
        status: "Completed",
        createdAt: new Date().toISOString(),
    });
};

// GET DOCTOR INFO
export const getDoctorInfo = async (doctorId) => {
    const userDoc = await getDoc(doc(db, "users", doctorId));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
            id: userDoc.id,
            ...userData,
            fullName: `Dr. ${userData.firstName} ${userData.lastName}`,
        };
    }
    return null;
};
