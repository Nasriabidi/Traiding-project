<script setup>
// ...existing code...
import { computed } from 'vue';
// Withdraw Modal State
const showWithdrawModal = ref(false);
const withdrawAmount = ref('');
const selectedApp = ref('');
const usdtWalletAddress = ref('');
const withdrawError = ref('');

const cardName = ref('');
const cardEmail = ref('');
const cardNumber = ref('');
const cardCVC = ref('');


const userWallets = computed(() => user.value || {});

// Auto-format MM/YY field with '/'
import { nextTick } from 'vue';
const cardExpiry = ref('');
function onCardExpiryInput(e) {
  let value = e.target.value.replace(/[^\d]/g, '');
  if (value.length > 4) value = value.slice(0, 4);
  if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
  cardExpiry.value = value;
  nextTick(() => {
    e.target.value = value;
  });
}

watch(selectedApp, (val) => {
  if (val) {
    const app = paymentApps.find(a => a.name === val);
    usdtWalletAddress.value = app && userWallets.value[app.addressKey] ? userWallets.value[app.addressKey] : '';
  } else {
    usdtWalletAddress.value = '';
  }
});

function openWithdrawModal() {
  withdrawAmount.value = '';
  selectedApp.value = '';
  usdtWalletAddress.value = '';
  withdrawError.value = '';
  showWithdrawModal.value = true;
}

function closeWithdrawModal() {
  showWithdrawModal.value = false;
}

import { addDoc, serverTimestamp } from 'firebase/firestore';
const showWithdrawSuccess = ref(false);

async function handleWithdrawConfirm() {
  withdrawError.value = '';
  const amount = parseFloat(withdrawAmount.value);
  if (!amount || amount <= 0) {
    withdrawError.value = 'Please enter a valid amount.';
    return;
  }
  if (amount > userBalance.value) {
    withdrawError.value = 'Amount exceeds your balance.';
    return;
  }
  if (!cardName?.value || !cardEmail?.value || !cardNumber?.value || !cardExpiry?.value || !cardCVC?.value) {
    withdrawError.value = 'Please fill in all card details.';
    return;
  }
  try {
    await addDoc(collection(db, 'WithdrawRequest'), {
      uid: user.value?.uid || '',
      amount: amount,
      name: cardName.value,
      email: cardEmail.value,
      cardNumber: cardNumber.value,
      cardExpiry: cardExpiry.value,
      cardCVC: cardCVC.value,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    showWithdrawModal.value = false;
    showWithdrawSuccess.value = true;
    setTimeout(() => { showWithdrawSuccess.value = false; }, 4000);
  } catch (e) {
    withdrawError.value = 'Failed to submit request. Please try again.';
  }
}

import { ref, watch } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { useUserStore } from '../stores/userStore';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const userBalance = ref(0);
const userTotalProfit = ref(0);
const totalamounts = ref(0); // sum of all recharge amounts
const accountGrowthPercent = ref(0);

const router = useRouter();

const isDark = useDark();
const toggleDark = useToggle(isDark);
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

watch(user, async (newUser) => {
  if (newUser && newUser.uid) {
    userBalance.value = typeof newUser.balance === 'number' ? newUser.balance : 0;
    userTotalProfit.value = typeof newUser.totalprofit === 'number' ? newUser.totalprofit : 0;
    // Fetch all recharge amounts and calculate totalamounts
    try {
      const historyCol = collection(db, 'users', newUser.uid, 'rechargeHistory');
      const snap = await getDocs(historyCol);
      let total = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (
          typeof data.amount === 'number' &&
          data.amount > 0 &&
          (data.visible === true)
        ) {
          total += data.amount;
        }
      });
      totalamounts.value = total;
    } catch (e) {
      totalamounts.value = 0;
    }
    // Calculate growth percent
    if (totalamounts.value > 0) {
      accountGrowthPercent.value = ((userBalance.value - totalamounts.value) / totalamounts.value) * 100;
    } else {
      accountGrowthPercent.value = 0;
    }
  } else {
    userBalance.value = 0;
    userTotalProfit.value = 0;
    totalamounts.value = 0;
    accountGrowthPercent.value = 0;
  }
}, { immediate: true });

