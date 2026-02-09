import { db } from "../firebase/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export const listenToDoctors = (callback) => {
  const q = query(
    collection(db, "users"),
    where("role", "==", "doctor")
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((d) => {
      const data = d.data();
      const fullName = (data.firstName && data.lastName) ? `${data.firstName} ${data.lastName}`: data.email || "Unknown Doctor";
      return {
        id: d.id,
        ...data,
        fullName: fullName
      };
    });
    callback(list);
  });
};
