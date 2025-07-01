<template>
  <div class="admin-dashboard min-h-screen flex flex-col md:flex-row">
    <!-- Mobile Sidebar Toggle -->
    <button
      class="md:hidden fixed top-4 left-4 z-40 bg-primary text-white p-2 rounded focus:outline-none focus:ring"
      @click="sidebarOpen = !sidebarOpen"
      aria-label="Open sidebar"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-menu"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <!-- Overlay for mobile sidebar -->
    <div v-if="sidebarOpen" class="sidebar-overlay md:hidden" @click="sidebarOpen = false"></div>
    <!-- Sidebar -->
    <aside
      :class="[
        'sidebar-drawer',
        'bg-gray-100 dark:bg-dark border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700',
        'p-4 md:p-6 flex flex-col gap-8 md:gap-8',
        sidebarOpen ? 'sidebar-open' : '',
      ]"
      @click.self="sidebarOpen = false"
    >
      <div class="w-full">
        <h3 class="text-lg font-bold mb-2">Sections</h3>
        <ul class="flex flex-col gap-4 md:gap-2 w-full">
        <li>
          <button
            @click="activeSection = 'allUsers'; sidebarOpen = false"
            :class="[ 'hover:underline font-semibold', activeSection === 'allUsers' ? 'text-primary' : '' ]"
            style="background:none;border:none;padding:0;cursor:pointer"
          >
            All Users
          </button>
        </li>
          <li>
            <button
              @click="activeSection = 'crypto'; sidebarOpen = false"
              :class="[ 'hover:underline font-semibold', activeSection === 'crypto' ? 'text-primary' : '' ]"
              style="background:none;border:none;padding:0;cursor:pointer"
            >
              Live Crypto Prices
            </button>
          </li>
          <li>
            <button
              @click="activeSection = 'notification'; sidebarOpen = false"
              :class="[ 'hover:underline font-semibold', activeSection === 'notification' ? 'text-primary' : '' ]"
              style="background:none;border:none;padding:0;cursor:pointer"
            >
              Send Notification
            </button>
          </li>
      <li>
        <button
          @click="activeSection = 'rechargeControl'; sidebarOpen = false"
          :class="[ 'hover:underline font-semibold', activeSection === 'rechargeControl' ? 'text-primary' : '' ]"
          style="background:none;border:none;padding:0;cursor:pointer"
        >
          Recharge Visibility Control
        </button>
      </li>
      <li>
        <button
          @click="activeSection = 'withdrawControl'; sidebarOpen = false"
          :class="[ 'hover:underline font-semibold', activeSection === 'withdrawControl' ? 'text-primary' : '' ]"
          style="background:none;border:none;padding:0;cursor:pointer"
        >
          Withdraw Request Control
        </button>
      </li>
          <li>
            <button
              @click="activeSection = 'sessionControl'; sidebarOpen = false"
              :class="[ 'hover:underline font-semibold', activeSection === 'sessionControl' ? 'text-primary' : '' ]"
              style="background:none;border:none;padding:0;cursor:pointer"
            >
              Session Control
            </button>
          </li>
          <li>
            <button
              @click="activeSection = 'allowSessionControl'; sidebarOpen = false"
              :class="[ 'hover:underline font-semibold', activeSection === 'allowSessionControl' ? 'text-primary' : '' ]"
              style="background:none;border:none;padding:0;cursor:pointer"
            >
              Allow Trading Control
            </button>
          </li>
        </ul>
      </div>
    </aside>
    <!-- Main Content -->
    <section v-if="activeSection === 'allUsers'" id="all-users" class="mb-8 md:mb-10">
      <h2 class="text-2xl font-bold mb-6 md:mb-8">All Users</h2>
      <div v-if="users.length === 0" class="text-gray-500">No users found.</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full border text-sm">
          <thead>
            <tr class="bg-gray-100 dark:bg-dark">
              <th class="border px-2 py-1">#</th>
              <th class="border px-2 py-1">First Name</th>
              <th class="border px-2 py-1">Last Name</th>
              <th class="border px-2 py-1">Email</th>
              <th class="border px-2 py-1">Balance</th>
              <th class="border px-2 py-1">Total Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, idx) in users" :key="user.uid">
              <td class="border px-2 py-1">{{ idx + 1 }}</td>
              <td class="border px-2 py-1">{{ user.firstName || '' }}</td>
              <td class="border px-2 py-1">{{ user.lastName || '' }}</td>
              <td class="border px-2 py-1">{{ user.email || '' }}</td>
              <td class="border px-2 py-1">{{ user.balance ?? 0 }}</td>
              <td class="border px-2 py-1">{{ user.totalprofit ?? 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <main class="flex-1 p-4 md:p-8">
      <!-- Withdraw Request Control Section (moved from sidebar) -->
      <section v-if="activeSection === 'withdrawControl'" id="withdraw-control" class="mb-4">
        <h2 class="text-2xl font-bold mb-6 md:mb-8">Withdraw Request Control</h2>
        <div class="mb-4">
          <label class="block mb-1 font-semibold">Select User (by Email):</label>
          <select v-model="selectedUserForWithdraw" class="border rounded px-2 py-1 w-full max-w-xs">
            <option v-for="user in users" :key="user.uid" :value="user.uid">
              {{ user.email || user.displayName || user.uid }}
            </option>
          </select>
        </div>
        <div v-if="withdrawLoading" class="text-gray-500">Loading withdraw requests...</div>
        <div v-else-if="withdrawHistory.length === 0" class="text-gray-500">No withdraw requests found for this user.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full border text-sm">
            <thead>
              <tr class="bg-gray-100 dark:bg-dark">
                <th class="border px-2 py-1">#</th>
                <th class="border px-2 py-1">Amount</th>
                <th class="border px-2 py-1">Date</th>
                <th class="border px-2 py-1">Payment Method</th>
                <th class="border px-2 py-1">Wallet Address</th>
                <th class="border px-2 py-1">Status</th>
                <th class="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in withdrawHistory" :key="item.id">
                <td class="border px-2 py-1">{{ idx + 1 }}</td>
                <td class="border px-2 py-1">${{ Number(item.amount).toFixed(2) }}</td>
                <td class="border px-2 py-1">{{ item.createdAt && item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : '-' }}</td>
                <td class="border px-2 py-1">{{ item.paymentMethod }}</td>
                <td class="border px-2 py-1">{{ item.walletAddress }}</td>
                <td class="border px-2 py-1">
                  <span :class="{
                    'text-yellow-500 font-bold': item.status === 'pending',
                    'text-green-600 font-bold': item.status === 'approved',
                    'text-red-500 font-bold': item.status === 'rejected'
                  }">{{ item.status }}</span>
                </td>
                <td class="border px-2 py-1">
                  <button @click="setWithdrawStatus(item, 'approved')" :disabled="item.status === 'approved'" class="px-2 py-1 bg-green-500 text-white rounded mr-1 disabled:opacity-50">Approve</button>
                  <button @click="setWithdrawStatus(item, 'rejected')" :disabled="item.status === 'rejected'" class="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50">Reject</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="withdrawError" class="text-red-500 mt-2">{{ withdrawError }}</div>
        <div v-if="withdrawFeedback" class="text-green-600 mt-2">{{ withdrawFeedback }}</div>
      </section>
      <!-- Session Control Section -->
      <section v-if="activeSection === 'sessionControl'" id="session-control" class="mb-8 md:mb-10">
        <h2 class="text-2xl font-bold mb-6 md:mb-8">Session Control</h2>
        <!-- Calculator for Final Price, only if user and session selected -->
        <div v-if="selectedSessionUser && filteredLiveSessions.length > 0" class="mb-6 p-4 bg-gray-50 dark:bg-dark rounded border border-gray-200 dark:border-gray-700 max-w-xl">
          <h3 class="font-semibold mb-2">Final Price Calculator</h3>
          <div class="mb-2">
            <label class="block text-sm font-semibold mb-1">Select Live Session:</label>
            <select v-model="selectedCalcSessionId" class="border rounded px-2 py-1 w-full max-w-xs">
              <option v-for="session in filteredLiveSessions" :key="session.id" :value="session.id">
                {{ session.cryptopair }} | {{ session.type }} | Leverage: {{ session.leverage }}
              </option>
            </select>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div>
              <label class="block text-sm font-semibold mb-1">Current Price</label>
              <input type="number" v-model.number="calcCurrentPrice" class="border rounded px-2 py-1 w-32" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Profit</label>
              <input type="number" v-model.number="calcProfit" class="border rounded px-2 py-1 w-32" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Final Price</label>
              <input type="number" :value="calcFinalPrice" class="border rounded px-2 py-1 w-32 bg-gray-100 dark:bg-gray-800" readonly />
            </div>
            <button @click="copyCalcFinalPrice" class="px-3 py-1 bg-primary text-white rounded" :disabled="!calcFinalPrice">Copy</button>
          </div>
          <div v-if="calcCopySuccess" class="text-green-600 mt-2 text-sm">Copied!</div>
        </div>
        <div class="mb-4">
          <label class="block mb-1 font-semibold">Select User (by Email):</label>
          <select v-model="selectedSessionUser" class="border rounded px-2 py-1 w-full max-w-xs">
            <option v-for="user in users" :key="user.uid" :value="user.uid">
              {{ user.email || user.displayName || user.uid }}
            </option>
          </select>
        </div>
        <div v-if="sessionLoading" class="text-gray-500 mb-2">Loading live sessions...</div>
        <div v-else-if="!selectedSessionUser" class="text-gray-500 mb-2">Please select a user to view live sessions.</div>
        <div v-else-if="filteredLiveSessions.length === 0" class="text-gray-500 mb-2">No live sessions found for this user.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full border text-sm">
            <thead>
              <tr class="bg-gray-100 dark:bg-dark">
                <th class="border px-2 py-1">Current Price</th>
                <th class="border px-2 py-1">Profit</th>
                <th class="border px-2 py-1">Final Price</th>
                <th class="border px-2 py-1">allowendsession</th>
                <th class="border px-2 py-1">stop</th>
                <th class="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in filteredLiveSessions" :key="session.id">
                <td class="border px-2 py-1">{{ session.currentprice ?? 'Loading...' }}</td>
                <td class="border px-2 py-1">
                  <input type="number" v-model.number="session._editProfit" class="border rounded px-1 py-0.5 w-20" />
                </td>
                <td class="border px-2 py-1">
                  <input type="number" v-model.number="session._editFinalPrice" class="border rounded px-1 py-0.5 w-20" />
                </td>
                <td class="border px-2 py-1">
                  <button @click="updateSessionField(session, 'allowendsession', !session.allowendsession)" :disabled="sessionUpdatingId === session.id" class="px-2 py-1 rounded" :class="session.allowendsession ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
                    {{ session.allowendsession ? 'True' : 'False' }}
                  </button>
                </td>
                <td class="border px-2 py-1">
                  <button @click="updateSessionField(session, 'stop', !session.stop)" :disabled="sessionUpdatingId === session.id" class="px-2 py-1 rounded" :class="session.stop ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
                    {{ session.stop ? 'True' : 'False' }}
                  </button>
                </td>
                <td class="border px-2 py-1">
                  <button @click="saveSessionEdits(session)" :disabled="sessionUpdatingId === session.id" class="px-2 py-1 bg-primary text-white rounded disabled:opacity-50">Save</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="sessionError" class="text-red-500 mt-2">{{ sessionError }}</div>
        <div v-if="sessionFeedback" class="text-green-600 mt-2">{{ sessionFeedback }}</div>
      </section>
      <section v-if="activeSection === 'allowSessionControl'" id="allow-session-control" class="mb-4">
        <h2 class="text-2xl font-bold mb-6 md:mb-8">Allow Trading Control</h2>
        <div class="mb-4">
          <label class="block mb-1 font-semibold">Select User (by Email):</label>
          <select v-model="selectedUserForAllowSession" class="border rounded px-2 py-1 w-full max-w-xs">
            <option v-for="user in users" :key="user.uid" :value="user.uid">
              {{ user.email || user.displayName || user.uid }}
            </option>
          </select>
        </div>
        <div v-if="selectedUserForAllowSession">
          <div class="flex items-center gap-4 mb-2">
            <span class="font-semibold">Allow Trading:</span>
            <button
              @click="setAllowSession(true)"
              :disabled="getAllowSession(selectedUserForAllowSession) === true || allowSessionLoading"
              class="px-2 py-1 bg-green-500 text-white rounded disabled:opacity-50"
            >
              True
            </button>
            <button
              @click="setAllowSession(false)"
              :disabled="getAllowSession(selectedUserForAllowSession) === false || allowSessionLoading"
              class="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50"
            >
              False
            </button>
            <span v-if="allowSessionLoading" class="text-gray-500 ml-2">Updating...</span>
          </div>
          <div class="mt-1">
            <span class="font-semibold">Current Value:</span>
            <span :class="getAllowSession(selectedUserForAllowSession) ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
              {{ getAllowSession(selectedUserForAllowSession) ? 'True' : 'False' }}
            </span>
          </div>
        </div>
        <div v-if="allowSessionError" class="text-red-500 mt-2">{{ allowSessionError }}</div>
        <div v-if="allowSessionFeedback" class="text-green-600 mt-2">{{ allowSessionFeedback }}</div>
      </section>
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

const sidebarOpen = ref(false);

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';




const users = ref([]);
const userMap = ref({});
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
const selectedUserForAllowSession = ref('');
const allowSessionLoading = ref(false);
const allowSessionError = ref('');
const allowSessionFeedback = ref('');

// Session Control State
const liveSessions = ref([]);
const sessionLoading = ref(false);
const sessionError = ref('');
const sessionFeedback = ref('');
const sessionUpdatingId = ref('');
const selectedSessionUser = ref('');

// Calculator state for final price, auto-fills from selected session
const selectedCalcSessionId = ref('');
const calcCurrentPrice = ref(0);
const calcProfit = ref(0);
const calcCopySuccess = ref(false);
const calcFinalPrice = computed(() => {
  if (typeof calcCurrentPrice.value === 'number' && typeof calcProfit.value === 'number') {
    return calcCurrentPrice.value + calcProfit.value;
  }
  return '';
});

// Define filteredLiveSessions before any watch that uses it
const filteredLiveSessions = computed(() => {
  if (!selectedSessionUser.value) return [];
  return liveSessions.value.filter(s => s.userId === selectedSessionUser.value);
});

// Watch for session/user change to auto-fill calculator
watch([selectedSessionUser, filteredLiveSessions], ([user, sessions]) => {
  if (user && sessions.length > 0) {
    selectedCalcSessionId.value = sessions[0].id;
  } else {
    selectedCalcSessionId.value = '';
    calcCurrentPrice.value = 0;
    calcProfit.value = 0;
  }
});

watch(selectedCalcSessionId, (id) => {
  const session = filteredLiveSessions.value.find(s => s.id === id);
  if (session) {
    calcCurrentPrice.value = typeof session.currentprice === 'number' ? session.currentprice : 0;
    calcProfit.value = typeof session.profit === 'number' ? session.profit : 0;
  }
});

function copyCalcFinalPrice() {
  if (calcFinalPrice.value !== '' && !isNaN(calcFinalPrice.value)) {
    navigator.clipboard.writeText(calcFinalPrice.value.toString());
    calcCopySuccess.value = true;
    setTimeout(() => (calcCopySuccess.value = false), 1200);
  }
}


function getUserEmail(uid) {
  const user = userMap.value[uid] || users.value.find(u => u.uid === uid);
  return user ? (user.email || user.displayName || user.uid) : uid;
}

function updateSessionField(session, field, value) {
  sessionUpdatingId.value = session.id;
  sessionError.value = '';
  sessionFeedback.value = '';
  const sessionRef = doc(db, 'traidsession', session.id);
  updateDoc(sessionRef, { [field]: value })
    .then(() => {
      session[field] = value;
      sessionFeedback.value = 'Session updated!';
    })
    .catch(e => {
      sessionError.value = 'Failed to update: ' + (e.message || e);
    })
    .finally(() => {
      sessionUpdatingId.value = '';
      setTimeout(() => (sessionFeedback.value = ''), 1200);
    });
}

function saveSessionEdits(session) {
  sessionUpdatingId.value = session.id;
  sessionError.value = '';
  sessionFeedback.value = '';
  const sessionRef = doc(db, 'traidsession', session.id);
  const updates = {};
  if (typeof session._editProfit === 'number') updates.profit = session._editProfit;
  if (typeof session._editFinalPrice === 'number') updates.finalprice = session._editFinalPrice;
  updateDoc(sessionRef, updates)
    .then(() => {
      if (typeof session._editProfit === 'number') session.profit = session._editProfit;
      if (typeof session._editFinalPrice === 'number') session.finalprice = session._editFinalPrice;
      sessionFeedback.value = 'Session values saved!';
    })
    .catch(e => {
      sessionError.value = 'Failed to save: ' + (e.message || e);
    })
    .finally(() => {
      sessionUpdatingId.value = '';
      setTimeout(() => (sessionFeedback.value = ''), 1200);
    });
}

function getAllowSession(uid) {
  const user = users.value.find(u => u.uid === uid);
  return user ? user.allowsession === true : false;
}

async function setAllowSession(val) {
  if (!selectedUserForAllowSession.value) return;
  allowSessionLoading.value = true;
  allowSessionError.value = '';
  allowSessionFeedback.value = '';
  try {
    const userDocRef = doc(db, 'users', selectedUserForAllowSession.value);
    await updateDoc(userDocRef, { allowsession: val });
    // Update local users array
    const idx = users.value.findIndex(u => u.uid === selectedUserForAllowSession.value);
    if (idx !== -1) users.value[idx].allowsession = val;
    allowSessionFeedback.value = 'Allow trading updated!';
  } catch (e) {
    allowSessionError.value = 'Failed to update: ' + (e.message || e);
  } finally {
    allowSessionLoading.value = false;
    setTimeout(() => (allowSessionFeedback.value = ''), 1500);
  }
}

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
  userMap.value = {};
  users.value.forEach(u => { userMap.value[u.uid] = u; });
  await fetchPrices();
  priceInterval = setInterval(fetchPrices, 10000);

  // Fetch live sessions (sessionend == false)
  sessionLoading.value = true;
  try {
    const q = query(collection(db, 'traidsession'), where('sessionend', '==', false));
    // Use onSnapshot for live updates
    onSnapshot(q, (snap) => {
      liveSessions.value = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          _editProfit: typeof data.profit === 'number' ? data.profit : 0,
          _editFinalPrice: typeof data.finalprice === 'number' ? data.finalprice : 0,
        };
      });
    });
  } catch (e) {
    sessionError.value = 'Failed to fetch live sessions.';
  } finally {
    sessionLoading.value = false;
  }
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

