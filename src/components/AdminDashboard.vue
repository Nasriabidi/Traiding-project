<template>
  <div class="admin-dashboard min-h-screen flex flex-col md:flex-row">
    <!-- Sidebar -->
    <aside
      class="w-full md:w-64 bg-gray-100 dark:bg-dark p-4 md:p-6 flex flex-row md:flex-col gap-4 md:gap-8 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700"
    >
      <div class="w-full">
        <h3 class="text-lg font-bold mb-2">Sections</h3>
        <ul class="flex md:flex-col gap-4 md:gap-2 w-full">
          <li>
            <button
              @click="activeSection = 'crypto'"
              :class="[ 'hover:underline font-semibold', activeSection === 'crypto' ? 'text-primary' : '' ]"
              style="background:none;border:none;padding:0;cursor:pointer"
            >
              Live Crypto Prices
            </button>
          </li>
          <li>
            <button
              @click="activeSection = 'notification'"
              :class="[ 'hover:underline font-semibold', activeSection === 'notification' ? 'text-primary' : '' ]"
              style="background:none;border:none;padding:0;cursor:pointer"
            >
              Send Notification
            </button>
          </li>
          <li>
            <button
              @click="activeSection = 'rechargeControl'"
              :class="[ 'hover:underline font-semibold', activeSection === 'rechargeControl' ? 'text-primary' : '' ]"
              style="background:none;border:none;padding:0;cursor:pointer"
            >
              Recharge Visibility Control
            </button>
          </li>
        </ul>
      </div>
    </aside>
    <!-- Main Content -->
    <main class="flex-1 p-4 md:p-8">
      <section v-if="activeSection === 'crypto'" id="crypto-prices" class="mb-8 md:mb-10">
        <h2 class="text-2xl font-bold mb-6 md:mb-8">Live Crypto Prices</h2>
        <h3 class="text-xl font-semibold mb-2">BTC/USDT & ETH/USDT</h3>
        <div v-if="priceError" class="text-red-500 mb-2">{{ priceError }}</div>
        <div class="flex flex-col sm:flex-row gap-4 md:gap-8">
          <div>
            <span class="font-bold">BTC/USDT:</span>
            <span
              v-if="btcPrice !== null"
              @click="copyPrice('btc')"
              class="cursor-pointer select-text px-1 rounded transition-colors duration-200"
              :class="btcCopied ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'"
              title="Click to copy"
            >
              ${{ btcPrice.toFixed(2) }}
              <span v-if="btcCopied" class="ml-1 text-xs">Copied!</span>
            </span>
            <span v-else>Loading...</span>
          </div>
          <div>
            <span class="font-bold">ETH/USDT:</span>
            <span
              v-if="ethPrice !== null"
              @click="copyPrice('eth')"
              class="cursor-pointer select-text px-1 rounded transition-colors duration-200"
              :class="ethCopied ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'"
              title="Click to copy"
            >
              ${{ ethPrice.toFixed(2) }}
              <span v-if="ethCopied" class="ml-1 text-xs">Copied!</span>
            </span>
            <span v-else>Loading...</span>
          </div>
        </div>
      </section>
      <section v-if="activeSection === 'notification'" id="notification-sender" class="mb-4">
        <h2 class="text-2xl font-bold mb-6 md:mb-8">Send Notification</h2>
        <h3 class="text-xl font-semibold mb-2">Notification Sender</h3>
        <div class="mb-4">
          <label class="block mb-1 font-semibold">Select User:</label>
          <select v-model="selectedUser" class="border rounded px-2 py-1 w-full max-w-xs">
            <option v-for="user in users" :key="user.uid" :value="user.uid">
              {{ user.displayName || user.email || user.uid }}
            </option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block mb-1 font-semibold">Notification Message:</label>
          <textarea v-model="message" class="border rounded px-2 py-1 w-full max-w-lg h-24" placeholder="Enter notification message..."></textarea>
        </div>
        <button @click="sendNotification" :disabled="!selectedUser || !message || loading" class="bg-primary text-white px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto">
          Send Notification
        </button>
        <div v-if="feedback" class="mt-2 text-green-600">{{ feedback }}</div>
      </section>
      <section v-if="activeSection === 'rechargeControl'" id="recharge-control" class="mb-4">
        <h2 class="text-2xl font-bold mb-6 md:mb-8">Recharge Visibility Control</h2>
        <div class="mb-4">
          <label class="block mb-1 font-semibold">Select User (by Email):</label>
          <select v-model="selectedUserForRecharge" class="border rounded px-2 py-1 w-full max-w-xs">
            <option v-for="user in users" :key="user.uid" :value="user.uid">
              {{ user.email || user.displayName || user.uid }}
            </option>
          </select>
        </div>
        <div v-if="rechargeLoading" class="text-gray-500">Loading recharge records...</div>
        <div v-else-if="rechargeHistory.length === 0" class="text-gray-500">No recharge records found for this user.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full border text-sm">
            <thead>
              <tr class="bg-gray-100 dark:bg-dark">
                <th class="border px-2 py-1">#</th>
                <th class="border px-2 py-1">Amount</th>
                <th class="border px-2 py-1">Date</th>
                <th class="border px-2 py-1">Status</th>
                <th class="border px-2 py-1">Before</th>
                <th class="border px-2 py-1">After</th>
                <th class="border px-2 py-1">Visible</th>
                <th class="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in rechargeHistory" :key="item.id">
                <td class="border px-2 py-1">{{ idx + 1 }}</td>
                <td class="border px-2 py-1">{{ item.amount }} USDT</td>
                <td class="border px-2 py-1">{{ item.timestamp && (item.timestamp.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString() : new Date(item.timestamp).toLocaleString()) }}</td>
                <td class="border px-2 py-1">{{ item.status }}</td>
                <td class="border px-2 py-1">{{ item.balanceBefore }}</td>
                <td class="border px-2 py-1">{{ item.balanceAfter }}</td>
                <td class="border px-2 py-1">
                  <span :class="item.visible ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
                    {{ item.visible ? 'True' : 'False' }}
                  </span>
                </td>
                <td class="border px-2 py-1">
                  <button @click="setRechargeVisible(item, true)" :disabled="item.visible === true" class="px-2 py-1 bg-green-500 text-white rounded mr-1 disabled:opacity-50">True</button>
                  <button @click="setRechargeVisible(item, false)" :disabled="item.visible === false" class="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50">False</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="rechargeError" class="text-red-500 mt-2">{{ rechargeError }}</div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const users = ref([]);
