
import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from "./rounter";
import { createPinia } from 'pinia';
import { useDark, useToggle } from '@vueuse/core';

import { auth, db } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from './stores/userStore';

const isDark = useDark();
const toggleDark = useToggle(isDark);

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Restore user session from Firebase Auth on refresh
onAuthStateChanged(auth, async (user) => {
  const userStore = useUserStore();
  if (user) {
    // Optionally fetch extra user data from Firestore
    let userDoc = null;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        userDoc = docSnap.data();
      }
    } catch (e) { /* ignore */ }
    userStore.setUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      ...(userDoc || {})
    });
  } else {
    userStore.clearUser();
  }
});

app.mount('#app');