import { getDoc } from 'firebase/firestore';
async function setRechargeVisible(item, visible) {
  if (!selectedUserForRecharge.value || !item.id) return;
  try {
    const docRef = doc(db, 'users', selectedUserForRecharge.value, 'rechargeHistory', item.id);
    const userDocRef = doc(db, 'users', selectedUserForRecharge.value);
    if (visible && !item.visible) {
      // Only add to balance if approving (visible: true) and not already visible
      // 1. Get user doc directly
      const userSnap = await getDoc(userDocRef);
      let userBalance = 0;
      if (userSnap.exists()) {
        userBalance = userSnap.data().balance || 0;
      }
      const newBalance = userBalance + Number(item.amount);
      // 2. Update user balance
      await updateDoc(userDocRef, { balance: newBalance });
      // 3. Update rechargeHistory entry: visible and balanceAfter
      await updateDoc(docRef, { visible: true, balanceAfter: newBalance, balanceBefore: userBalance });
      item.visible = true;
      item.balanceAfter = newBalance;
    } else if (!visible && item.visible) {
      // If admin sets visible to false, subtract from balance
      const userSnap = await getDoc(userDocRef);
      let userBalance = 0;
      if (userSnap.exists()) {
        userBalance = userSnap.data().balance || 0;
      }
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

// Withdraw Control State
const selectedUserForWithdraw = ref('');
const withdrawHistory = ref([]);
const withdrawLoading = ref(false);
const withdrawError = ref('');
const withdrawFeedback = ref('');

watch(selectedUserForWithdraw, async (uid) => {
  withdrawHistory.value = [];
  withdrawError.value = '';
  if (!uid) return;
  withdrawLoading.value = true;
  try {
    const q = query(collection(db, 'WithdrawRequest'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    withdrawHistory.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    withdrawError.value = 'Failed to fetch: ' + (e.message || e);
  } finally {
    withdrawLoading.value = false;
  }
});


async function setWithdrawStatus(item, status) {
  if (!item.id) return;
  withdrawError.value = '';
  withdrawFeedback.value = '';
  try {
    const docRef = doc(db, 'WithdrawRequest', item.id);
    await updateDoc(docRef, { status });
    item.status = status;
    // Get user doc for both approved and rejected
    if (status === 'approved' || status === 'rejected') {
      const userDocRef = doc(db, 'users', item.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const amount = Number(item.amount) || 0;
        const userName = userData.displayName || userData.firstName || userData.email || item.uid;
        if (status === 'approved') {
          const oldBalance = userData.balance || 0;
          const newBalance = oldBalance - amount;
          await updateDoc(userDocRef, { balance: newBalance });
          const notificationMsg = `✅ Withdrawal Approved\nHi ${userName}, your withdrawal request of $${amount.toFixed(2)} has been approved and is now being processed. You’ll receive the funds shortly.`;
          await addDoc(collection(db, 'notifications'), {
            userId: item.uid,
            message: notificationMsg,
            timestamp: serverTimestamp(),
          });
        } else if (status === 'rejected') {
          const notificationMsg = `❌ Withdrawal Rejected\nHi ${userName}, your withdrawal request of $${amount.toFixed(2)} has been rejected. Please check your account details or contact support if you need assistance.`;
          await addDoc(collection(db, 'notifications'), {
            userId: item.uid,
            message: notificationMsg,
            timestamp: serverTimestamp(),
          });
        }
      }
    }
    withdrawFeedback.value = 'Status updated!';
  } catch (e) {
    withdrawError.value = 'Failed to update: ' + (e.message || e);
  } finally {
    setTimeout(() => (withdrawFeedback.value = ''), 1500);
  }
}

</script>


<style scoped>
.admin-dashboard {
  max-width: 100vw;
  margin: 0;
}

/* Sidebar Drawer Styles */
.sidebar-drawer {
  width: 260px;
  min-width: 220px;
  max-width: 90vw;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s;
  z-index: 40;
  background: rgba(0,0,0,0.45);
  /* fallback for light mode */
}
@media (max-width: 767px) {
  .admin-dashboard {
    flex-direction: column;
  }
  .sidebar-drawer {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    background: #fff;
    /* fallback for light mode */
    /* For dark mode, override below */
    box-shadow: 2px 0 8px rgba(0,0,0,0.08);
    transform: translateX(-110%);
    border-right: 1px solid var(--tw-border-opacity, #e5e7eb);
    border-bottom: none !important;
    flex-direction: column !important;
    gap: 1rem !important;
    width: 80vw !important;
    max-width: 320px;
    padding: 1.5rem 1rem 1rem 1rem !important;
    transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s;
    /* Dark mode override */
  }
  .dark .sidebar-drawer {
    background: #18181b;
  }
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.45);
    z-index: 30;
    transition: background 0.2s;
  }
  .sidebar-drawer.sidebar-open {
    transform: translateX(0);
    box-shadow: 2px 0 16px rgba(0,0,0,0.18);
  }
  main {
    padding: 1rem !important;
  }
}
</style>
