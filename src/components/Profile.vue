<script setup>
import { ref, onMounted } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { useUserStore } from '../stores/userStore';
import { auth, db } from '../firebase/config';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';

const isDark = useDark();
const toggleDark = useToggle(isDark);
const userStore = useUserStore();

// Edit profile state
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const photoPreview = ref('');
const photoBase64 = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const loadingPassword = ref(false);
const passwordError = ref('');
const passwordSuccess = ref('');
const router = useRouter();

function handleLogout() {
  localStorage.removeItem('user');
  userStore.setUser(null);
  router.push('/login');
}


const onPhotoChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Image size should be less than 5MB.';
    return;
  }
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select a valid image file.';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    photoPreview.value = ev.target.result;
    photoBase64.value = ev.target.result;
  };
  reader.readAsDataURL(file);
};

const handleProfileUpdate = async () => {
  error.value = '';
  success.value = '';
  loading.value = true;
  try {
    // Prepare updated fields
    const updatedFields = {};
    let newDisplayName = userStore.user?.displayName || '';
    // Only update fields that are filled
    if (firstName.value || lastName.value) {
      const currentFirst = firstName.value || userStore.user?.firstName || '';
      const currentLast = lastName.value || userStore.user?.lastName || '';
      newDisplayName = `${currentFirst} ${currentLast}`.trim();
      updatedFields.firstName = firstName.value || userStore.user?.firstName || '';
      updatedFields.lastName = lastName.value || userStore.user?.lastName || '';
      updatedFields.displayName = newDisplayName;
    }
    if (email.value) {
      updatedFields.email = email.value;
    }
    if (photoBase64.value) {
      updatedFields.photoBase64 = photoBase64.value;
    }
    // Update Firebase Auth profile
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updatedFields.displayName || userStore.user?.displayName || '',
        photoURL: userStore.user?.photoURL || '',
      });
      if (email.value && email.value !== userStore.user?.email) {
        await updateEmail(auth.currentUser, email.value);
      }
    }
    // Update Firestore user document
    if (userStore.user?.uid && Object.keys(updatedFields).length > 0) {
      const userRef = doc(db, 'users', userStore.user.uid);
      await updateDoc(userRef, updatedFields);
    }
    // Update Pinia store
    userStore.setUser({
      ...userStore.user,
      ...updatedFields,
    });
    success.value = 'Profile updated successfully!';
    // Clear only the fields that were filled
    if (firstName.value) firstName.value = '';
    if (lastName.value) lastName.value = '';
    if (email.value) email.value = '';
    if (photoPreview.value) photoPreview.value = '';
    if (photoBase64.value) photoBase64.value = '';
  } catch (err) {
    error.value = err.message || 'Failed to update profile.';
  } finally {
    loading.value = false;
  }
};

