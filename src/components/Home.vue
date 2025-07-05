<script setup>

import { ref, watch, nextTick, onMounted } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useUserStore } from '../stores/userStore';
import { useRouter } from 'vue-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config'; // adjust the path as needed

const router = useRouter();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

// Dashboard stats
const userBalance = ref(0);
const userTotalProfit = ref(0);
const firstRechargeAmount = ref(0);
const totalamounts = ref(0); // sum of all recharge amounts
const accountGrowthPercent = ref(0);

// Chart.js for Trading Growth Curve
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
const chartRef = ref(null);
let chartInstance = null;
const sessionProfits = ref([]); // [{ opentime, profit }]

// Fetch user stats and session profits when user changes
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
    // Calculate growth percent using the new formula
    if (totalamounts.value > 0) {
      accountGrowthPercent.value = ((userBalance.value - totalamounts.value) / totalamounts.value) * 100;
    } else {
      accountGrowthPercent.value = 0;
    }
    // Fetch session profits for chart
    await fetchSessionProfits(newUser.uid);
    nextTick(() => {
      renderGrowthChart();
    });
  } else {
    userBalance.value = 0;
    userTotalProfit.value = 0;
    firstRechargeAmount.value = 0;
    accountGrowthPercent.value = 0;
    sessionProfits.value = [];
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }
}, { immediate: true });

// Fetch session profits from Firestore
async function fetchSessionProfits(uid) {
  sessionProfits.value = [];
  try {
    const sessionsCol = collection(db, 'traidsession');
    const q = query(sessionsCol, where('userId', '==', uid));
    const snap = await getDocs(q);
    const sessions = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(s => typeof s.profit === 'number' && s.opentime && s.opentime.seconds)
      .sort((a, b) => (a.opentime.seconds || 0) - (b.opentime.seconds || 0));
    sessionProfits.value = sessions.map(s => ({
      opentime: s.opentime.seconds * 1000, // ms
      profit: s.profit
    }));
  } catch (e) {
    sessionProfits.value = [];
  }
}

function renderGrowthChart() {
  if (!chartRef.value) return;
  if (chartInstance) {
    chartInstance.destroy();
  }
  const ctx = chartRef.value.getContext('2d');
  const labels = sessionProfits.value.map(s => new Date(s.opentime).toLocaleDateString());
  const data = sessionProfits.value.map(s => s.profit);
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Session Profit',
        data,
        borderColor: '#0b9201',
        backgroundColor: 'rgba(11, 146, 1,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#0b9201',
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        x: {
          title: { display: true, text: 'Session Open Date' }
        },
        y: {
          title: { display: true, text: 'Profit' },
          beginAtZero: true
        }
      }
    }
  });
}

onMounted(() => {
  if (user.value && user.value.uid) {
    fetchSessionProfits(user.value.uid).then(() => {
      renderGrowthChart();
    });
  }
});

const isNotification = ref(false);
const notifications = ref([]);
const notifIconRef = ref(null);
const newNotifEffect = ref(false);
let lastNotifCount = 0;

// Dynamically get the logged-in user ID from Pinia store
const currentUserId = ref('');


watch(user, (newUser) => {
  if (newUser && newUser.uid) {
    currentUserId.value = newUser.uid;
    fetchNotifications();
  }
}, { immediate: true });

// Watch notifications for new arrivals and trigger effect
const notifSound = new Audio('/assets/notification.mp3'); // Place your sound file in public/assets/
let notifEffectActive = false;
const LAST_SEEN_NOTIF_KEY = 'lastSeenNotifTimestamp';

function getLastSeenTimestamp() {
  return Number(localStorage.getItem(LAST_SEEN_NOTIF_KEY) || 0);
}
function setLastSeenTimestamp(ts) {
  localStorage.setItem(LAST_SEEN_NOTIF_KEY, String(ts));
}

