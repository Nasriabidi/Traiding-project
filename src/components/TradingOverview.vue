<script setup>
// PDF Download for Trading History (dynamic import for Vite compatibility)
async function downloadHistoryPdf() {
  try {
    const jsPDFModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jsPDFModule.default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Trading History', 14, 16);
    const tableColumn = [
      'SN', 'Open Time', 'Open Price', 'Close Time', 'Close Price', 'Profit', 'Commission', 'Symbol', 'Type'
    ];
    const tableRows = tradingHistory.value.map((item, idx) => [
      idx + 1,
      item.opentime && (item.opentime.seconds ? new Date(item.opentime.seconds * 1000).toLocaleString() : new Date(item.opentime).toLocaleString()),
      item.openprice,
      item.closetime && (item.closetime.seconds ? new Date(item.closetime.seconds * 1000).toLocaleString() : new Date(item.closetime).toLocaleString()),
      item.closeprice || item.finalprice,
      item.profit,
      item.commission,
      item.cryptopair,
      item.type
    ]);
    // Use autoTable as a function, not as a prototype property
    if (autoTableModule.default) {
      autoTableModule.default(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 22,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [11, 146, 1] }
      });
    } else if (typeof autoTableModule === 'function') {
      autoTableModule(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 22,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [52, 112, 255] }
      });
    } else {
      throw new Error('Failed to load jsPDF autoTable');
    }
    doc.save('trading_history.pdf');
  } catch (err) {
    alert('Failed to generate PDF. See console for details.');
    console.error('PDF generation error:', err);
  }
}
// --- Trading Interface Additions ---
import { addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const marketPairs = [
  { label: 'BTC/USDT', symbol: 'BTCUSDT' },
  { label: 'ETH/USDT', symbol: 'ETHUSDT' },
  { label: 'SOL/USDT', symbol: 'SOLUSDT' },
];
const leverages = [1, 5, 10, 20,  50, 75, 100];
const selectedPair = ref(marketPairs[0]);
const selectedLeverage = ref(leverages[0]);
const buyDisabled = ref(false);
const sellDisabled = ref(false);
const orderBook = ref({ bids: [], asks: [] });
const currentPrice = ref(0);
const priceInterval = ref(null);
const sessionId = ref(null);
const sessionData = ref(null);
const finalPrice = ref(null);
const sessionClosedMessage = ref(null);
const sessionOpenMessage = ref(null);
const allowEndSession = ref(false);
const tradingDisabledMessage = ref('');

// Try to restore session from localStorage

onMounted(() => {
  const saved = localStorage.getItem('traid_session');
  if (saved) {
    const { id, data, selectedPair: savedPair, selectedLeverage: savedLev, disabledButton } = JSON.parse(saved);
    sessionId.value = id;
    sessionData.value = data;
    // Restore selected market and leverage
    if (savedPair) {
      const foundPair = marketPairs.find(p => p.symbol === savedPair.symbol);
      if (foundPair) selectedPair.value = foundPair;
    }
    if (savedLev) {
      selectedLeverage.value = savedLev;
    }
    // Restore disabled button state
    if (disabledButton === 'buy') buyDisabled.value = true;
    if (disabledButton === 'sell') sellDisabled.value = true;
    startPriceInterval();
  }
});

function getUserBalance() {
  // Try to get balance from userStore
  return userStore.user?.balance ; // fallback demo balance
}

function getTotalProfit() {
  // Try to get totalprofit from userStore
  return userStore.user?.totalprofit || 0; // fallback demo balance
}

async function handleTrade(type) {
  // Only allow starting a new session if there is no active session
  if (sessionId.value && sessionData.value && !sessionData.value.sessionend) {
    // Session is already active, do nothing
    return;
  }
  if (type === 'buy') buyDisabled.value = true;
  if (type === 'sell') sellDisabled.value = true;
  // Show session open message
  sessionOpenMessage.value = 'A trading session is now open.';
  setTimeout(() => {
    sessionOpenMessage.value = null;
  }, 6000);
  // Always get the latest balance from userStore.user
  const balance = userStore.user?.balance || 0;
  const leverage = selectedLeverage.value;
  const pair = selectedPair.value;
  // Calculate sessionbalance as a fraction of balance
  const sessionFraction = leverage / 100;
  // Get current price from Binance
  let openPrice = currentPrice.value;
  if (!openPrice) {
    openPrice = await fetchCurrentPrice(pair.symbol);
  }
  const docData = {
    userId: userStore.user?.uid,
    opentime: serverTimestamp(),
    profit: 0,
    initialbalance: balance,
    sessionend: false,
    sessionbalance: balance * sessionFraction,
    type,
    cryptopair: pair.label,
    stop: false,
    finalprice: 0,
    openprice: openPrice,
    leverage,
    allowendsession: false,
  };
  // Create Firestore doc
  const docRef = await addDoc(collection(db, 'traidsession'), docData);
  sessionId.value = docRef.id;
  sessionData.value = docData;
  // Save to localStorage, including UI state
  localStorage.setItem('traid_session', JSON.stringify({
    id: docRef.id,
    data: docData,
    selectedPair: selectedPair.value,
    selectedLeverage: selectedLeverage.value,
    disabledButton: type
  }));
  startPriceInterval();
}

// Close session logic
async function handleCloseSession() {
  if (!sessionId.value || !sessionData.value || sessionData.value.sessionend) return;
  // Get close time and periode
  const closetime = Date.now();
  let opentime = sessionData.value.opentime;
  // If opentime is a Firestore Timestamp, convert to ms
  if (opentime && opentime.seconds) {
    opentime = opentime.seconds * 1000;
  }
  const periode = opentime ? closetime - opentime : 0;
 
  // Get final price
  let closePrice = currentPrice.value;
  if (!closePrice) {
    closePrice = await fetchCurrentPrice(selectedPair.value.symbol);
  }
  // Use profit as already fetched from Firestore (sessionData.value.profit)
  const profit = sessionData.value.profit || 0;
   // Commission fixed
  const commission = profit * 0.01;
  // Update balance
  let balance = getUserBalance();
  balance = balance + (profit - commission);
  let totalprofit = getTotalProfit();
  totalprofit =  totalprofit + profit;
  // Update Firestore session
  await updateDoc(doc(db, 'traidsession', sessionId.value), {
    closetime: new Date(closetime),
    periode,
    commission,
    finalprice: closePrice,
    sessionend: true,
    stop: true,
    closeprice: closePrice
  });

  // Update user balance in Firestore (increment, not replace)
  if (userStore.user && userStore.user.uid) {
    try {
      // Fetch latest balance from Firestore to avoid race conditions
      const userDocRef = doc(db, 'users', userStore.user.uid);
      const userSnap = await getDoc(userDocRef);
      let latestBalance = 0;
      let latestTotalProfit = 0;
      if (userSnap.exists()) {
        latestBalance = userSnap.data().balance || 0;
        latestTotalProfit = userSnap.data().totalprofit || 0;
      }
      const newBalance = latestBalance + (profit - commission);
      const newTotalProfit = latestTotalProfit + profit;
      await updateDoc(userDocRef, {
        balance: newBalance,
        totalprofit: newTotalProfit
      });
      // Also update in Pinia store if needed
      userStore.setUser({ ...userStore.user, balance: newBalance, totalprofit: newTotalProfit });
    } catch (e) {
      // handle error if needed
    }
  }

  // Remove session from localStorage
  localStorage.removeItem('traid_session');

  // Show session closed message with profit
  sessionClosedMessage.value = `Session closed. Your profit is $${profit.toFixed(2)}`;

  // Reset all session/UI state and clear intervals for a clean new session
  sessionId.value = null;
  sessionData.value = null;
  buyDisabled.value = false;
  sellDisabled.value = false;
  finalPrice.value = null;
  if (priceInterval.value) {
    clearInterval(priceInterval.value);
    priceInterval.value = null;
  }
  // Optionally reset selectedPair and selectedLeverage to defaults if you want a full reset:
  // selectedPair.value = marketPairs[0];
  // selectedLeverage.value = leverages[0];

  // Hide the message after a few seconds
  setTimeout(() => {
    sessionClosedMessage.value = null;
  }, 6000);
}

function startPriceInterval() {
  if (priceInterval.value) clearInterval(priceInterval.value);
  priceInterval.value = setInterval(async () => {
    if (!sessionId.value || !sessionData.value) return;
    const pair = selectedPair.value;
    const price = await fetchCurrentPrice(pair.symbol);
    currentPrice.value = price;
    await fetchOrderBook(pair.symbol);
    // If session is not stopped, update Firestore session with current price
    if (sessionData.value.stop === false) {
      await updateDoc(doc(db, 'traidsession', sessionId.value), {
        currentprice: price
      });
    }
  }, 10000);
}

async function fetchCurrentPrice(symbol) {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await res.json();
    return parseFloat(data.price);
  } catch (e) {
    return 0;
  }
}

