// Firestore appointment + utilities file
// This file centralizes all read/write logic for the "appointments" collection
// so the rest of the app can use simple functions instead of calling Firestore directly.

import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    getDocs,
} from "firebase/firestore";

// Get the default Firestore instance for the initialized Firebase app.
// Reason: We need a single db reference that all functions in this file can reuse.
const db = getFirestore();

// Listen to all appointments in real-time
// Reason: onSnapshot gives live updates so the UI stays in sync whenever an appointment
// is added, updated, or deleted without needing manual refresh.
export const listenToAllAppointments = (callback) => {
    const appointmentsRef = collection(db, "appointments");
    const unsubscribe = onSnapshot(appointmentsRef, (snapshot) => {
        const appointmentsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        // We pass the latest list back to whatever screen is listening.
        callback(appointmentsList);
    });
    // Returning unsubscribe lets the caller stop listening when the component unmounts.
    return unsubscribe;
};

// Get appointments for a specific doctor
// Reason: Filter appointments by doctorId so a doctor can see only their own schedule.
export const getAppointmentsByDoctor = async (doctorId) => {
    const appointmentsRef = collection(db, "appointments");
    const q = query(appointmentsRef, where("doctorId", "==", doctorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

// Get appointments for a specific patient
// Reason: Filter appointments by patientId so a patient (or admin) can view
// that patient's full appointment history.
export const getAppointmentsByPatient = async (patientId) => {
    const appointmentsRef = collection(db, "appointments");
    const q = query(appointmentsRef, where("patientId", "==", patientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};

// Add new appointment
// Reason: Wrap addDoc so the rest of the app only needs to send appointmentData.
// We also stamp createdAt for tracking and sorting.
export const addNewAppointment = async (appointmentData) => {
    try {
        const appointmentsRef = collection(db, "appointments");
        const docRef = await addDoc(appointmentsRef, {
            ...appointmentData,
            createdAt: new Date().toISOString(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding appointment:", error);
        throw error;
    }
};

// Update existing appointment
// Reason: Centralized update function that also sets updatedAt
// so we know when an appointment was last modified.
export const updateAppointment = async (appointmentId, appointmentData) => {
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentRef, {
            ...appointmentData,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error updating appointment:", error);
        throw error;
    }
};

// Delete appointment
// Reason: Soft delete is not used here; this completely removes the document.
// This is used when an appointment should no longer exist in the system.
export const deleteAppointment = async (appointmentId) => {
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        await deleteDoc(appointmentRef);
    } catch (error) {
        console.error("Error deleting appointment:", error);
        throw error;
    }
};

// Listen to check-in/cancellations/no-shows
// Reason: We listen to the same appointments collection, but filter only for
// specific statuses. This is useful for a dashboard that tracks live
// check-ins, cancelled appointments, and no-shows.
export const listenToCheckinCancellations = (callback) => {
    const appointmentsRef = collection(db, "appointments");
    const unsubscribe = onSnapshot(appointmentsRef, (snapshot) => {
        const checkinList = snapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter(
                (apt) =>
                    apt.status === "In Progress" ||
                    apt.status === "Cancelled" ||
                    apt.status === "No-Show"
            );
        callback(checkinList);
    });
    return unsubscribe;
};

// NEW: Fix missing doctor names - populate doctorName for all appointments
// Reason: Some appointments may only have doctorId stored and not doctorName.
// This script backfills doctorName from the users collection so that future
// queries and UI displays don't need to look up the user document every time.
export const fixMissingDoctorNames = async () => {
    try {
        console.log("🔧 Starting to fix missing doctor names...");

        // Get all appointments
        // Reason: We need to scan every appointment to find those missing doctorName.
        const appointmentsRef = collection(db, "appointments");
        const appointmentsSnap = await getDocs(appointmentsRef);

        // Get all users
        // Reason: We build an in-memory map of doctor IDs to their names
        // so we can quickly look up the correct doctorName for each appointment.
        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);

        // Create a map of doctor ID -> doctor name
        // Reason: This avoids repeated lookups and makes updating many appointments efficient.
        const doctorMap = {};
        usersSnap.docs.forEach((doc) => {
            const user = doc.data();
            if (user.role === "doctor") {
                const fullName = user.fullName || `${user.firstName} ${user.lastName}`;
                doctorMap[doc.id] = fullName;
            }
        });

        console.log("Doctor Map:", doctorMap);

        // Update appointments that are missing doctorName
        // Reason: We only touch records that are incomplete, to avoid unnecessary writes.
        let updatedCount = 0;
        const updatePromises = [];

        appointmentsSnap.docs.forEach((doc) => {
            const apt = doc.data();

            // If missing doctorName and has doctorId and doctor exists in map
            // Reason: This condition ensures we only update when we have reliable data.
            if (!apt.doctorName && apt.doctorId && doctorMap[apt.doctorId]) {
                const updatePromise = updateDoc(doc.ref, {
                    doctorName: doctorMap[apt.doctorId],
                });
                updatePromises.push(updatePromise);
                updatedCount++;
                console.log(
                    `✅ Will update: ${apt.patientName} - Doctor: ${doctorMap[apt.doctorId]}`
                );
            }
        });

        // Wait for all updates to complete
        // Reason: Using Promise.all lets us run all Firestore updates in parallel
        // and only continue when everything is finished.
        await Promise.all(updatePromises);

        console.log(`✅ Successfully updated ${updatedCount} appointments`);
        return updatedCount;
    } catch (error) {
        console.error("Error fixing doctor names:", error);
        throw error;
    }
};