watch(notifications, (newVal, oldVal) => {
  if (newVal && newVal.length > 0) {
    const latest = newVal[newVal.length - 1];
    const latestTs = latest.timestamp?.seconds || 0;
    const lastSeen = getLastSeenTimestamp();
    if (latestTs > lastSeen) {
      newNotifEffect.value = true;
      notifSound.play();
      notifEffectActive = true;
    }
  }
});

async function fetchNotifications() {
  if (!currentUserId.value) return;
  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('userId', '==', currentUserId.value));
  const querySnapshot = await getDocs(q);
  const newNotifs = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })).sort((a, b) => {
    // Handle missing timestamp gracefully
    const aTime = a.timestamp?.seconds || 0;
    const bTime = b.timestamp?.seconds || 0;
    return aTime - bTime; // FIFO: oldest first
  });
  notifications.value = newNotifs;
}

const isDark = useDark();
const toggleDark = useToggle(isDark);

function handleNotifIconClick() {
  isNotification.value = !isNotification.value;
  if (isNotification.value && notifications.value.length > 0) {
    const latest = notifications.value[notifications.value.length - 1];
    const latestTs = latest.timestamp?.seconds || 0;
    setLastSeenTimestamp(latestTs);
    newNotifEffect.value = false;
    notifEffectActive = false;
  }
}

function handleLogout() {
  localStorage.removeItem('user');
  userStore.setUser(null);
  router.push('/login');
}