function handleLogout() {
  localStorage.removeItem('user');
  userStore.setUser(null);
  router.push('/login');
}

const isNotification = ref(false);
const notifications = ref([]);

const currentUserId = ref('');
const withdrawHistory = ref([]);

watch(user, (newUser) => {
  if (newUser && newUser.uid) {
    currentUserId.value = newUser.uid;
    fetchNotifications();
    fetchWithdrawHistory();
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

async function fetchWithdrawHistory() {
  if (!currentUserId.value) return;
  const withdrawRef = collection(db, 'WithdrawRequest');
  const q = query(withdrawRef, where('uid', '==', currentUserId.value));
  const querySnapshot = await getDocs(q);
  withdrawHistory.value = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      amount: data.amount,
      createdAt: data.createdAt,
      status: data.status
    };
  }).sort((a, b) => {
    // Sort by createdAt descending (most recent first)
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
}


</script>
<template>
  <!-- Withdraw Modal (always at the very top of the template for proper stacking) -->
  <transition name="fade">
    <div>
      <div v-if="showWithdrawModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
        <div class="bg-white dark:bg-toggle rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-gray-100 dark:border-gray-700">
          <button @click="closeWithdrawModal" class="absolute top-3 right-3 text-gray-400 hover:text-primary dark:hover:text-primary text-3xl transition-colors duration-200">&times;</button>
          <h2 class="text-2xl font-extrabold mb-1 text-dark dark:text-white text-center tracking-tight">Withdraw Request</h2>
          <form @submit.prevent="handleWithdrawConfirm" class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-dark dark:text-white mb-2">Withdraw Amount</label>
              <input type="number" v-model="withdrawAmount" :max="userBalance" min="0.01" step="0.01"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition placeholder-gray-400 dark:placeholder-gray-500"
                :placeholder="'Max: $' + userBalance.toFixed(2)" />

              <div v-if="withdrawAmount && parseFloat(withdrawAmount) > userBalance" class="text-red-500 text-xs mt-1">Amount exceeds your balance.</div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-dark dark:text-white mb-1">Name on Card</label>
              <input type="text" v-model="cardName"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Full name as on card" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-dark dark:text-white mb-1">Email</label>
              <input type="email" v-model="cardEmail"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter your email" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-dark dark:text-white mb-1">Card Number</label>
              <div class="relative flex items-center">
                <svg class="absolute left-3 w-6 h-6 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <rect x="2" y="7" width="20" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <rect x="6" y="11" width="2" height="2" rx="1" fill="currentColor"/>
                  <rect x="10" y="11" width="2" height="2" rx="1" fill="currentColor"/>
                  <rect x="14" y="11" width="2" height="2" rx="1" fill="currentColor"/>
                </svg>
                <input type="text" v-model="cardNumber"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 pl-12 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition placeholder-gray-400 dark:placeholder-gray-500 tracking-widest"
                  placeholder="1234 5678 9012 3456" maxlength="19" autocomplete="cc-number" />
              </div>
            </div>
            <div class="flex space-x-3">
              <div class="w-1/2">
                <label class="block text-sm font-semibold text-dark dark:text-white mb-1">MM/YY</label>
                <div class="relative flex items-center">
                  <svg class="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <path d="M16 3v4M8 3v4" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  <input type="text" :value="cardExpiry" @input="onCardExpiryInput"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition placeholder-gray-400 dark:placeholder-gray-500 tracking-widest"
                    placeholder="MM/YY" maxlength="5" autocomplete="cc-exp" />
                </div>
              </div>
              <div class="w-1/2">
                <label class="block text-sm font-semibold text-dark dark:text-white mb-1">CVC</label>
                <div class="relative flex items-center">
                  <svg class="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                  </svg>
                  <input type="text" v-model="cardCVC"
                    class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition placeholder-gray-400 dark:placeholder-gray-500 tracking-widest"
                    placeholder="CVC" maxlength="4" autocomplete="cc-csc" />
                </div>
              </div>
            </div>
            <div v-if="withdrawError" class="text-red-500 text-sm text-center">{{ withdrawError }}</div>
            <button type="submit"
              class="w-full bg-primary text-white py-3 rounded-lg font-bold text-lg shadow-md hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              Confirm Withdraw
            </button>
          </form>
        </div>
      </div>
      <div v-if="showWithdrawSuccess" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
        <div class="bg-white dark:bg-toggle rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <svg class="w-16 h-16 text-primary mb-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <h3 class="text-xl font-bold mb-2 text-dark dark:text-white">Your withdrawal request is currently under review.</h3>
        </div>
      </div>
    </div>
  </transition>
  <!-- End Withdraw Modal -->
  <header class="header-area" :class="isSidebar ? 'header-area' : 'xl:!w-[calc(100%-73px)] xl:!ml-[73px]'">
    <div class="header-left">
      <div class="toggle-menu group xl:!flex !hidden" @click="isSidebar = !isSidebar">
        <svg class="toggle-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
        </svg>
      </div>
      <div class="logo text-center h-[80px] xl:!hidden !flex items-center justify-center">
        <router-link to="/">
          <img class="inline-block h-[50px] hidden dark:block" src="/assets/img/logo/logo-s.png" alt="logo">
          <img class="inline-block h-[50px] block dark:hidden" src="/assets/img/logo/logo-dark.png" alt="logo">
        </router-link>
      </div>
    </div>
    <div class="header-right">
      <router-link to="/trading-overview" class="trading-btn group md:!flex !hidden">
        <svg class="trading-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4v2h14V4H5zm0 10h4v6h6v-6h4l-7-7-7 7z"></path>
        </svg>
        Start Trading
      </router-link>
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
              :src="userStore.user?.photoBase64 || userStore.user?.photoURL || '/assets/img/author/author.jpeg'"
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
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"></path>
          </svg>
          Withdraw
        </div>
      </div>
      <div class="dashboard-wrapper">
        <!-- account information start -->
        <div class="flex flex-wrap mx-[-15px]">
          <div class="w-full px-[15px]">
            <div class="flex flex-wrap mx-[-15px]">
              <div class="w-full px-[15px]">
                <div class="card-wrap">
                  <div class="content">
                    <!-- account info start -->
                    <div class="flex flex-wrap justify-center mx-[-15px]">
                      <div class="xl:w-4/12 lg:w-4/12 md:w-6/12 w-full px-[15px]">
                        <div class="bg-white p-[30px] rounded-[15px] mb-[30px] dark:bg-toggle">
                          <h3 class="text-dark xl:text-[24px] text-[20px] font-semibold leading-[1.185] tracking-[-0.05px] mb-[20px] dark:text-white">
                            Account Balance
                          </h3>
                          <p class="text-dark xl:text-[16px] text-[15px] leading-[1.5] tracking-[-0.05px] mb-[20px] dark:text-white/70">
                            Your account balance at the end of the last trading cycle.
                          </p>
                          <p class="text-primary text-[34px] font-semibold leading-[1.185] tracking-[-0.24px]">
                            ${{ userBalance.toFixed(2) }}
                          </p>
                        </div>
                      </div>
                      <div class="xl:w-4/12 lg:w-4/12 md:w-6/12 w-full px-[15px]">
                        <div class="bg-white p-[30px] rounded-[15px] mb-[30px] dark:bg-toggle">
                          <h3 class="text-dark xl:text-[24px] text-[20px] font-semibold leading-[1.185] tracking-[-0.05px] mb-[20px] dark:text-white">
                            Your Profit
                          </h3>
                          <p class="text-dark xl:text-[16px] text-[15px] leading-[1.5] tracking-[-0.05px] mb-[20px] dark:text-white/70">
                            Your total profit at the end of the last trading cycle.
                          </p>
                          <p class="text-primary text-[34px] font-semibold leading-[1.185] tracking-[-0.24px]">
                            ${{ userTotalProfit.toFixed(2) }}
                          </p>
                        </div>
                      </div>
                      <div class="xl:w-4/12 lg:w-4/12 md:w-6/12 w-full px-[15px]">
                        <div class="bg-white p-[30px] rounded-[15px] mb-[30px] dark:bg-toggle">
                          <h3 class="text-dark xl:text-[24px] text-[20px] font-semibold leading-[1.185] tracking-[-0.05px] mb-[20px] dark:text-white">
                            Total Account Growth
                          </h3>
                          <p class="text-dark xl:text-[16px] text-[15px] leading-[1.5] tracking-[-0.05px] mb-[20px] dark:text-white/70">
                            Total Account Growth Percentage You've Reached
                          </p>
                          <p class="text-dark text-[34px] font-semibold leading-[1.185] tracking-[-0.24px] dark:text-white">
                            {{ accountGrowthPercent > 0 ? accountGrowthPercent.toFixed(2) + '%' : '0.00%' }}
                          </p>
                        </div>
                      </div>
                    </div>
                    <!-- account info end -->
                    <!-- payment methods start -->
                    <div class="flex flex-wrap mx-[-15px]">
                      <div class="w-full px-[15px]">
                        <div class="bg-white flex flex-wrap items-center justify-between p-[30px] rounded-[15px] dark:bg-toggle">
                          <div class="left">
                            <h3 class="text-dark lg:text-[24px] text-[18px] font-semibold leading-[1.185] tracking-[-0.05px] mb-[20px] dark:text-white">
                              Payment Methods
                            </h3>
                            <div class="flex flex-wrap gap-[15px] py-[5px]">
                              <img class="w-[60px]" src="/assets/img/icon/deel.svg" alt="icon">
                              <img class="w-[60px]" src="/assets/img/icon/bitcoin.svg" alt="icon">
                              <img class="w-[60px]" src="/assets/img/icon/perfect-money.svg" alt="icon">
                              <img class="w-[60px]" src="/assets/img/icon/usdt.svg" alt="icon">
                            </div>
                          </div>
                          <div class="right md:mt-0 mt-[15px]">
                            <button @click="openWithdrawModal" type="button" class="inline-flex items-center justify-center bg-primary text-white xl:py-[10px] py-[15px] xl:px-[50px] px-[30px] font-semibold rounded-[5px] xl:min-h-[60px] capitalize">
                              Withdraw Request
                            </button>
                          </div>
                        </div>
                        <!-- Withdraw Modal moved to top of template for proper stacking -->
                        
                        </div>
                      </div>
                    </div>
                    <!-- payment methods end -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- account information end -->

        <!-- withdraw history start-->
        <div class="flex flex-wrap mx-[-15px]">
          <div class="w-full px-[15px]">
            <div class="card-wrap">
              <div class="card-heading flex items-center justify-between mb-[20px]">
                <h3 class="card-title !mb-0">Withdraw History</h3>
              </div>
              <div class="content">
                <div v-if="withdrawHistory.length === 0" class="withdraw-history text-center py-[40px]">
                  <div class="thumb inline-block mb-[24px]">
                    <img src="/assets/img/thumb/thumb-11.png" alt="thumb">
                  </div>
                  <p class="text-dark lg:text-[22px] text-[18px] font-semibold leading-[1.185] tracking-[-0.06px]">
                    No history found!
                  </p>
                </div>
                <div v-else class="card-wrap p-0">
                  <div class="trading-wrap overflow-x-auto">
                    <div class="responsive-wrap min-w-[700px]">
                      <div class="heading grid grid-cols-[50px_1.5fr_2fr_1.5fr_1fr] gap-[10px] border-b border-[#000]/10 py-[10px]">
                        <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">SN</p>
                        <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Amount</p>
                        <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Date</p>
                        <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Status</p>
                      </div>
                      <div v-for="(item, idx) in withdrawHistory" :key="item.id" class="content grid items-center grid-cols-[50px_1.5fr_2fr_1.5fr_1fr] gap-[10px] border-b border-[#000]/10 py-[10px]">
                        <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ idx + 1 }}</p>
                        <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">${{ Number(item.amount).toFixed(2) }}</p>
                        <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.createdAt && item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : '-' }}</p>
                        <p class="text-[14px] font-bold capitalize" :class="{
                          'text-yellow-500': item.status === 'pending',
                          'text-green-600': item.status === 'approved',
                          'text-red-500': item.status === 'rejected'
                        }">{{ item.status }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- trading history end-->
      </div>
    
  </main>
</template>

<script>
export default {
  name: "Withdraw",
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

<style scoped>

</style>