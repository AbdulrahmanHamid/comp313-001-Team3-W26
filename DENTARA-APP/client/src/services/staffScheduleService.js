import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs
} from "firebase/firestore";

// Listen to current staff member's active availability blocks (real-time)
export const listenToStaffAvailability = (staffId, callback) => {
  const q = query(
    collection(db, "availability"),
    where("staffId", "==", staffId),
    where("status", "==", "active"),
    orderBy("date", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (error) => {
    console.error("Error listening to staff availability:", error);
    callback([]);
  });
};

// Listen to ALL staff availability blocks (for read-only Staff Schedules tab)
export const listenToAllStaffAvailability = (callback) => {
  const q = query(
    collection(db, "availability"),
    where("status", "==", "active"),
    orderBy("date", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (error) => {
    console.error("Error listening to all staff availability:", error);
    callback([]);
  });
};

// Block a time slot (create new availability block)
export const blockTimeSlot = async (staffId, staffName, blockData) => {
  const { date, startTime, endTime, reason, notes } = blockData;

  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
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
    where("staffId", "==", staffId),
    where("date", "==", dateStr),
    where("status", "==", "active")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};