</script>
<template>
  <header class="header-area" :class="isSidebar ? 'header-area' : 'xl:!w-[calc(100%-73px)] xl:!ml-[73px]'">
    <div class="header-left">
      <div class="toggle-menu group xl:!flex !hidden" @click="isSidebar = !isSidebar">
        <svg class="toggle-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
        </svg>
      </div>
      <div class="logo text-center h-[80px] xl:!hidden !flex items-center justify-center">
        <router-link to="/">
          <img class="inline-block w-[80px] hidden dark:block" src="/assets/img/logo/logo-dark2.png" alt="logo">
          <img class="inline-block w-[80px] block dark:hidden" src="/assets/img/logo/Ab.png" alt="logo">
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
        <div
          class="hn-icon group-hover:bg-dark"
          :class="{ 'animate-shake': newNotifEffect, 'ring-2 ring-primary': newNotifEffect }"
          @click="handleNotifIconClick"
          ref="notifIconRef"
        >
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
                <p>No Notifiction Here</p>
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
            <img class="w-[40px] h-[40px] rounded-full" :src="user && user.photoBase64 ? user.photoBase64 : (user && user.photoURL ? user.photoURL : '/assets/img/author/author.jpeg')" alt="author">
          </div>
          <div class="name ml-[15px]">
            {{ user && user.displayName ? user.displayName : 'User' }}
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
                    {{ user && user.email ? user.email : 'No email' }}
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
  <div class="menu-overlay" :class="isMenubar ? 'fixed z-[99] left-0 top-0 w-full h-full bg-dark/80 cursor-pointer' : 'hidden'" @click="isMenubar = !isMenubar"></div>
  <aside class="sidebar" :class="[isSidebar ? 'sidebar' : 'sidebar-toggle xl:!w-[73px]', isMenubar ? '!left-0' : '']">
    <div class="logo text-center h-[80px] flex items-center justify-center">
      <router-link to="/">
        <img class="inline-block h-[50px]" src="/assets/img/logo/logo-s.png" alt="logo">
      </router-link>
    </div>
    <div class="lg:hidden flex flex-wrap flex-col items-center justify-center mb-4">
      <img class="w-[55px] h-[55px] rounded-full object-cover" :src="user && user.photoBase64 ? user.photoBase64 : (user && user.photoURL ? user.photoURL : '/assets/img/author/author.jpeg')" alt="author">
      <h4 class="text-white text-[15px] mt-[8px]">{{ user && user.displayName ? user.displayName : 'User' }}</h4>
      <p class="text-primary text-[12px] mt-[8px]">{{ user && user.email ? user.email : 'No email' }}</p>
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
    <div v-if="user && user.email === 'admin@admin.com'" class="mb-4">
      <button @click="router.push('/admin-dashboard')" class="bg-green-600 text-white px-4 py-2  rounded hover:bg-green-700 transition">
        Go to Admin Dashboard
      </button>
    </div>
    <div class="inner-content">
      <div class="breadcrumb-wrap">
        <div class="breadcrumb-title">
          <svg class="breadcrumb-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"></path>
          </svg>
          Dashboard
        </div>
      </div>
      <div class="dashboard-wrapper">
        <div class="flex flex-wrap mx-[-15px]">
          <div class="xl:w-9/12 w-full px-[15px]">
            <div class="flex flex-wrap mx-[-15px]">
              <div class="xl:w-4/12 w-full px-[15px]">
                <div class="dashboard-card">
                  <div >
                    <svg class="w-[60px] mr-[10px]" width="60" height="60" xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 100 100" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
                  <g id="e7LqVuKfdv12_tr" transform="translate(50.000002,50.000002) rotate(0)">
                    <g transform="translate(-50.000002,-50.000002)">
                      <g>
                        <path
                            d="M20.3,50l-3.6,3.3l4.2,2.5L18,59.7l4.6,1.6-2.1,4.4l4.8.7-1.2,4.7L29,71l-.2,4.9l4.7-1.2.7,4.8l4.4-2.1L40.2,82l3.9-2.9l2.5,4.2l3.3-3.6l3.3,3.6l2.5-4.2L59.6,82l1.6-4.6l4.4,2.1.7-4.8L71,75.9v-4.9l4.9.2-1.2-4.7l4.8-.7-2.1-4.4L82,59.8l-2.9-3.9l4.2-2.5L79.7,50l3.6-3.3-4.2-2.5L82,40.3l-4.6-1.6l2.1-4.4-4.8-.7l1.2-4.7L71,29l.2-4.9-4.7,1.2-.7-4.8-4.4,2.1L59.7,18l-3.9,2.9-2.5-4.2L50,20.3l-3.3-3.6-2.5,4.2L40.3,18l-1.6,4.6-4.4-2.1-.7,4.8-4.7-1.2L29,29l-4.9-.2l1.2,4.7-4.8.7l2.1,4.4L18,40.3l2.9,3.9-4.2,2.5L20.3,50Zm56.2,0l-3.9,2.2L76,55.1l-4.3,1.4L74.5,60l-4.4.5l2,4-4.5-.3l1.2,4.3-4.3-1.2.3,4.5-4-2-.5,4.4-3.5-2.8-1.4,4.3-2.9-3.4-2.2,3.9-2.2-3.9-2.9,3.4-1.4-4.3-3.5,2.8-.5-4.4-4,2l.3-4.5-4.3,1.2L33,64.2l-4.5.3l2-4-4.4-.5l2.8-3.5-4.2-1.4l3.4-2.9L24.2,50l3.9-2.2-3.4-2.9L29,43.5L26.1,40l4.4-.5-2-4l4.5.3-1.2-4.3l4.3,1.2-.3-4.5l4,2l.5-4.4l3.5,2.8l1.4-4.3l2.9,3.4l2.2-3.9l2.2,3.9l2.9-3.4l1.4,4.3l3.5-2.8.5,4.4l4-2-.3,4.5l4.3-1.2-1.2,4.3l4.5-.3-2,4l4.4.5-2.8,3.5l4.2,1.4-3.4,2.9l4,2.2Z"
                            class="fill-primary"></path>
                      </g>
                    </g>
                  </g>
                  <g id="e7LqVuKfdv15_ts" transform="translate(50.300001,50) scale(1,1)">
                    <g transform="translate(-50.300001,-50)">
                      <g>
                        <path
                            d="M29.8,50c0,11.3,9.2,20.5,20.5,20.5s20.5-9.2,20.5-20.5-9.2-20.5-20.5-20.5-20.5,9.2-20.5,20.5Z"
                            class="fill-primary"></path>
                        <g>
                          <path
                              d="M59.5,59.9c-.8,1.2-1.9,2.1-3.4,2.8s-3.3,1.1-5.4,1.1v3h-1.6v-3.1c-2.8-.2-5-1.1-6.7-2.5s-2.7-3.4-2.9-5.8h6.9c.1.8.3,1.5.8,2c.5.6,1.1.9,1.9,1.1v-6c-.4-.1-.7-.2-.8-.3-1.8-.5-3.3-1.1-4.5-1.6s-2.2-1.3-3-2.4-1.3-2.5-1.3-4.3c0-1.5.4-2.9,1.3-4.1.8-1.2,2-2,3.5-2.7c1.5-.6,3.1-1,4.9-1v-3.1h1.6v3.1c2.8.2,5,1,6.6,2.4s2.6,3.2,2.8,5.5h-7c-.1-.8-.4-1.4-.8-1.9s-.9-.8-1.6-1v5.9l1.2.4c1.8.6,3.3,1.1,4.5,1.7c1.1.5,2.1,1.3,3,2.4.8,1.1,1.2,2.4,1.2,4.2-.1,1.7-.4,3-1.2,4.2ZM47.1,45.5c.5.5,1.1.9,2,1.3v-5.5c-.9.1-1.5.3-2,.7s-.7,1-.7,1.8c0,.7.2,1.2.7,1.7ZM52.9,58c.5-.5.8-1.1.8-1.9c0-.7-.3-1.3-.8-1.8s-1.2-.9-2.2-1.2v5.7c1,0,1.7-.3,2.2-.8Z"
                              fill="#fff"></path>
                        </g>
                      </g>
                    </g>
                  </g>
                </svg>
                  </div>
                  <div class="content">
                    <h2>${{ userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</h2>
                    <p>Balance</p>
                  </div>
                  <div class="shape-bg">
                    <img class="w-full" src="/assets/img/shape/shape-green.png" alt="shape">
                  </div>
                </div>
              </div>
              <div class="xl:w-4/12 w-full px-[15px]">
                <div class="dashboard-card">
                  <div >
                    <svg class="w-[60px] mr-[10px]" width="60" height="60" id="eRgerznCjqO1"
                     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" shape-rendering="geometricPrecision"
                     text-rendering="geometricPrecision">
                  <g id="eRgerznCjqO2_tr" transform="translate(87.1,60.5) rotate(0)">
                    <g transform="translate(-87.1,-60.5)">
                      <path
                          d="M61.2,57.8c-.3.1-1.8.5-3.7,1-1.2.3-2.4.6-3.5.9l-.2.1c-4.2,1.1-8.6,2.3-9.5,2.5-.1,0-.3,0-.4,0-.4,0-.7,0-1.1-.1L27.9,52.5l-2.7-2v0c-.1-.1-.3-.2-.4-.2-.2-.1-.4-.2-.6-.3-.2,0-.4,0-.6-.1-.2,0-.4,0-.6,0-.3,0-.5,0-.8.1-2.2.2-3.9,2-3.9,4.3c0,1.2.5,2.3,1.3,3v0v0c.3.3.7.6,1.1.8l1,.7l23.4,17v0c.1,0,.2.1.3.1.5.2,1.1.3,1.7.3.3,0,.7,0,1-.1h.1c7.9-2,24.3-6.2,32-8.1.2-.1.4-.1.6-.2c2-.5,4.6-1.1,6.3-1.1v-1.1v0-1.5-9.7-.4-.1c-5,0-8-3-11.7-5.6-2.7-1.9-5.6-3.5-9.9-3.5-1.9,0-3.6,0-4.9.1h-10.2c-1.5,0-2.7,1.2-2.7,2.7s1.2,2.7,2.7,2.7h5.7h3.8c1.9.3,3.4,2,3.4,4c0,1.5-.9,2.8-2.1,3.5Z"
                          class="fill-primary"></path>
                    </g>
                  </g>
                  <g id="eRgerznCjqO4_to" transform="translate(35.75,39.599998)">
                    <g id="eRgerznCjqO4_ts" transform="scale(1,1)">
                      <g transform="translate(-35.75,-39.599998)">
                        <g>
                          <g>
                            <path
                                d="M24,39.6c0,6.5,5.3,11.8,11.8,11.8s11.7-5.4,11.7-11.8-5.3-11.8-11.8-11.8-11.7,5.3-11.7,11.8Z"
                                class="fill-primary"></path>
                            <g>
                              <path
                                  d="M41,45.2c-.5.7-1.1,1.2-2,1.6s-1.9.6-3.1.6v1.7h-.9v-1.8c-1.6-.1-2.9-.6-3.8-1.4s-1.5-2-1.7-3.3h4c.1.5.2.9.5,1.1.3.3.6.5,1.1.6v-3.3c-.2-.1-.4-.1-.5-.2-1-.3-1.9-.6-2.6-.9s-1.3-.7-1.7-1.4c-.5-.6-.7-1.4-.7-2.5c0-.9.2-1.7.7-2.4s1.1-1.1,2-1.5c.9-.3,1.8-.6,2.8-.6v-1.8h.9v1.8c1.6.1,2.9.6,3.8,1.4s1.5,1.8,1.6,3.2h-4c-.1-.5-.2-.8-.5-1.1-.2-.3-.5-.5-.9-.6v3.4l.7.2c1,.3,1.9.6,2.6,1c.6.3,1.2.7,1.7,1.4.5.6.7,1.4.7,2.4s-.2,1.8-.7,2.4v0ZM33.9,37c.3.3.6.5,1.1.7v-3.2c-.5.1-.9.2-1.1.4-.3.2-.4.6-.4,1c0,.5.1.8.4,1.1Zm3.3,7.2c.3-.3.5-.6.5-1.1c0-.4-.2-.7-.5-1s-.7-.5-1.3-.7v3.3c.6-.1,1-.3,1.3-.5Z"
                                  fill="#fff"></path>
                            </g>
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                </svg>
                  </div>
                  <div class="content">
                    <h2>${{ userTotalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</h2>
                    <p>Profit</p>
                  </div>
                  <div class="shape-bg">
                    <img class="w-full" src="/assets/img/shape/shape-red.png" alt="shape">
                  </div>
                </div>
              </div>
              <div class="xl:w-4/12 w-full px-[15px]">
                <div class="dashboard-card">
                  <div >
                    <svg class="w-[60px] mr-[10px]" width="60" height="60" xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 100 100"
                     shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
                  <g id="e71mu0h2A952_ts" transform="translate(53.8,46.9) scale(1,1)">
                    <g transform="translate(-53.8,-46.9)">
                      <g>
                        <polygon points="62.2,52.5 68.4,32.9 64.1,37.3 59.7,51.1" class="fill-dark"></polygon>
                        <polygon points="59,50.7 62.8,38.6 58.5,43.1 56.5,49.4" class="fill-dark"></polygon>
                        <path d="M71.9,57.6L78,38.4c-.5-1.3-1.1-2.5-1.8-3.6L69.4,56.3l2.5,1.3Z"
                              class="fill-dark"></path>
                        <path d="M75.2,59.4l4.6-14.5c-.2-1.8-.7-3.5-1.3-5.2L72.7,58l2.5,1.4Z" class="fill-dark"></path>
                        <path d="M77.4,60.6C79.3,57,80,52.7,80,48.3c0-.5,0-.9,0-1.4L76,59.8l1.4.8Z"
                              class="fill-dark"></path>
                        <path d="M63,52.8l2.5,1.3L73,30.3c-.3-.4-.7-.7-1-1.1l-2.3,2.4L63,52.8Z"
                              class="fill-dark"></path>
                        <polygon points="57.2,44.4 53.8,47.9 55.8,49" class="fill-dark"></polygon>
                        <path d="M68.7,55.9l6.9-22.1c-.6-1-1.3-1.9-2-2.8L66.2,54.5l2.5,1.4Z" class="fill-dark"></path>
                      </g>
                    </g>
                  </g>
                  <g>
                    <path d="M69.4,26.6c-4-3.7-10-6.2-16.3-6.3L53,43.6l16.4-17Z" class="fill-primary"></path>
                    <path
                        d="M48.7,20.1C32.2,20.1,20,33.5,20,50s13.4,29.9,29.9,29.9c11.6,0,22.3-6.8,26.3-15.6L49.3,50v-29.8c-.2-.1-.4-.1-.6-.1Z"
                        class="fill-primary"></path>
                  </g>
                </svg>
                  </div>
                  <div class="content">
                    <h2>{{ accountGrowthPercent > 0 ? accountGrowthPercent.toFixed(2) + '%' : '0.00%' }}</h2>
                    <p>Total Account Growth</p>
                  </div>
                  <div class="shape-bg">
                    <img class="w-full" src="/assets/img/shape/shape-blue.png" alt="shape">
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap mx-[-15px]">
              <div class="w-full px-[15px]">
                <div class="card-wrap">
                  <h3 class="card-title">Account Details</h3>
                  <div class="content">
                    <div class="account-info">
                      <div class="account-info-top">
                        <!-- User ID removed as requested -->
                        <div class="info-item">
                          <h4>Email</h4>
                          <p>{{ user && user.email ? user.email : 'N/A' }}</p>
                        </div>
                        <div class="info-item">
                          <h4>Name</h4>
                          <p>{{ user && user.displayName ? user.displayName : 'N/A' }}</p>
                        </div>
                        <div class="info-item">
                          <h4>Photo</h4>
                          <img v-if="user && (user.photoBase64 || user.photoURL)" :src="user.photoBase64 ? user.photoBase64 : user.photoURL" alt="User Photo" class="w-12 h-12 rounded-full" />
                          <span v-else>N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap mx-[-15px]">
              <div class="w-full px-[15px]">
                <div class="card-wrap">
                  <h3 class="card-title">Trading Growth Curve</h3>
                  <div class="content">
                    <canvas ref="chartRef" height="120"></canvas>
                    <div v-if="sessionProfits.length === 0" class="text-center text-gray-400 py-4">No session data to display.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="xl:w-3/12 w-full px-[15px]">
            <div class="card-wrap text-center">
              <h3 class="card-title">Customer Service </h3>
              <div class="content">
                <div class="thumb w-[80px] h-[80px] bg-primary rounded-full overflow-hidden mx-auto mb-[15px] inline-flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-[40px] stroke-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h4 class="text-dark text-[15px] font-medium leading-[1.167] tracking-[-0.05px] dark:text-white"></h4>
                <a
                  href="https://t.me/CustomerService" target="_blank" rel="noopener noreferrer"
                  class="flex flex-wrap items-center px-[16px] py-[18px] rounded-[6px] mt-[15px] bg-white cursor-pointer  transition"
                  title="Contact us on Telegram"
                >
                  <svg class="icon w-[24px] h-[24px] mr-[16px] fill-primary" focusable="false" viewBox="0 0 24 24"
                       aria-hidden="true">
                    <path
                        d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"></path>
                  </svg>
                  <span class="flex-1 break-all text-[14px] text-dark text-left">Contact Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  name: "Home",
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
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
  100% { transform: translateX(0); }
}
.animate-shake {
  animation: shake 0.7s cubic-bezier(.36,.07,.19,.97) both;
}
</style>
<style scoped>
.notification-scroll {
  max-height: 320px;
  overflow-y: auto;
}
</style>