const selectedUser = ref('');
const message = ref('');
const loading = ref(false);
const feedback = ref('');
const btcPrice = ref(null);
const ethPrice = ref(null);
const priceError = ref('');
let priceInterval = null;


const activeSection = ref('crypto');
const btcCopied = ref(false);
const selectedUserForRecharge = ref('');
const rechargeHistory = ref([]);
const rechargeLoading = ref(false);
const rechargeError = ref('');
const ethCopied = ref(false);

function copyPrice(type) {
  let value = '';
  if (type === 'btc' && btcPrice.value !== null) {
    value = btcPrice.value.toFixed(2);
    navigator.clipboard.writeText(value);
    btcCopied.value = true;
    setTimeout(() => (btcCopied.value = false), 1200);
  } else if (type === 'eth' && ethPrice.value !== null) {
    value = ethPrice.value.toFixed(2);
    navigator.clipboard.writeText(value);
    ethCopied.value = true;
    setTimeout(() => (ethCopied.value = false), 1200);
  }
}

onMounted(async () => {
  // Fetch all users (assumes user docs have displayName/email)
  const usersSnap = await getDocs(collection(db, 'users'));
  users.value = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  await fetchPrices();
  priceInterval = setInterval(fetchPrices, 10000);
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

async function fetchPrices() {
  try {
    priceError.value = '';
    const [btcRes, ethRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
    ]);
    const btcData = await btcRes.json();
    const ethData = await ethRes.json();
    btcPrice.value = parseFloat(btcData.price);
    ethPrice.value = parseFloat(ethData.price);
  } catch (e) {
    priceError.value = 'Failed to fetch prices.';
  }
}

onUnmounted(() => {
  if (priceInterval) clearInterval(priceInterval);
});
watch(selectedUserForRecharge, async (uid) => {
  rechargeHistory.value = [];
  rechargeError.value = '';
  if (!uid) return;
  rechargeLoading.value = true;
  try {
    console.log('Fetching recharge history for UID:', uid);
    const historyCol = collection(db, 'users', uid, 'rechargeHistory');
    const snap = await getDocs(historyCol);
    rechargeHistory.value = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.timestamp?.seconds ? a.timestamp.seconds : (a.timestamp ? new Date(a.timestamp).getTime() / 1000 : 0);
        const bTime = b.timestamp?.seconds ? b.timestamp.seconds : (b.timestamp ? new Date(b.timestamp).getTime() / 1000 : 0);
        return bTime - aTime; // Descending: latest first
      });
    console.log('Fetched records:', rechargeHistory.value);
  } catch (e) {
    console.error('Firestore error:', e);
    rechargeError.value = 'Failed to fetch recharge records.' + (e && e.message ? ' ' + e.message : '');
  } finally {
    rechargeLoading.value = false;
  }
});

