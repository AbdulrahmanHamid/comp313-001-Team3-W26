import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";

export const listenToTasks = (callback) => {
  return onSnapshot(collection(db, "tasks"), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
};

export const addTask = (data) => {
  return addDoc(collection(db, "tasks"), {
    ...data,
    status: "Pending",
    createdAt: new Date().toISOString(),
  });
};

export const updateTaskStatus = (id, status) => {
  return updateDoc(doc(db, "tasks", id), { status });
};
