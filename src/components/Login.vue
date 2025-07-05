<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDark, useToggle } from '@vueuse/core';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';


import { useUserStore } from '../stores/userStore';
const userStore = useUserStore();

const router = useRouter();
const isDark = useDark();
const toggleDark = useToggle(isDark);

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const rememberMe = ref(false);

const handleLogin = async (e) => {
  e.preventDefault();
  error.value = '';
  loading.value = true;

  try {
    if (!email.value || !password.value) {
      error.value = 'Please fill in all fields';
      return;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    console.log('Login successful:', userCredential.user);


    // Set user session in Pinia store
    userStore.setUser({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL
    });

    // Set user in localStorage for router guard
    localStorage.setItem('user', JSON.stringify({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL
    }));

    // If remember me is checked, persist the auth state
    if (rememberMe.value) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    // Redirect to dashboard
    router.push('/');
  } catch (err) {
    console.error('Login error:', err);
    switch (err.code) {
      case 'auth/user-not-found':
        error.value = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        error.value = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        error.value = 'Invalid email address';
        break;
      case 'auth/too-many-requests':
        error.value = 'Too many failed attempts. Please try again later';
        break;
      default:
        error.value = 'Failed to login. Please try again';
    }
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};

// Expose router for template usage
import { defineExpose } from 'vue';
defineExpose({ router });
</script>
<template>
  <div class="w-full relative">
    <button
        @click="toggleDark()"
        class="fixed right-[30px] top-[30px] z-[99] flex justify-center items-center w-[48px] h-[48px] rounded-full transition-all duration-300 ease-linear outline-0 cursor-pointer bg-dark dark:bg-white"
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
    <div class="flex flex-wrap h-screen overflow-y-auto relative">
      <!-- left content end -->
      <div class="lg:w-6/12 md:w-full lg:bg-[#fff] md:bg-[#F5F9FF] lg:p-0 md:p-[40px] dark:bg-dark">
        <div
            class="login-left py-[40px] xxl:px-[120px] xl:px-[80px] lg:px-[40px] md:px-[40px] px-[20px] bg-[#fff] lg:rounded-0 dark:bg-dark">
          <!-- login heading start -->
          <div class="login-left-heading md:text-left text-center">
            <!-- logo start -->
            <div class="logo mb-[40px]">
              <router-link to="/login">
                <img class="inline-block w-[120px] hidden dark:block" src="/assets/img/logo/logo-s.png" alt="logo">
                <img class="inline-block w-[120px] block dark:hidden" src="/assets/img/logo/Ab.png" alt="logo">
              </router-link>
            </div>
            <!-- logo end -->
            <h1 class="text-dark xxl:text-5xl xl:text-4xl text-[24px] font-bold tracking[-0.24px] mb-[8px] dark:text-white">
              Exclusive Dashboard Tour
            </h1>
            <p class="lg:w-10/12 md:w-9/12 text-[18px] leading-[27px] text-dark dark:text-white/70">Log in to unlock your personalized crypto dashboard powered by <span class="text-[#0B9201] dark:text-primary">AI</span>. Get smart insights, real-time market analysis, and trading opportunities tailored just for you.</p>
          </div>
          <!-- login heading end -->
          <!-- login form start -->
          <form @submit="handleLogin" class="login-form mt-[48px]">
            <!-- inputs start -->
            <div class="input-wrap mb-[20px]">
              <input 
                type="email" 
                v-model="email"
                placeholder="Email Address"
                required
                class="w-full lg:h-[70px] h-[60px] px-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 focus:border-[#0B9201]">
            </div>

            <div class="input-wrap mb-[20px]">
              <input 
                type="password" 
                v-model="password"
                placeholder="Password"
                required
                class="w-full lg:h-[70px] h-[60px] px-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 focus:border-[#0B9201]">
            </div>

            <div class="flex justify-between items-center mb-[40px]">
              <div class="remember-me">
                <label class="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="rememberMe"
                    class="w-5 h-5 rounded border-gray-300 text-[#0B9201] focus:ring-[#0B9201]">
                  <span class="ml-2 text-dark dark:text-white">Remember me</span>
                </label>
              </div>
              <router-link to="/forgot-password" class="text-[#0B9201] hover:underline dark:text-primary">
                Forgot Password?
              </router-link>
            </div>

            <!-- Error message -->
            <div v-if="error" class="text-red-500 text-center mb-4 px-4 py-2 bg-red-100 rounded-lg">
              {{ error }}
            </div>

            <div class="input-btn mb-[20px] text-center">
              <button
                type="submit"
                :disabled="loading"
                class="inline-block lg:h-[70px] h-[60px] py-[5px] md:px-[112px] px-[80px] bg-[#0B9201] text-[#fff] xl:text-[24px] text-[18px] border border-[#0B9201] rounded-[10px] uppercase focus:border-[#0B9201] disabled:opacity-50 disabled:cursor-not-allowed">
                {{ loading ? 'Logging in...' : 'Login' }}
              </button>
            </div>

            <div class="info text-center">
              <p class="text-[18px] mb-[16px] dark:text-white/70">
                Don't have an account?
                <button type="button" @click="goToRegister" class="text-[#0B9201] hover:underline dark:text-primary bg-transparent border-0 p-0 m-0 cursor-pointer">Register Now</button>
              </p>
              <p class="text-[18px] dark:text-white/70">
                Copyright © PrimeHoldings 2025.
              </p>
            </div>
            <!-- inputs end -->
          </form>
          <!-- left content end -->
        </div>
      </div>
      <!-- left content end -->

      <!-- right content start -->
      <div class="w-6/12 bg-[#0B9201] bg-cover bg-no-repeat lg:flex hidden flex-wrap items-center justify-center"
           :style="{backgroundImage:'url(/assets/img/bg/white-pattern.png)'}">
        <div class="thumb flex flex-wrap justify-center w-[85%]">
          <img src="/assets/img/thumb/thumb-1.png" alt="">
          <h1 class="text-white xl:text-5xl lg:text-3xl text-center font-bold w-[528px] mt-[50px]">Take an exclusive
            dashboard tour and
            explore</h1>
        </div>
      </div>
      <!-- right content end -->
    </div>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {}
  }
}
</script>

<style scoped>

</style>