async function fetchOrderBook(symbol) {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=10`);
    const data = await res.json();
    orderBook.value = {
      bids: data.bids.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) })),
      asks: data.asks.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) })),
    };
  } catch (e) {
    orderBook.value = { bids: [], asks: [] };
  }
}

// Watch for pair change to update price/orderbook
watch(selectedPair, async (pair) => {
  currentPrice.value = await fetchCurrentPrice(pair.symbol);
  await fetchOrderBook(pair.symbol);
});

onMounted(async () => {
  currentPrice.value = await fetchCurrentPrice(selectedPair.value.symbol);
  await fetchOrderBook(selectedPair.value.symbol);
});

import { useDark, useToggle } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useUserStore } from '../stores/userStore';
import { ref, onMounted, watch } from 'vue';
import { getDoc, onSnapshot } from 'firebase/firestore';
// For displaying final price in order book

// Watch Firestore session doc for stop changes in real time
let sessionUnsub = null;
watch(sessionId, (id) => {
  if (sessionUnsub) {
    sessionUnsub();
    sessionUnsub = null;
  }
  if (id) {
    sessionUnsub = onSnapshot(doc(db, 'traidsession', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        sessionData.value = data;
        if (data.stop === true && priceInterval.value) {
          clearInterval(priceInterval.value);
          priceInterval.value = null;
          finalPrice.value = data.finalprice;
          currentPrice.value = data.finalprice;
        }
      }
    });
  }
});

// Handle Close Position button click: show alert if not allowed, else close session
function onClosePositionClick() {
  if (sessionData.value && sessionData.value.allowendsession === false) {
    return;
  }
  handleCloseSession();
}
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'vue-router';

const isNotification = ref(false);
const notifications = ref([]);
const currentUserId = ref('');

const router = useRouter();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

function handleLogout() {
  localStorage.removeItem('user');
  userStore.setUser(null);
  router.push('/login');
}

watch(user, (newUser) => {
  if (newUser && newUser.uid) {
    currentUserId.value = newUser.uid;
    fetchNotifications();
  }
}, { immediate: true });

async function fetchNotifications() {
  if (!currentUserId.value) return;
  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('userId', '==', currentUserId.value));
  const querySnapshot = await getDocs(q);
  notifications.value = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })).sort((a, b) => {
    const aTime = a.timestamp?.seconds || 0;
    const bTime = b.timestamp?.seconds || 0;
    return aTime - bTime;
  });
}

const isDark = useDark();
const toggleDark = useToggle(isDark);

watch(
  () => userStore.user,
  (newUser) => {
    if (newUser) {
      if (newUser.allowsession === false) {
        buyDisabled.value = true;
        sellDisabled.value = true;
        tradingDisabledMessage.value =
          'Trading is temporarily disabled: Our AI analysis has detected that current market conditions are too volatile or unfavorable for safe trading. Please check back later when the market stabilizes.';
      } else if (newUser.allowsession === true && (newUser.balance === 0 || newUser.balance === undefined)) {
        buyDisabled.value = true;
        sellDisabled.value = true;
        tradingDisabledMessage.value =
          'Your account balance is currently $0. Please recharge your account to start trading.';
      } else {
        buyDisabled.value = false;
        sellDisabled.value = false;
        tradingDisabledMessage.value = '';
      }
    }
  },
  { immediate: true }
);
// --- Trading History Section ---
const tradingHistory = ref([]);
const loadingHistory = ref(false);

async function fetchTradingHistory() {
  if (!userStore.user?.uid) return;
  loadingHistory.value = true;
  const q = query(
    collection(db, 'traidsession'),
    where('userId', '==', userStore.user.uid),
    where('sessionend', '==', true)
  );
  const querySnapshot = await getDocs(q);
  tradingHistory.value = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })).sort((a, b) => {
    // Sort by opentime descending
    const aTime = a.opentime?.seconds || 0;
    const bTime = b.opentime?.seconds || 0;
    return bTime - aTime;
  });
  loadingHistory.value = false;
}

onMounted(() => {
  fetchTradingHistory();
});

watch(() => userStore.user?.uid, (uid) => {
  if (uid) fetchTradingHistory();
});
</script>
<template>
  <header class="header-area" :class="isSidebar ? 'header-area' : 'xl:!w-[calc(100%-73px)] xl:!ml-[73px]'">
    <div class="header-left">
      <div class="toggle-menu group xl:!flex !hidden" @click="isSidebar = !isSidebar">
        <svg class="toggle-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
        </svg>
      </div>
      <!-- Trading History Section (moved to bottom, styled like exemple.vue) -->

      <div class="logo text-center h-[80px] xl:!hidden !flex items-center justify-center">
        <router-link to="/">
          <img class="inline-block w-[80px] hidden dark:block" src="/assets/img/logo/logo-dark2.png" alt="logo">
          <img class="inline-block w-[80px] block dark:hidden" src="/assets/img/logo/Ab.png" alt="logo">
        </router-link>
      </div>
    </div>
    <div class="header-right">
      <button
          @click="toggleDark()"
          class="flex justify-center items-center w-[48px] h-[48px] rounded-full transition-all duration-300 ease-linear outline-0 cursor-pointer bg-dark dark:bg-white"
      >
        <span class="icon block dark:hidden">
          <svg class="stroke-white w-[17px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        </span>
        <span class="icon hidden dark:block">
          <svg class="stroke-dark w-[17px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        </span>
      </button>
      <div class="h-notification group">
        <div class="hn-icon group-hover:bg-dark" @click="isNotification = !isNotification">
          <svg class="icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"></path>
          </svg>
        </div>
        <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-75"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-300 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-75">
          <div class="notification-open" v-if="isNotification">
            <h1 class="text-dark font-bold pb-[15px] mb-[20px] border-b border-dark dark:text-white dark:border-white">Notifications</h1>
            <div class="content text-center notification-scroll">
              <div v-if="notifications.length === 0">
                <p>No Notification Here</p>
              </div>
              <ul v-else>
                <li v-for="notif in notifications" :key="notif.id" class="text-left mb-3">
                  <p class="font-semibold">{{ notif.message }}</p>
                  <p class="text-xs text-gray-500">{{ new Date(notif.timestamp?.seconds * 1000).toLocaleString() }}</p>
                </li>
              </ul>
            </div>
          </div>
        </transition>
      </div>
      <div class="author-wrapper relative lg:!flex !hidden">
        <div class="author-wrap cursor-pointer" @click="isUserInfo = !isUserInfo">
          <div class="thumb">
            <img
              class="w-[40px] h-[40px] rounded-full object-cover"
              :src="userStore.user && userStore.user.photoBase64 ? userStore.user.photoBase64 : (userStore.user && userStore.user.photoURL ? userStore.user.photoURL : '/assets/img/author/author.jpeg')"
              alt="author"
            >
          </div>
          <div class="name ml-[15px]">
            {{ userStore.user?.displayName || 'User' }}
            <svg class="inline-block w-[24px] h-[24px] fill-dark dark:fill-white" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10l5 5 5-5z"></path>
            </svg>
          </div>
        </div>
        <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-75"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-300 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-75">
          <div
              class="user-info-open absolute right-0 top-[70px] md:w-[228px] w-[280px] py-[10px] px-[20px] bg-white rounded-[10px] shadow-[0_4px_10px_rgba(64,123,255,0.13)] lg:origin-center origin-right dark:bg-dark"
              v-if="isUserInfo">
            <ul>
              <li class="border-b border-[#DFE5F2]">
                <a href="#" class="block text-primary text-[18px] leading-[1.5] tracking-[-0.05px] py-[10px] dark:group-hover:!fill-primary">
                  <span style="display:block; max-width:180px; overflow-wrap:break-word; word-break:break-all; white-space:normal;">
                    {{ userStore.user && userStore.user.email ? userStore.user?.email  : 'No email' }}
                  </span>
                </a>
              </li>
              <li class="border-b border-[#DFE5F2] group">
                <router-link to="/profile" class="flex items-center text-[#4A485F] text-[18px] leading-[1.5] tracking-[-0.05px] py-[10px] transition-all duration-350 ease-linear group-hover:text-primary dark:text-white dark:group-hover:text-primary">
                  <svg class="w-[22px] h-[22px] mr-[10px] fill-[#4A485F] transition-all duration-350 ease-linear group-hover:!fill-primary dark:fill-white dark:group-hover:!fill-primary" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path>
                  </svg>
                  My Profile
                </router-link>
              </li>
              <li class="group">
                <button
                  @click="handleLogout"
                  class="flex items-center text-[#4A485F] text-[18px] leading-[1.5] tracking-[-0.05px] py-[10px] transition-all duration-350 ease-linear group-hover:text-primary dark:text-white dark:group-hover:text-primary w-full text-left"
                >
                  <svg class="w-[22px] h-[22px] mr-[10px] fill-[#4A485F] transition-all duration-350 ease-linear group-hover:!fill-primary dark:fill-white dark:group-hover:!fill-primary" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14 6v15H3v-2h2V3h9v1h5v15h2v2h-4V6h-3zm-4 5v2h2v-2h-2z"></path>
                  </svg>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </transition>
      </div>
      <div class="mobile-bar group" @click="isMenubar = !isMenubar">
        <svg class="mobile-bar-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
        </svg>
      </div>
    </div>
  </header>
  <div class="menu-overlay"
       :class="isMenubar ? 'fixed z-[99] left-0 top-0 w-full h-full bg-dark/80 cursor-pointer' : 'hidden'"
       @click="isMenubar = !isMenubar"></div>
  <aside class="sidebar" :class="[isSidebar ? 'sidebar' : 'sidebar-toggle xl:!w-[73px]', isMenubar ? '!left-0' : '']">
    <div class="logo text-center h-[80px] flex items-center justify-center">
      <router-link to="/">
        <img class="inline-block h-[50px]" src="/assets/img/logo/logo-s.png" alt="logo">
      </router-link>
    </div>
    <div class="lg:hidden flex flex-wrap flex-col items-center justify-center mb-4">
      <img class="w-[55px] h-[55px] rounded-full object-cover" :src="userStore.user?.photoBase64 || userStore.user?.photoURL || '/assets/img/author/author.jpeg'" alt="author">
      <h4 class="text-white text-[15px] mt-[8px]">{{ userStore.user?.displayName || 'User' }}</h4>
      <p class="text-primary text-[12px] mt-[8px]">{{ userStore.user?.email || '' }}</p>
      <router-link
        to="/profile"
        class="mt-3 px-4 py-2 bg-white text-primary rounded w-full text-center text-[15px] font-semibold border border-primary flex items-center justify-center"
        style="margin-bottom: 8px;"
      >
        <svg class="w-[20px] h-[20px] mr-2 fill-primary" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path>
        </svg>
        My Profile
      </router-link>
      <button
        @click="handleLogout"
        class="px-4 py-2 bg-primary text-white rounded w-full text-center text-[15px] font-semibold"
      >
        Logout
      </button>
    </div>
    <div class="main-menu">
      <ul class="nav">
        <li class="nav-item">
          <router-link to="/" class="nav-link group">
            <svg class="nav-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"></path>
            </svg>
            <span class="text">Dashboard</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/trading-overview" class="nav-link group">
            <svg class="nav-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
              <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"></path>
            </svg>
            <span class="text">Trading</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/usdt-refund" class="nav-link group">
            <svg class="nav-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
              <text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">USDT</text>
            </svg>
            <span class="text">Recharge Account</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/withdraw" class="nav-link group">
            <svg class="nav-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
              <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"></path>
            </svg>
            <span class="text">Withdraw</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/help" class="nav-link group">
            <svg class="nav-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
              <path
                  d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-3.5h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"></path>
            </svg>
            <span class="text">Help</span>
          </router-link>
        </li>
      </ul>
    </div>
    <router-link to="/usdt-refund" >
    <div class="app-bottom" :class="isSidebar ? 'block' : 'xl:hidden'">
      <div class="app-account">
        <h4>Start New <span>Account</span></h4>
        <div class="thumb">
          <img class="h-[90px]" src="/assets/img/thumb/thumb-2.png" alt="thumb">
        </div>  
        <a href="#" class="app-btn">Get Funded Now</a>
      </div>
    </div>
    </router-link>
    <div class="sidebar-shape-1"></div>
    <div class="sidebar-shape-2"></div>
  </aside>
  <main class="content-wrapper" :class="isSidebar ? 'content-wrapper' : 'xl:!pl-[73px]'">
    <div class="inner-content">
      <div class="breadcrumb-wrap">
        <div class="breadcrumb-title">
          <svg class="breadcrumb-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"></path>
          </svg>
          Trading Overview
        </div>
      </div>
      <div v-if="sessionOpenMessage" class="mb-4 p-4 rounded bg-green-100 text-green-800 font-semibold text-center border border-green-300">
        {{ sessionOpenMessage }}
      </div>
      <div v-if="sessionClosedMessage" class="mb-4 p-4 rounded bg-green-100 text-green-800 font-semibold text-center border border-green-300">
        {{ sessionClosedMessage }}
      </div>
      <div v-if="tradingDisabledMessage" class="mb-4 p-4 rounded bg-green-100 text-green-800 font-semibold text-center border border-green-300">
        {{ tradingDisabledMessage }}
      </div>
      <div class="dashboard-wrapper">
        <!-- CRYPTO TRADING INTERFACE -->
        <div class="card-wrap mb-8">
          <div class="flex flex-wrap gap-4 items-center justify-between">
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-dark dark:text-white">Market</label>
              <select v-model="selectedPair" class="rounded border px-3 py-2">
                <option v-for="pair in marketPairs" :key="pair.symbol" :value="pair">{{ pair.label }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-dark dark:text-white">Leverage</label>
              <select v-model="selectedLeverage" class="rounded border px-3 py-2">
                <option v-for="lev in leverages" :key="lev" :value="lev">{{ lev }}X</option>
              </select>
            </div>
            <div class="flex flex-col gap-2">
              <label class="font-semibold text-dark dark:text-white">Current Price</label>
              <div class="text-lg font-bold">{{ currentPrice ? currentPrice.toLocaleString() : '...' }}</div>
            </div>
<div class="flex gap-2 items-end">
  <button
    :disabled="sessionId && sessionData && !sessionData.sessionend || buyDisabled"
    @click="handleTrade('buy')"
    class="px-6 py-2 rounded bg-green-500 text-white font-bold disabled:opacity-50"
  >
    Buy
  </button>
  <button
    :disabled="sessionId && sessionData && !sessionData.sessionend || sellDisabled"
    @click="handleTrade('sell')"
    class="px-6 py-2 rounded bg-red-500 text-white font-bold disabled:opacity-50"
  >
    Sell
  </button>
  <button
    v-if="sessionId && sessionData && !sessionData.sessionend"
    @click="onClosePositionClick"
    class="px-6 py-2 rounded bg-yellow-500 text-white font-bold"
  >
    Close Position
  </button>
</div>
          </div>
          <div class="mt-6 flex flex-col md:flex-row gap-6">
            <div class="flex-1">
              <h4 class="font-semibold mb-2 text-dark dark:text-white">Order Book (Top 10)</h4>
              <div class="flex gap-4">
                <div class="flex-1">
                  <div class="text-xs font-bold text-green-600 mb-1">Bids</div>
                  <div v-if="finalPrice !== null" class="flex justify-between text-green-700 text-xs">
                    <span>{{ finalPrice }}</span>
                    <span>
                      {{
                        orderBook.bids.length > 0
                          ? (orderBook.bids[0].qty + 0.1).toLocaleString(undefined, {
                              minimumFractionDigits: orderBook.bids[0].qty.toString().split('.')[1]?.length || 0,
                              maximumFractionDigits: orderBook.bids[0].qty.toString().split('.')[1]?.length || 0
                            })
                          : '1.00'
                      }}
                    </span>
                  </div>
                  <div v-for="bid in orderBook.bids" :key="bid.price" class="flex justify-between text-green-700 text-xs">
                    <span>{{ bid.price }}</span>
                    <span>{{ bid.qty }}</span>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="text-xs font-bold text-red-600 mb-1">Asks</div>
                  <div v-if="finalPrice !== null" class="flex justify-between text-red-700 text-xs">
                    <span>{{ finalPrice }}</span>
                    <span>
                      {{
                        orderBook.asks.length > 0
                          ? (orderBook.asks[0].qty + 0.1).toLocaleString(undefined, {
                              minimumFractionDigits: orderBook.asks[0].qty.toString().split('.')[1]?.length || 0,
                              maximumFractionDigits: orderBook.asks[0].qty.toString().split('.')[1]?.length || 0
                            })
                          : '1.00'
                      }}
                    </span>
                  </div>
                  <div v-for="ask in orderBook.asks" :key="ask.price" class="flex justify-between text-red-700 text-xs">
                    <span>{{ ask.price }}</span>
                    <span>{{ ask.qty }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- trading history start-->
    <div class="dashboard-wrapper mt-1">
      <div class="card-wrap">
        <div class="card-heading flex items-center justify-between mb-[20px]">
          <h3 class="card-title !mb-0">Trading History</h3>
          <button @click="downloadHistoryPdf" type="button" class="bg-primary text-white py-[10px] px-[15px] font-semibold rounded-[5px]">Download</button>
        </div>
        <div class="content">
          <!-- trading-table start-->
          <div class="trading-wrap overflow-x-auto">
            <div class="responsive-wrap w-full min-w-0">
              <div class="heading grid grid-cols-[50px_160px_120px_160px_120px_100px_100px_100px_80px_80px] gap-[10px] border-b border-[#000]/10 py-[10px]">
                <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">SN</p>
                <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Open Time</p>
                <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Open Price</p>
                <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Close Time</p>
                <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Close Price</p>
                <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Profit</p>
                <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Commission</p>
                <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Symbol</p>
                <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Type</p>
              </div>
              <div v-if="loadingHistory" class="text-gray-500 py-4">Loading...</div>
              <div v-else-if="tradingHistory.length === 0" class="text-gray-500 py-4">No trading history yet.</div>
              <div v-else>
                <div v-for="(item, idx) in tradingHistory" :key="item.id" class="content grid items-center grid-cols-[50px_160px_120px_160px_120px_100px_100px_100px_80px_80px_80px] gap-[10px] border-b border-[#000]/10 py-[10px]">
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ idx + 1 }}</p>
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                    {{ item.opentime && (item.opentime.seconds ? new Date(item.opentime.seconds * 1000).toLocaleString() : new Date(item.opentime).toLocaleString()) }}
                  </p>
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.openprice }}</p>
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                    {{ item.closetime && (item.closetime.seconds ? new Date(item.closetime.seconds * 1000).toLocaleString() : new Date(item.closetime).toLocaleString()) }}
                  </p>
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.closeprice || item.finalprice }}</p>
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.profit }}</p>
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ Number(item.commission).toFixed(2) }}</p>
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.cryptopair }}</p>
                  <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.type }}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- trading-table end-->
        </div>
      </div>
    </div>
    <!-- trading history end-->
  </main>
</template>

<script>
export default {
  name: "TradingOverview",
  data() {
    return {
      isMenubar: false,
      isUserInfo: false,
      isNotification: false,
      isSidebar: true,
    }
  }
}
</script>

<style scoped>
.notification-scroll {
  max-height: 320px;
  overflow-y: auto;
}
</style>