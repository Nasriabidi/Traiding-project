<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDark, useToggle } from '@vueuse/core';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const router = useRouter();
const isDark = useDark();
const toggleDark = useToggle(isDark);

// Form fields
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const selectedCountry = ref('');
const phoneNumber = ref('');
const error = ref('');
const loading = ref(false);
const profilePicture = ref(null);
const profilePicturePreview = ref('');
const storage = getStorage();

const validateForm = () => {
  if (!firstName.value || !lastName.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'All fields are required';
    return false;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return false;
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long';
    return false;
  }

  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid email address';
    return false;
  }

  return true;
};

const handleProfilePictureChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Profile picture must be less than 5MB';
    return;
  }
  if (!file.type.startsWith('image/')) {
    error.value = 'Please upload an image file';
    return;
  }
  profilePicture.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    profilePicturePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const handleRegister = async (e) => {
  e.preventDefault();
  error.value = '';
  loading.value = true;
  try {
    // Validate form
    if (!validateForm()) {
      loading.value = false;
      return;
    }
    // Debug: log start
    console.log('Register: starting user creation');
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    console.log('Register: user created', user.uid);
    let photoURL = '';
    let photoBase64 = '';
    // Only save the profile picture as base64 in Firestore, do not attempt Storage upload at all
    if (profilePicture.value) {
      try {
        photoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(profilePicture.value);
        });
      } catch (base64Err) {
        console.error('Register: failed to convert image to base64', base64Err);
        photoBase64 = '';
      }
    }
    // Try to update profile, but do not block Firestore doc creation if it fails
    try {
      await updateProfile(user, {
        displayName: `${firstName.value} ${lastName.value}`,
        photoURL: photoURL || undefined
      });
      console.log('Register: user profile updated');
    } catch (profileErr) {
      console.error('Register: updateProfile failed', profileErr);
      // Do not block registration, just log error and continue
    }
    // Always attempt to create Firestore document
    const userData = {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      phoneNumber: phoneNumber.value ? `${getDialCode()}${phoneNumber.value}` : '',
      country: selectedCountry.value,
      photoURL: photoURL || '',
      photoBase64: photoBase64 || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    console.log('Register: attempting to create Firestore document', user.uid, userData);
    let firestoreError = null;
    try {
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('Register: user document created in Firestore');
    } catch (firestoreErr) {
      console.error('Register: Firestore setDoc failed', firestoreErr);
      error.value = 'Failed to save user data.';
      firestoreError = firestoreErr;
    }
    // Always navigate to login, but show error if Firestore failed
    router.push('/login');
  } catch (err) {
    console.error('Register: registration error', err);
    if (err && err.code) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          error.value = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          error.value = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          error.value = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/weak-password':
          error.value = 'Password is too weak';
          break;
        case 'auth/network-request-failed':
          error.value = 'Network error. Please check your connection.';
          break;
        default:
          error.value = `Registration failed: ${err.message}`;
      }
    } else {
      error.value = 'Registration failed. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};

const getDialCode = () => {
  const country = countries.find(c => c.code === selectedCountry.value);
  return country ? country.dialCode : '';
};

const countries = [
  { name: 'Afghanistan', code: 'AF', dialCode: '+93' },
  { name: 'Albania', code: 'AL', dialCode: '+355' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213' },
  { name: 'Andorra', code: 'AD', dialCode: '+376' },
  { name: 'Angola', code: 'AO', dialCode: '+244' },
  { name: 'Argentina', code: 'AR', dialCode: '+54' },
  { name: 'Armenia', code: 'AM', dialCode: '+374' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'Austria', code: 'AT', dialCode: '+43' },
  { name: 'Azerbaijan', code: 'AZ', dialCode: '+994' },
  { name: 'Bahamas', code: 'BS', dialCode: '+1242' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880' },
  { name: 'Belarus', code: 'BY', dialCode: '+375' },
  { name: 'Belgium', code: 'BE', dialCode: '+32' },
  { name: 'Belize', code: 'BZ', dialCode: '+501' },
  { name: 'Benin', code: 'BJ', dialCode: '+229' },
  { name: 'Bhutan', code: 'BT', dialCode: '+975' },
  { name: 'Bolivia', code: 'BO', dialCode: '+591' },
  { name: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387' },
  { name: 'Botswana', code: 'BW', dialCode: '+267' },
  { name: 'Brazil', code: 'BR', dialCode: '+55' },
  { name: 'Brunei', code: 'BN', dialCode: '+673' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359' },
  { name: 'Burkina Faso', code: 'BF', dialCode: '+226' },
  { name: 'Burundi', code: 'BI', dialCode: '+257' },
  { name: 'Cambodia', code: 'KH', dialCode: '+855' },
  { name: 'Cameroon', code: 'CM', dialCode: '+237' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'Cape Verde', code: 'CV', dialCode: '+238' },
  { name: 'Central African Republic', code: 'CF', dialCode: '+236' },
  { name: 'Chad', code: 'TD', dialCode: '+235' },
  { name: 'Chile', code: 'CL', dialCode: '+56' },
  { name: 'China', code: 'CN', dialCode: '+86' },
  { name: 'Colombia', code: 'CO', dialCode: '+57' },
  { name: 'Comoros', code: 'KM', dialCode: '+269' },
  { name: 'Congo', code: 'CG', dialCode: '+242' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506' },
  { name: 'Croatia', code: 'HR', dialCode: '+385' },
  { name: 'Cuba', code: 'CU', dialCode: '+53' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420' },
  { name: 'Denmark', code: 'DK', dialCode: '+45' },
  { name: 'Djibouti', code: 'DJ', dialCode: '+253' },
  { name: 'Dominican Republic', code: 'DO', dialCode: '+1' },
  { name: 'Ecuador', code: 'EC', dialCode: '+593' },
  { name: 'Egypt', code: 'EG', dialCode: '+20' },
  { name: 'El Salvador', code: 'SV', dialCode: '+503' },
  { name: 'Equatorial Guinea', code: 'GQ', dialCode: '+240' },
  { name: 'Eritrea', code: 'ER', dialCode: '+291' },
  { name: 'Estonia', code: 'EE', dialCode: '+372' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251' },
  { name: 'Fiji', code: 'FJ', dialCode: '+679' },
  { name: 'Finland', code: 'FI', dialCode: '+358' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Gabon', code: 'GA', dialCode: '+241' },
  { name: 'Gambia', code: 'GM', dialCode: '+220' },
  { name: 'Georgia', code: 'GE', dialCode: '+995' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'Ghana', code: 'GH', dialCode: '+233' },
  { name: 'Greece', code: 'GR', dialCode: '+30' },
  { name: 'Greenland', code: 'GL', dialCode: '+299' },
  { name: 'Guatemala', code: 'GT', dialCode: '+502' },
  { name: 'Guinea', code: 'GN', dialCode: '+224' },
  { name: 'Guinea-Bissau', code: 'GW', dialCode: '+245' },
  { name: 'Guyana', code: 'GY', dialCode: '+592' },
  { name: 'Haiti', code: 'HT', dialCode: '+509' },
  { name: 'Honduras', code: 'HN', dialCode: '+504' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852' },
  { name: 'Hungary', code: 'HU', dialCode: '+36' },
  { name: 'Iceland', code: 'IS', dialCode: '+354' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62' },
  { name: 'Iran', code: 'IR', dialCode: '+98' },
  { name: 'Iraq', code: 'IQ', dialCode: '+964' },
  { name: 'Ireland', code: 'IE', dialCode: '+353' },
  { name: 'Israel', code: 'IL', dialCode: '+972' },
  { name: 'Italy', code: 'IT', dialCode: '+39' },
  { name: 'Jamaica', code: 'JM', dialCode: '+1' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'Jordan', code: 'JO', dialCode: '+962' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '+7' },
  { name: 'Kenya', code: 'KE', dialCode: '+254' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965' },
  { name: 'Kyrgyzstan', code: 'KG', dialCode: '+996' },
  { name: 'Laos', code: 'LA', dialCode: '+856' },
  { name: 'Latvia', code: 'LV', dialCode: '+371' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961' },
  { name: 'Lesotho', code: 'LS', dialCode: '+266' },
  { name: 'Liberia', code: 'LR', dialCode: '+231' },
  { name: 'Libya', code: 'LY', dialCode: '+218' },
  { name: 'Liechtenstein', code: 'LI', dialCode: '+423' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370' },
  { name: 'Luxembourg', code: 'LU', dialCode: '+352' },
  { name: 'Macao', code: 'MO', dialCode: '+853' },
  { name: 'Macedonia', code: 'MK', dialCode: '+389' },
  { name: 'Madagascar', code: 'MG', dialCode: '+261' },
  { name: 'Malawi', code: 'MW', dialCode: '+265' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60' },
  { name: 'Maldives', code: 'MV', dialCode: '+960' },
  { name: 'Mali', code: 'ML', dialCode: '+223' },
  { name: 'Malta', code: 'MT', dialCode: '+356' },
  { name: 'Mauritania', code: 'MR', dialCode: '+222' },
  { name: 'Mauritius', code: 'MU', dialCode: '+230' },
  { name: 'Mexico', code: 'MX', dialCode: '+52' },
  { name: 'Moldova', code: 'MD', dialCode: '+373' },
  { name: 'Monaco', code: 'MC', dialCode: '+377' },
  { name: 'Mongolia', code: 'MN', dialCode: '+976' },
  { name: 'Montenegro', code: 'ME', dialCode: '+382' },
  { name: 'Morocco', code: 'MA', dialCode: '+212' },
  { name: 'Mozambique', code: 'MZ', dialCode: '+258' },
  { name: 'Myanmar', code: 'MM', dialCode: '+95' },
  { name: 'Namibia', code: 'NA', dialCode: '+264' },
  { name: 'Nepal', code: 'NP', dialCode: '+977' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64' },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505' },
  { name: 'Niger', code: 'NE', dialCode: '+227' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234' },
  { name: 'North Korea', code: 'KP', dialCode: '+850' },
  { name: 'Norway', code: 'NO', dialCode: '+47' },
  { name: 'Oman', code: 'OM', dialCode: '+968' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92' },
  { name: 'Panama', code: 'PA', dialCode: '+507' },
  { name: 'Papua New Guinea', code: 'PG', dialCode: '+675' },
  { name: 'Paraguay', code: 'PY', dialCode: '+595' },
  { name: 'Peru', code: 'PE', dialCode: '+51' },
  { name: 'Philippines', code: 'PH', dialCode: '+63' },
  { name: 'Poland', code: 'PL', dialCode: '+48' },
  { name: 'Portugal', code: 'PT', dialCode: '+351' },
  { name: 'Qatar', code: 'QA', dialCode: '+974' },
  { name: 'Romania', code: 'RO', dialCode: '+40' },
  { name: 'Russia', code: 'RU', dialCode: '+7' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
  { name: 'Senegal', code: 'SN', dialCode: '+221' },
  { name: 'Serbia', code: 'RS', dialCode: '+381' },
  { name: 'Seychelles', code: 'SC', dialCode: '+248' },
  { name: 'Sierra Leone', code: 'SL', dialCode: '+232' },
  { name: 'Singapore', code: 'SG', dialCode: '+65' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386' },
  { name: 'Somalia', code: 'SO', dialCode: '+252' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27' },
  { name: 'South Korea', code: 'KR', dialCode: '+82' },
  { name: 'South Sudan', code: 'SS', dialCode: '+211' },
  { name: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94' },
  { name: 'Sudan', code: 'SD', dialCode: '+249' },
  { name: 'Suriname', code: 'SR', dialCode: '+597' },
  { name: 'Swaziland', code: 'SZ', dialCode: '+268' },
  { name: 'Sweden', code: 'SE', dialCode: '+46' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41' },
  { name: 'Syria', code: 'SY', dialCode: '+963' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886' },
  { name: 'Tajikistan', code: 'TJ', dialCode: '+992' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255' },
  { name: 'Thailand', code: 'TH', dialCode: '+66' },
  { name: 'Togo', code: 'TG', dialCode: '+228' },
  { name: 'Tonga', code: 'TO', dialCode: '+676' },
  { name: 'Trinidad and Tobago', code: 'TT', dialCode: '+1868' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216' },
  { name: 'Turkey', code: 'TR', dialCode: '+90' },
  { name: 'Turkmenistan', code: 'TM', dialCode: '+993' },
  { name: 'Uganda', code: 'UG', dialCode: '+256' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '+998' },
  { name: 'Vatican City', code: 'VA', dialCode: '+379' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84' },
  { name: 'Yemen', code: 'YE', dialCode: '+967' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260' },
  { name: 'Zimbabwe', code: 'ZW', dialCode: '+263' }
];
</script>
<template>
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
  <div class="w-full">
    <div class="flex flex-wrap h-screen overflow-y-auto relative">
      <!-- left content end -->
      <div class="lg:w-6/12 md:w-full lg:bg-[#fff] md:bg-[#F5F9FF] lg:p-0 md:p-[40px] dark:bg-dark">
        <div
            class="login-left py-[40px] xxl:px-[120px] xl:px-[80px] lg:px-[40px] md:px-[40px] px-[20px] bg-[#fff] lg:rounded-0 rounded-[10px] dark:bg-dark">
          <!-- login heading start -->
          <div class="login-left-heading md:text-left text-center">
            <!-- logo start -->
            <div class="logo mb-[40px]">
              <router-link to="/">
                <img class="inline-block w-[120px] hidden dark:block" src="/assets/img/logo/logo-s.png" alt="logo">
                <img class="inline-block w-[120px] block dark:hidden" src="/assets/img/logo/logo-dark.png" alt="logo">
              </router-link>
            </div>
            <!-- logo end -->
            <h1 class="text-dark xxl:text-5xl xl:text-4xl text-[24px] font-bold tracking[-0.24px] mb-[8px] dark:text-white">
              Exclusive Dashboard
              Tour</h1>
            <p class="lg:w-10/12 md:w-9/12 text-[18px] leading-[27px] text-dark dark:text-white/70">Get access to exclusive tour of
              our platform
              within 10 seconds, by simply submitting the following
              information.</p>
          </div>
          <!-- login heading end -->
          <!-- login form start -->
          <form @submit="handleRegister" class="login-form mt-[48px]">
            <!-- google & facebook start -->
            <div class="flex xl:flex-nowrap lg:flex-wrap md:flex-nowrap flex-wrap items-center gap-[20px]">
              <div class="xl:w-6/12 lg:w-full md:w-6/12 w-full">
                <a href="#"
                   class="flex justify-center items-center py-[5px] px-[15px] bg-[#0B9201]/20 border border-[#0B9201] text-dark xl:text-[16px] text-[14px] lg:h-[70px] h-[60px] rounded-[10px] transition duration-300 ease-linear hover:bg-[#0B9201]/10 hover:border-[#0B9201]/10 hover:text-[#0B9201] dark:bg-[#0B9201]/50 dark:text-white">
                  <img class="mr-[15px] xl:w-[22px] w-[15px]" src="/assets/img/icon/google.svg" alt="google">
                  Login with Google
                </a>
              </div>
              <div class="xl:w-6/12 lg:w-full md:w-6/12 w-full">
                <a href="#"
                   class="flex justify-center items-center py-[5px] px-[15px] bg-[#635bff]/20 border border-[#635bff] text-dark xl:text-[16px] text-[14px] lg:h-[70px] h-[60px] rounded-[10px] transition duration-300 ease-linear hover:bg-[#635bff]/10 hover:border-[#635bff]/10 hover:text-[#635bff] dark:bg-[#635bff]/50 dark:text-white">
                  <img class="mr-[15px] xl:w-[22px] w-[15px]" src="/assets/img/icon/facebook.svg" alt="google">
                  Login with Facebook
                </a>
              </div>
            </div>
            <!-- google & facebook end -->
            <div class="separator flex items-center justify-center my-[40px]">
              <div class="bar flex-1 border-t border-dark/20 dark:border-white/20"></div>
              <span class="text-dark text-[14px] text-center w-[30px] mx-[10px] dark:text-white">OR</span>
              <div class="bar flex-1 border-t border-dark/20 dark:border-white/20"></div>
            </div>
            <!-- inputs start -->
            <div
                class="flex xl:flex-nowrap lg:flex-wrap md:flex-nowrap flex-wrap items-center xl:gap-[20px] lg:gap-0 md:gap-[20px]">
              <div class="xl:w-6/12 lg:w-full md:w-6/12 w-full">
                <div class="input-wrap mb-[20px]">
                  <input 
                    type="text" 
                    v-model="firstName"
                    placeholder="First Name"
                    required
                    class="w-full lg:h-[70px] h-[60px] px-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 focus:border-[#0B9201]">
                </div>
              </div>
              <div class="xl:w-6/12 lg:w-full md:w-6/12 w-full">
                <div class="input-wrap mb-[20px]">
                  <input 
                    type="text" 
                    v-model="lastName"
                    placeholder="Last Name"
                    required
                    class="w-full lg:h-[70px] h-[60px] px-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 focus:border-[#0B9201]">
                </div>
              </div>
            </div>
            <div
                class="flex xl:flex-nowrap lg:flex-wrap md:flex-nowrap flex-wrap items-center xl:gap-[20px] lg:gap-0 md:gap-[20px]">
              <div class="xl:w-6/12 lg:w-full md:w-6/12 w-full">
                <div class="input-wrap mb-[20px]">
                  <input 
                    type="email" 
                    v-model="email"
                    placeholder="Email Address"
                    required
                    class="w-full lg:h-[70px] h-[60px] px-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 focus:border-[#0B9201]">
                </div>
              </div>
              <div class="xl:w-6/12 lg:w-full md:w-6/12 w-full">
                <div class="select-wrap mb-[20px] relative">
                  <select
                      v-model="selectedCountry"
                      class="w-full lg:h-[70px] h-[60px] px-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 appearance-none focus:border-[#0B9201]">
                    <option value="">Select Country</option>
                    <option v-for="country in countries" :key="country.code" :value="country.code">
                      {{ country.name }} ({{ country.dialCode }})
                    </option>
                  </select>
                  <div class="icon absolute right-[20px] top-[50%] translate-y-[-50%] pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                         stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div
                class="flex xl:flex-nowrap lg:flex-wrap md:flex-nowrap flex-wrap items-center xl:gap-[20px] lg:gap-0 md:gap-[20px]">
              <div class="xl:w-6/12 lg:w-full md:w-6/12 w-full">
                <div class="input-wrap mb-[20px]">
                  <input 
                    type="password" 
                    v-model="password"
                    placeholder="Password"
                    required
                    minlength="6"
                    class="w-full lg:h-[70px] h-[60px] px-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 focus:border-[#0B9201]">
                </div>
              </div>
              <div class="xl:w-6/12 lg:w-full md:w-6/12 w-full">
                <div class="input-wrap mb-[20px]">
                  <input 
                    type="password" 
                    v-model="confirmPassword"
                    placeholder="Confirm Password"
                    required
                    class="w-full lg:h-[70px] h-[60px] px-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 focus:border-[#0B9201]">
                </div>
              </div>
            </div>
            <div class="xl:w-full lg:w-full w-full">
              <div class="input-wrap mb-[20px] relative">
                <span class="absolute left-[25px] top-1/2 transform -translate-y-1/2 text-dark">
                  {{ getDialCode() }}
                </span>
                <input
                  type="tel"
                  v-model="phoneNumber"
                  placeholder="Phone Number"
                  class="w-full lg:h-[70px] h-[60px] pl-[80px] pr-[25px] bg-[#fff] text-dark border border-dark/20 rounded-[10px] outline-0 focus:border-[#0B9201]">
              </div>
            </div>
            <!-- Profile picture upload -->
            <div class="mb-4 flex flex-col items-center">
              <img :src="profilePicturePreview || '/assets/img/author/author.jpeg'" class="w-20 h-20 rounded-full object-cover mb-2" />
              <input type="file" accept="image/*" @change="handleProfilePictureChange" />
            </div>
            <!-- Error message -->
            <div v-if="error" class="text-red-500 text-center mb-4 px-4 py-2 bg-red-100 rounded-lg">
              {{ error }}
            </div>
            <div class="input-btn mt-[40px] mb-[20px] text-center">
              <button
                  type="submit"
                  :disabled="loading"
                  class="inline-block lg:h-[70px] h-[60px] py-[5px] md:px-[112px] px-[80px] bg-[#0B9201] text-[#fff] xl:text-[24px] text-[18px] border border-[#0B9201] rounded-[10px] uppercase focus:border-[#0B9201] disabled:opacity-50 disabled:cursor-not-allowed">
                {{ loading ? 'Registering...' : 'Register' }}
              </button>
            </div>

            <div class="info mb-[30px] text-center">
              <p class="text-[18px] mb-[16px] dark:text-white/70">
                Already have an account?
                <router-link to="/login" class="text-[#0B9201] hover:underline dark:text-primary">Login Now</router-link>
              </p>
              <p class="text-[18px] dark:text-white/70">
                Copyright © admin 2022.
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
  name: "Register",
  data() {
    return {}
  }
}
</script>

<style scoped>

</style>