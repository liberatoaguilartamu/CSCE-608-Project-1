<template>
  <div class="min-h-screen bg-background p-4 md:p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-foreground">Your Profile</h1>
        <div class="flex gap-2">
          <NuxtLink 
            to="/polling" 
            class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Back to Polls
          </NuxtLink>
        </div>
      </header>

      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <div class="text-primary">Loading profile data...</div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Profile Info -->
        <div class="md:col-span-1">
          <div class="bg-card rounded-lg shadow-md border border-border p-6 space-y-4">
            <h2 class="text-xl font-semibold text-foreground mb-4">Profile Information</h2>
            
            <form @submit.prevent="updateProfile" class="space-y-4">
              <!-- Name -->
              <div class="space-y-2">
                <label for="name" class="text-sm font-medium text-foreground">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  v-model="profile.name" 
                  class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                />
              </div>
              
              <!-- Phone Number (read-only) -->
              <div class="space-y-2">
                <label for="phone" class="text-sm font-medium text-foreground">Phone Number</label>
                <input 
                  type="text" 
                  id="phone" 
                  v-model="profile.phone_number" 
                  class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  readonly
                />
                <p class="text-xs text-muted-foreground">Phone number cannot be changed</p>
              </div>
              
              <!-- City -->
              <div class="space-y-2">
                <label for="city" class="text-sm font-medium text-foreground">City</label>
                <select 
                  id="city" 
                  v-model="profile.city_id" 
                  class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                >
                  <option v-for="city in cities" :key="city.city_id" :value="city.city_id">
                    {{ city.city_name }}
                  </option>
                </select>
              </div>
              
              <!-- Anonymous Setting -->
              <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                  <label for="anonymous" class="text-sm font-medium text-foreground">Vote Anonymously</label>
                  <button
                    type="button"
                    @click="toggleAnonymous"
                    :disabled="!userData.can_change_anonymous"
                    :class="[
                      'relative inline-flex items-center h-6 rounded-full w-11 transition-colors',
                      anonymous ? 'bg-primary' : 'bg-muted',
                      !userData.can_change_anonymous ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block w-4 h-4 transform bg-white rounded-full transition-transform',
                        anonymous ? 'translate-x-6' : 'translate-x-1'
                      ]"
                    />
                  </button>
                </div>
                
                <p class="text-sm text-muted-foreground">
                  When enabled, your name won't appear in the list of voters.
                </p>
                
                <!-- Explanation about the weekly limitation -->
                <div v-if="!userData.can_change_anonymous" class="mt-2 p-3 bg-amber-100 text-amber-800 text-sm rounded-md">
                  <p>You can only change this setting once per week.</p>
                  <p class="font-medium">
                    Next change available in {{ userData.hours_remaining }} hours 
                    ({{ new Date(userData.next_change_date).toLocaleDateString() }})
                  </p>
                </div>
              </div>
              
              <!-- Password Update -->
              <div class="pt-2 border-t border-border">
                <h3 class="text-md font-medium text-foreground mb-2">Update Password</h3>
                
                <div class="space-y-2 mb-2">
                  <label for="currentPassword" class="text-sm font-medium text-foreground">Current Password</label>
                  <input 
                    type="password" 
                    id="currentPassword" 
                    v-model="passwordUpdate.current" 
                    class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  />
                </div>
                
                <div class="space-y-2 mb-2">
                  <label for="newPassword" class="text-sm font-medium text-foreground">New Password</label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    v-model="passwordUpdate.new" 
                    class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  />
                </div>
                
                <div class="space-y-2">
                  <label for="confirmPassword" class="text-sm font-medium text-foreground">Confirm Password</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    v-model="passwordUpdate.confirm" 
                    class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  />
                </div>
              </div>
              
              <!-- Submit Button -->
              <button 
                type="submit" 
                class="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                :disabled="isSaving"
              >
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </button>
              
              <!-- Success Message -->
              <div v-if="updateMessage" class="p-3 bg-green-100 text-green-800 text-sm rounded-md">
                {{ updateMessage }}
              </div>
              
              <!-- Error Message -->
              <div v-if="errorMessage" class="p-3 bg-destructive/20 text-destructive text-sm rounded-md">
                {{ errorMessage }}
              </div>
            </form>
          </div>
        </div>
        
        <!-- Vote History -->
        <div class="md:col-span-2">
          <div class="bg-card rounded-lg shadow-md border border-border p-6">
            <h2 class="text-xl font-semibold text-foreground mb-4">Vote History</h2>
            
            <div v-if="voteHistory.length === 0" class="text-center py-8 text-muted-foreground">
              You haven't cast any votes yet.
            </div>
            
            <div v-else class="space-y-4">
              <div 
                v-for="vote in voteHistory" 
                :key="vote.id" 
                class="border border-border rounded-md p-4"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-foreground">{{ vote.bar_name }}</h3>
                    <p class="text-sm text-muted-foreground">
                      {{ vote.poll_type === 'city' ? `City Poll: ${vote.city_name}` : `Group: ${vote.group_name}` }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-foreground">{{ formatDate(vote.date) }}</p>
                    <p class="text-xs text-muted-foreground">{{ formatTime(vote.time_voted) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Ref vals
const profile = ref({
  user_id: null,
  name: '',
  phone_number: '',
  city_id: null,
  city_name: '',
  anonymous_flag: false
});

const userData = ref({
  id: null,
  name: '',
  phone_number: '',
  city_id: null,
  city_name: '',
  anonymous: false,
  can_change_anonymous: true,
  next_change_date: null,
  hours_remaining: null
});

const cities = ref([]);
const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const anonymous = ref(false);

// Blank form data
const passwordUpdate = ref({
  current: '',
  new: '',
  confirm: ''
});

const voteHistory = ref([]);

// Check auth and load data
onMounted(async () => {
  // auth is stored in local storage (not secure, for demo purposes)
  const auth = localStorage.getItem('auth');
  if (!auth) {
    return navigateTo('/login');
  }
  
  try {
    const authData = JSON.parse(auth);
    profile.value.user_id = authData.user_id;
    
    await Promise.all([
      loadCities(),
      loadProfile(),
      loadVoteHistory()
    ]);
  } catch (error) {
    console.error('Error initializing profile page:', error);
  } finally {
    isLoading.value = false;
  }
});

// Load cities
const loadCities = async () => {
  try {
    const response = await $fetch('/api/cities');
    cities.value = response.cities;
  } catch (error) {
    console.error('Error loading cities:', error);
    errorMessage.value = 'Error loading cities. Please try again.';
  }
};

// Load user profile
const loadProfile = async () => {
  try {
    const response = await $fetch(`/api/user/profile?user_id=${profile.value.user_id}`);
    
    if (response && response.user) {
      // Update userData with the response
      userData.value = response.user;
      
      // Update profile with user data
      profile.value = {
        ...profile.value,
        name: userData.value.name,
        phone_number: userData.value.phone_number,
        city_id: userData.value.city_id,
        city_name: userData.value.city_name,
        anonymous_flag: userData.value.anonymous
      };
      
      // Update anonymous toggle
      anonymous.value = userData.value.anonymous;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    errorMessage.value = 'Failed to load your profile. Please try again.';
  }
};

// Toggle anonymous setting
const toggleAnonymous = () => {
  if (!userData.value.can_change_anonymous) return;
  
  anonymous.value = !anonymous.value;
  profile.value.anonymous_flag = anonymous.value;
};

// Update profile
const updateProfile = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isSaving.value = true;
  
  try {
    // Basic validation
    if (!profile.value.name || !profile.value.city_id) {
      errorMessage.value = 'Name and city are required.';
      isSaving.value = false;
      return;
    }
    
    // Send update request
    const response = await $fetch('/api/user/profile', {
      method: 'PUT',
      body: {
        user_id: profile.value.user_id,
        name: profile.value.name,
        city_id: profile.value.city_id,
        anonymous: profile.value.anonymous_flag
      }
    });
    
    if (response && response.user) {
      // Update userData with the response
      userData.value = {
        ...response.user,
        can_change_anonymous: response.user.next_anonymous_change ? false : true
      };
      
      // If anonymous flag was changed, reload profile to get updated timestamps
      if (response.user.next_anonymous_change) {
        await loadProfile();
      }
      
      // Update auth data in localStorage
      const auth = localStorage.getItem('auth');
      if (auth) {
        const authData = JSON.parse(auth);
        authData.name = userData.value.name;
        authData.city_id = userData.value.city_id;
        authData.city_name = userData.value.city_name;
        localStorage.setItem('auth', JSON.stringify(authData));
      }
      
      successMessage.value = response.message || 'Profile updated successfully';
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    errorMessage.value = error.data?.statusMessage || 'Failed to update your profile. Please try again.';
  } finally {
    isSaving.value = false;
  }
};

// Load vote history
const loadVoteHistory = async () => {
  try {
    const response = await $fetch(`/api/user/votes?user_id=${profile.value.user_id}`);
    if (response && response.votes) {
      voteHistory.value = response.votes;
    }
  } catch (error) {
    console.error('Error loading vote history:', error);
    errorMessage.value = 'Error loading vote history. Please try again.';
  }
};

// Format date as "Mar 15, 2023"
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format time as "12:34 PM"
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
</script> 