const handlePasswordChange = async () => {
  passwordError.value = '';
  passwordSuccess.value = '';
  loadingPassword.value = true;
  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = 'Passwords do not match.';
    loadingPassword.value = false;
    return;
  }
  if (newPassword.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters.';
    loadingPassword.value = false;
    return;
  }
  try {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword.value);
      passwordSuccess.value = 'Password changed successfully!';
      newPassword.value = '';
      confirmNewPassword.value = '';
    }
  } catch (err) {
    passwordError.value = err.message || 'Failed to change password.';
  } finally {
    loadingPassword.value = false;
  }
};
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
            <div class="content text-center">
              <p>No Notification Here</p>
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
  <aside class="sidebar" :class="[isSidebar ? 'sidebar' : 'sidebar-toggle xl:!w-[73px]', isMenubar ? '!left-0' : '']">
    <div class="logo text-center h-[80px] flex items-center justify-center">
      <router-link to="/">
        <img class="inline-block h-[50px]" src="/assets/img/logo/logo-s.png" alt="logo">
      </router-link>
    </div>
    <div class="lg:hidden flex flex-wrap flex-col items-center justify-center">
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
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path>
          </svg>
          Profile
        </div>
      </div>
      <div class="dashboard-wrapper">
        <div class="flex flex-wrap mx-[-15px]">
          <div class="xl:w-3/12 lg:w-3/12 w-full px-[15px]">
            <div class="flex flex-wrap mx-[-15px]">
              <div class="w-full px-[15px]">
                <div class="py-[30px] mb-[30px] rounded-[10px] bg-[#F5F9FF] relative z-10 overflow-hidden dark:bg-dark">
                  <div class="author-head text-center md:px-[30px] mb-[20px]">
                    <!-- Removed static profile info (mikha dev, email, resend verify email) -->
                  </div>
                  <div class="author-tab">
                    <button
                        class="w-full text-dark 2xl:text-[16px] text-[14px] font-semibold flex items-center 2xl:px-[30px] px-[15px] py-[15px] mb-[16px] dark:text-white"
                        :class="{'': openTab !== 1, 'bg-white border-r-[5px] border-primary dark:text-dark': openTab === 1}"
                        @click="toggleTabs(1)">
                      <img class="mr-[10px]" src="/assets/img/icon/personal.svg" alt="icon">
                      Personal Information
                    </button>
                    <button class="w-full text-dark 2xl:text-[16px] text-[14px] font-semibold flex items-center 2xl:px-[30px] px-[15px] py-[15px] mb-[16px] dark:text-white"
                            :class="{'': openTab !== 2, 'bg-white border-r-[5px] border-primary dark:text-dark': openTab === 2}"
                            @click="toggleTabs(2)">
                      <img class="mr-[10px]" src="/assets/img/icon/account.svg" alt="icon">
                      Account Information
                    </button>
                    <button class="w-full text-dark 2xl:text-[16px] text-[14px] font-semibold flex items-center 2xl:px-[30px] px-[15px] py-[15px] mb-[16px] dark:text-white"
                            :class="{'': openTab !== 3, 'bg-white border-r-[5px] border-primary dark:text-dark': openTab === 3}"
                            @click="toggleTabs(3)">
                      <img class="mr-[10px]" src="/assets/img/icon/telegram.svg" alt="icon">
                      Telegram Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="xl:w-9/12 lg:w-9/12 w-full px-[15px]">
            <div :class="{'hidden': openTab !== 1, 'block': openTab === 1}">
              <div class="card-wrap">
                <h3 class="card-title">Personal Information</h3>
                <div class="content">
                  <form @submit.prevent="handleProfileUpdate">
                    <div class="flex flex-wrap mx-[-15px]">
                      <div class="w-full flex flex-col items-center mb-[30px]">
                        <img :src="photoPreview || userStore.user?.photoBase64 || userStore.user?.photoURL || '/assets/img/author/author.jpeg'" class="w-24 h-24 rounded-full object-cover mb-2" alt="Profile Photo">
                        <input type="file" accept="image/*" @change="onPhotoChange" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700" />
                      </div>
                      <div class="xl:w-6/12 lg:w-6/12 w-full px-[15px]">
                        <div class="input-wrap mb-[30px]">
                          <input v-model="firstName" class="w-full xl:h-[60px] h-[50px] xl:text-[16px] text-[14px] text-dark border border-[#dad7ff] px-[30px] outline-0 rounded-[10px] focus:border-primary placeholder-dark/60 focus:placeholder-transparent" type="text" placeholder="First Name">
                        </div>
                      </div>
                      <div class="xl:w-6/12 lg:w-6/12 w-full px-[15px]">
                        <div class="input-wrap mb-[30px]">
                          <input v-model="lastName" class="w-full xl:h-[60px] h-[50px] xl:text-[16px] text-[14px] text-dark border border-[#dad7ff] px-[30px] outline-0 rounded-[10px] focus:border-primary placeholder-dark/60 focus:placeholder-transparent" type="text" placeholder="Last Name">
                        </div>
                      </div>
                      <div class="w-full px-[15px]">
                        <div class="input-wrap mb-[30px]">
                          <input v-model="email" class="w-full xl:h-[60px] h-[50px] xl:text-[16px] text-[14px] text-dark border border-[#dad7ff] px-[30px] outline-0 rounded-[10px] focus:border-primary placeholder-dark/60 focus:placeholder-transparent" type="email" placeholder="Email">
                        </div>
                      </div>
                      <div class="w-full px-[15px] text-end">
                        <button type="submit" :disabled="loading" class="w-[150px] xl:h-[60px] h-[50px] xl:text-[16px] text-[14px] text-white text-center bg-primary rounded-[10px]">Save</button>
                      </div>
                      <div class="w-full px-[15px]">
                        <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
                        <p v-if="success" class="text-green-600 mt-2">{{ success }}</p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div :class="{'hidden': openTab !== 2, 'block': openTab === 2}">
              <div class="card-wrap">
                <h3 class="card-title">Account Information</h3>
                <div class="content">
                  <form @submit.prevent="handlePasswordChange">
                    <div class="flex flex-wrap mx-[-15px]">
                      <div class="w-full px-[15px]">
                        <div class="input-wrap mb-[30px]">
                          <input v-model="newPassword" class="w-full xl:h-[60px] h-[50px] xl:text-[16px] text-[14px] text-dark border border-[#dad7ff] px-[30px] outline-0 rounded-[10px] focus:border-primary placeholder-dark/60 focus:placeholder-transparent" type="password" placeholder="New Password*" required minlength="6">
                        </div>
                      </div>
                      <div class="w-full px-[15px]">
                        <div class="input-wrap mb-[30px]">
                          <input v-model="confirmNewPassword" class="w-full xl:h-[60px] h-[50px] xl:text-[16px] text-[14px] text-dark border border-[#dad7ff] px-[30px] outline-0 rounded-[10px] focus:border-primary placeholder-dark/60 focus:placeholder-transparent" type="password" placeholder="Confirm New Password*" required minlength="6">
                        </div>
                      </div>
                      <div class="w-full px-[15px] text-end">
                        <button type="submit" :disabled="loadingPassword" class="w-[150px] xl:h-[60px] h-[50px] xl:text-[16px] text-[14px] text-white text-center bg-primary rounded-[10px]">Save</button>
                      </div>
                      <div class="w-full px-[15px]">
                        <p v-if="passwordError" class="text-red-500 mt-2">{{ passwordError }}</p>
                        <p v-if="passwordSuccess" class="text-green-600 mt-2">{{ passwordSuccess }}</p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div :class="{'hidden': openTab !== 3, 'block': openTab === 3}">
              <div class="p-[30px] mb-[30px] rounded-[10px] bg-[#F5F9FF] relative z-10 overflow-hidden flex items-center justify-between gap-[20px] lg:flex-nowrap flex-wrap dark:bg-dark">
                <div class="content xl:py-[50px] pb-[30px]">
                  <h3 class="text-dark lg:text-[28px] text-[20px] font-semibold mb-[22px] dark:text-white">Telegram</h3>
                  <p class="text-dark xl:text-[18px] text-[16px] max-w-[500px] mb-[30px] dark:text-white/70">
                    Connect your Telegram account to get all of your account notification in your Telegram account
                  </p>
                  <button class="xl:px-[50px] px-[30px] xl:h-[60px] h-[50px] xl:text-[16px] text-[14px] text-white text-center bg-primary rounded-[10px]">
                    Connect Telegram
                  </button>
                </div>
                <div class="thumb">
                  <img src="/assets/img/thumb/thumb-12.png" alt="thumb">
                </div>
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
  name: "Profile",
  data() {
    return {
      isMenubar: false,
      isUserInfo: false,
      isNotification: false,
      isSidebar: true,
      openTab: 1,
    }
  },
  methods: {
    toggleTabs: function (tabNumber) {
      this.openTab = tabNumber
    },
  }
}
</script>

<style scoped>

</style>