async function setRechargeVisible(item, visible) {
  if (!selectedUserForRecharge.value || !item.id) return;
  try {
    const docRef = doc(db, 'users', selectedUserForRecharge.value, 'rechargeHistory', item.id);
    if (visible && !item.visible) {
      // Only add to balance if approving (visible: true) and not already visible
      // 1. Get user doc
      const userDocRef = doc(db, 'users', selectedUserForRecharge.value);
      const userSnap = await getDocs(collection(db, 'users'));
      let userBalance = 0;
      // Find the user doc
      userSnap.forEach(u => {
        if (u.id === selectedUserForRecharge.value) {
          userBalance = u.data().balance || 0;
        }
      });
      const newBalance = userBalance + Number(item.amount);
      // 2. Update user balance
      await updateDoc(userDocRef, { balance: newBalance });
      // 3. Update rechargeHistory entry: visible and balanceAfter
      await updateDoc(docRef, { visible: true, balanceAfter: newBalance,balanceBefore: userBalance   });
      item.visible = true;
      item.balanceAfter = newBalance;
    } else if (!visible && item.visible) {
      // If admin sets visible to false, subtract from balance
      const userDocRef = doc(db, 'users', selectedUserForRecharge.value);
      const userSnap = await getDocs(collection(db, 'users'));
      let userBalance = 0;
      userSnap.forEach(u => {
        if (u.id === selectedUserForRecharge.value) {
          userBalance = u.data().balance || 0;
        }
      });
      const newBalance = userBalance - Number(item.amount);
      await updateDoc(userDocRef, { balance: newBalance });
      await updateDoc(docRef, { visible: false, balanceAfter: null });
      item.visible = false;
      item.balanceAfter = null;
    } else {
      // Just update visible if toggling but not changing state
      await updateDoc(docRef, { visible });
      item.visible = visible;
    }
  } catch (e) {
    rechargeError.value = 'Failed to update visibility.';
  }
}
</script>


<style scoped>
.admin-dashboard {
  max-width: 100vw;
  margin: 0;
}
@media (max-width: 767px) {
  .admin-dashboard {
    flex-direction: column;
  }
  aside {
    border-right: none !important;
    border-bottom: 1px solid var(--tw-border-opacity, #e5e7eb);
    flex-direction: row !important;
    gap: 1rem !important;
    width: 100% !important;
    padding: 1rem !important;
  }
  aside ul {
    flex-direction: row !important;
    gap: 1rem !important;
    width: 100%;
  }
  main {
    padding: 1rem !important;
  }
}
</style>
