<template>
  <!-- Header -->
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
          <img class="w-[40px] h-[40px] rounded-full object-cover" :src="userStore.user?.photoBase64 || userStore.user?.photoURL || '/assets/img/author/author.jpeg'" alt="author">
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
  <!-- Sidebar -->
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
    <div class="app-bottom" :class="isSidebar ? 'block' : 'xl:hidden'">
      <div class="app-account">
        <h4>Start New <span>Account</span></h4>
        <div class="thumb">
          <img class="h-[90px]" src="/assets/img/thumb/thumb-2.png" alt="thumb">
        </div>
        <a href="#" class="app-btn">Get Funded Now</a>
      </div>
    </div>
    <div class="sidebar-shape-1"></div>
    <div class="sidebar-shape-2"></div>
  </aside>
  <!-- Main Content -->
  <main class="content-wrapper" :class="isSidebar ? 'content-wrapper' : 'xl:!pl-[73px]'">
    <div class="inner-content">
      <div class="breadcrumb-wrap">
        <div class="breadcrumb-title">
            <svg class="nav-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true">
              <path
                  d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V8h-2V7h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v2h2v1zm9-13H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12z"></path>
            </svg>
          USDT Recharge
        </div>
      </div>
      <div class="dashboard-wrapper">
        <div class="flex flex-wrap mx-[-15px]">
          <div class="xl:w-12/12 w-full px-[15px]">
            <div class="card-wrap">
              <h3 class="card-title">USDT Recharge</h3>
              <div class="content">
                <!-- USDT Refund Form Steps -->
                <template v-if="step === 1">
                  <form @submit.prevent="handleSubmit">
                    <label class="block mb-2 font-semibold">Recharge  Amount (USDT)</label>
                    <input v-model.number="amount" type="number" min="1" step="0.01" required
                      class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 mb-4" />
                    <button type="submit" :disabled="loading" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                      {{ loading ? 'Verifying...' : 'Recharge' }}
                    </button>
                    <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
                  </form>
                </template>
                <template v-else-if="step === 2">
                  <div class="text-center">
                    <p class="mb-2">Your Wallet Address:</p>
                      <div class="flex items-center justify-center mb-4">
                        <div
                          @click="copyWalletAddress"
                          :aria-label="copiedWallet ? 'Copied!' : 'Copy wallet address'"
                          title="Click to copy"
                          class="cursor-pointer select-text px-4 py-3 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 font-mono break-all text-lg transition-colors duration-200"
                          :class="copiedWallet ? 'bg-green-100 text-green-700 border-green-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 bg-white dark:bg-gray-900'"
                          style="min-width: 260px; letter-spacing: 0.03em;"
                        >
                          <span class="inline-block align-middle">{{ refundWalletAddress }}</span>
                          <span v-if="copiedWallet" class="ml-2 text-green-600 text-xs font-semibold align-middle">Copied!</span>
                        </div>
                      </div>
                    <p class="text-xs text-gray-500 mb-2">Tap the address to copy it to your clipboard.</p>
                    <button @click="verifyManually" :disabled="loading" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition mb-4">
                      {{ loading ? 'Next...' : 'Next' }}
                    </button>
                    <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
                  </div>
                </template>
                <template v-else-if="step === 3">
                  <div class="text-center">
                    <p class="mb-2">Please verify that the transaction is completed outside the app.</p>
                    <button @click="confirmRefund" :disabled="loading" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                      {{ loading ? 'Processing...' : 'Confirm Recharge' }}
                    </button>
                    <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
                  </div>
                </template>
                <template v-else-if="step === 4">
                  <div class="text-center">
                    <p class="text-green-600 font-bold mb-2">Recharge processed successfully!</p>
                    <button @click="resetForm" class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Recharge Again</button>
                  </div>
                </template>
                <div class="mt-8">
                  <h4 class="font-bold mb-2">Recharge History</h4>
                  <div v-if="rechargeHistory.filter(h => h.visible).length === 0" class="text-gray-500">No recharge history yet.</div>
                  <div v-else class="card-wrap p-0">
                    <div class="trading-wrap overflow-x-auto">
                      <div class="responsive-wrap min-w-[900px]">
                        <div class="heading grid grid-cols-[50px_1fr_1.5fr_1fr_1fr_1fr] gap-[10px] border-b border-[#000]/10 py-[10px]">
                          <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">SN</p>
                          <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Amount</p>
                          <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Date</p>
                          <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Status</p>
                          <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">Before</p>
                          <p class="text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">After</p>
                        </div>
                        <div v-for="(item, idx) in rechargeHistory.filter(h => h.visible)" :key="idx" class="content grid items-center grid-cols-[50px_1fr_1.5fr_1fr_1fr_1fr] gap-[10px] border-b border-[#000]/10 py-[10px]">
                          <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ idx + 1 }}</p>
                          <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.amount }} USDT</p>
                          <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.timestamp && (item.timestamp.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString() : new Date(item.timestamp).toLocaleString()) }}</p>
                          <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.status }}</p>
                          <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.balanceBefore }}</p>
                          <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">{{ item.balanceAfter }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '../stores/userStore';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot as onColSnapshot } from 'firebase/firestore';
