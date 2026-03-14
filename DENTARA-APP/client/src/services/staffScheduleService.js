import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDocs
} from "firebase/firestore";

// Listen to current staff member's active availability blocks (real-time)
export const listenToStaffAvailability = (staffId, callback) => {
  // We sort and filter in Javascript instead!
  const q = query(
    collection(db, "availability"),
    where("staffId", "==", staffId)
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => b.status === "active")
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort client-side
    callback(list);
  }, (error) => {
    console.error("Error listening to staff availability:", error);
    callback([]);
  });
};

// Listen to ALL staff availability blocks 
export const listenToAllStaffAvailability = (callback) => {
  const q = collection(db, "availability");

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => b.status === "active")
      .sort((a, b) => a.date.localeCompare(b.date));
    callback(list);
  }, (error) => {
    console.error("Error listening to all staff availability:", error);
    callback([]);
  });
};

// Block a time slot + CONFLICT CHECK
export const blockTimeSlot = async (staffId, staffName, blockData) => {
  const { date, startTime, endTime, reason, notes } = blockData;

  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  //  Check if the doctor has an appointment during this time
  const aptQuery = query(
    collection(db, "appointments"),
    where("doctorId", "==", staffId)
  );
  
  const aptSnap = await getDocs(aptQuery);
  const existingAppointments = aptSnap.docs
    .map(d => d.data())
    .filter(a => a.date === date && (a.status === "Pending" || a.status === "Confirmed" || a.status === "Checked-in"));

  // Verify time overlap
  for (let apt of existingAppointments) {
    if (apt.time >= startTime && apt.time < endTime) {
      throw new Error(`Conflict! You already have an appointment scheduled at ${apt.time} on this date.`);
    }
  }

  const docRef = await addDoc(collection(db, "availability"), {
    staffId,
    staffName,
    date,
    startTime,
    endTime,
    reason,
    notes: notes || "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return docRef.id;
};

// Cancel an availability block (soft delete)
export const cancelAvailabilityBlock = async (blockId) => {
  const blockRef = doc(db, "availability", blockId);
  await updateDoc(blockRef, {
    status: "cancelled",
    updatedAt: new Date().toISOString()
  });
};

// Get availability blocks for a specific staff member on a specific date
export const getStaffAvailabilityByDate = async (staffId, dateStr) => {
  const q = query(
    collection(db, "availability"),
    where("staffId", "==", staffId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(b => b.status === "active" && b.date === dateStr);
};