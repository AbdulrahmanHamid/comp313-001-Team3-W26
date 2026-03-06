import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export const listenToTasks = (callback) => {
  return onSnapshot(collection(db, "tasks"), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
};

// Add dateStr when creating task (REQUIRED for daily wrap-up query)
// export const addTask = (data) => {
//   return addDoc(collection(db, "tasks"), {
//     ...data,
//     // expect caller to pass date: "YYYY-MM-DD"
//     status: data.status ?? "Pending",
//     createdAt: new Date().toISOString(),
//   });
// };

export const addTask = (data) => {
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

  return addDoc(collection(db, "tasks"), {
    ...data,
    date: data.date ?? today, // ✅ ADD THIS
    status: "Pending",
    createdAt: new Date().toISOString(),
  });
};
export const updateTaskStatus = (id, status) => {
  return updateDoc(doc(db, "tasks", id), { status });
};

// Listen to tasks for a specific date (YYYY-MM-DD)
export const listenToTasksByDate = (dateStr, callback) => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("date", "==", dateStr));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
};

// NEW: Update any task field (used for the "Do this task" button)
export const updateTask = (id, data) => {
  return updateDoc(doc(db, "tasks", id), data);
};