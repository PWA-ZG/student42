import { initializeApp } from '@firebase/app';
import {
  getFirestore,
  addDoc,
  collection,
  query,
  getDocs,
  deleteDoc,
  doc,
} from '@firebase/firestore';
import serviceAccount from './serviceAccountKey.js';

const firebaseApp = initializeApp(serviceAccount);
export const db = getFirestore(firebaseApp);

export const addPost = async (post) => {
  await addDoc(collection(db, 'posts'), post);
};

export const getPosts = async () => {
  const q = query(collection(db, 'posts'));

  const results = await getDocs(q);
  return results.docs.map((doc) => ({ ...doc.data() }));
};

export const subscribe = async (subscription) => {
  await addDoc(collection(db, 'subscriptions'), subscription);
};

export const getSubscriptions = async () => {
  const q = query(collection(db, 'subscriptions'));

  const results = await getDocs(q);
  return results.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const deleteSubscription = async (id) => {
  return await deleteDoc(doc(db, 'subscriptions', id));
};