import { useDark, useToggle } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { db } from '../firebase/config';

const router = useRouter();
const userStore = useUserStore();
const amount = ref(0);
const step = ref(1);
const loading = ref(false);
const error = ref('');
const refundWalletAddress = ref('TQz2Zqh2Wc5Ldbp6fYxk2N1w4EYvTGUo4b-k2N1w4EYvTGUo4b'); // Replace with your actual wallet address
const copiedWallet = ref(false);
function copyWalletAddress() {
  if (!refundWalletAddress.value) return;
  // Use Clipboard API if available
  if (navigator && navigator.clipboard) {
    navigator.clipboard.writeText(refundWalletAddress.value).then(() => {
      copiedWallet.value = true;
      setTimeout(() => copiedWallet.value = false, 1500);
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = refundWalletAddress.value;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      copiedWallet.value = true;
      setTimeout(() => copiedWallet.value = false, 1500);
    } catch (err) {}
    document.body.removeChild(textarea);
  }
}
const balance = ref(0);
const rechargeHistory = ref([]);
const isNotification = ref(false);
const notifications = ref([]);
const currentUserId = ref('');
const { user } = storeToRefs(userStore);

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


// UI state for header/sidebar
const isMenubar = ref(false);
const isUserInfo = ref(false);
const isSidebar = ref(true);
const isDark = useDark();
const toggleDark = useToggle(isDark);

// Real-time balance binding and recharge history
let unsubscribe = null;
let unsubscribeHistory = null;
onMounted(() => {
  if (userStore.user?.uid) {
    const userDocRef = doc(db, 'users', userStore.user.uid);
    unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        balance.value = docSnap.data().balance || 0;
      }
    });
    // Listen to recharge history
    const historyCol = collection(db, 'users', userStore.user.uid, 'rechargeHistory');
    const q = query(historyCol, orderBy('timestamp', 'desc'));
    unsubscribeHistory = onColSnapshot(q, (querySnapshot) => {
      rechargeHistory.value = querySnapshot.docs.map(doc => doc.data());
    });
  }
});
watch(() => userStore.user?.uid, (uid) => {
  if (unsubscribe) unsubscribe();
  if (unsubscribeHistory) unsubscribeHistory();
  if (uid) {
    const userDocRef = doc(db, 'users', uid);
    unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        balance.value = docSnap.data().balance || 0;
      }
    });
    // Listen to recharge history
    const historyCol = collection(db, 'users', uid, 'rechargeHistory');
    const q = query(historyCol, orderBy('timestamp', 'desc'));
    unsubscribeHistory = onColSnapshot(q, (querySnapshot) => {
      rechargeHistory.value = querySnapshot.docs.map(doc => doc.data());
    });
  }
});

const handleSubmit = () => {
  error.value = '';
  if (!amount.value || amount.value <= 0) {
    error.value = 'Please enter a valid amount.';
    return;
  }
  step.value = 2;
};

const verifyManually = () => {
  error.value = '';
  step.value = 3;
};

const confirmRefund = async () => {
  error.value = '';
  loading.value = true;
  try {
    // Store balance before (do not update balance yet)
    const balanceBefore = balance.value;
    // Add recharge history entry with before balance, after will be set when approved
    const historyCol = collection(db, 'users', userStore.user.uid, 'rechargeHistory');
    await addDoc(historyCol, {
      amount: amount.value - (amount.value * 0.001), // Deduct 0.1% fee
      balanceBefore,
      balanceAfter: null, 
      timestamp: new Date(),
      type: 'recharge',
      status: 'success',
      visible: false, // Only admin can set to true in Firebase
    });
    step.value = 4;
  } catch (e) {
    error.value = e.message || 'Refund failed.';
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  amount.value = 0;
  step.value = 1;
  error.value = '';
};

function handleLogout() {
  localStorage.removeItem('user');
  userStore.setUser(null);
  router.push('/login');
}

</script>

<style scoped>
.notification-scroll {
  max-height: 320px;
  overflow-y: auto;
}
</style>
