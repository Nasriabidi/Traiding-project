<template>
  <div class="admin-dashboard p-8">
    <h2 class="text-2xl font-bold mb-4">Admin Notification Sender</h2>
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Select User:</label>
      <select v-model="selectedUser" class="border rounded px-2 py-1 w-64">
        <option v-for="user in users" :key="user.uid" :value="user.uid">
          {{ user.displayName || user.email || user.uid }}
        </option>
      </select>
    </div>
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Notification Message:</label>
      <textarea v-model="message" class="border rounded px-2 py-1 w-96 h-24" placeholder="Enter notification message..."></textarea>
    </div>
    <button @click="sendNotification" :disabled="!selectedUser || !message || loading" class="bg-primary text-white px-4 py-2 rounded disabled:opacity-50">
      Send Notification
    </button>
    <div v-if="feedback" class="mt-2 text-green-600">{{ feedback }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const users = ref([]);
const selectedUser = ref('');
const message = ref('');
const loading = ref(false);
const feedback = ref('');

onMounted(async () => {
  // Fetch all users (assumes user docs have displayName/email)
  const usersSnap = await getDocs(collection(db, 'users'));
  users.value = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
});

const sendNotification = async () => {
  if (!selectedUser.value || !message.value) return;
  loading.value = true;
  feedback.value = '';
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: selectedUser.value,
      message: message.value,
      timestamp: serverTimestamp(),
    });
    feedback.value = 'Notification sent!';
    message.value = '';
  } catch (e) {
    feedback.value = 'Failed to send: ' + (e.message || e);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.admin-dashboard { max-width: 600px; margin: 0 auto; }
</style>
