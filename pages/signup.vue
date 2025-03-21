<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="max-w-md w-full p-6 bg-card rounded-lg shadow-lg border border-border">
      <h1 class="text-2xl font-bold text-foreground mb-6 text-center">Sign Up</h1>
      
      <form @submit.prevent="handleSignup" class="space-y-4">
        <!-- Phone Number -->
        <div class="space-y-2">
          <label for="phone" class="text-sm font-medium text-foreground">Phone Number</label>
          <input 
            type="text" 
            id="phone" 
            v-model="phone" 
            class="w-full p-2 rounded-md border border-input bg-background text-foreground"
            placeholder="Enter your phone number"
            required
          />
        </div>

        <!-- Name -->
        <div class="space-y-2">
          <label for="name" class="text-sm font-medium text-foreground">Name</label>
          <input 
            type="text" 
            id="name" 
            v-model="name" 
            class="w-full p-2 rounded-md border border-input bg-background text-foreground"
            placeholder="Enter your name"
            required
          />
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-foreground">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            class="w-full p-2 rounded-md border border-input bg-background text-foreground"
            placeholder="Create a password"
            required
          />
        </div>

        <!-- Confirm Password -->
        <div class="space-y-2">
          <label for="confirmPassword" class="text-sm font-medium text-foreground">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            class="w-full p-2 rounded-md border border-input bg-background text-foreground"
            placeholder="Confirm your password"
            required
          />
        </div>

        <!-- City -->
        <div class="space-y-2">
          <label for="city" class="text-sm font-medium text-foreground">City</label>
          <select 
            id="city" 
            v-model="selectedCity" 
            class="w-full p-2 rounded-md border border-input bg-background text-foreground"
            required
          >
            <option value="" disabled>Select your city</option>
            <option v-for="city in cities" :key="city.city_id" :value="city.city_id">
              {{ city.city_name }}
            </option>
          </select>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 bg-destructive/20 text-destructive text-sm rounded-md">
          {{ errorMessage }}
        </div>
      </form>

      <!-- Login Link -->
      <div class="mt-6 text-center text-sm">
        <span class="text-muted-foreground">Already have an account?</span>
        <NuxtLink to="/login" class="ml-1 text-primary hover:underline">Log In</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const phone = ref('');
const name = ref('');
const password = ref('');
const confirmPassword = ref('');
const selectedCity = ref('');
const errorMessage = ref('');
const cities = ref([]);
const isLoading = ref(false);

onMounted(async () => {
  try {
    // Fetch cities from the API
    const response = await $fetch('/api/cities');
    if (response && response.cities) {
      cities.value = response.cities;
    }
  } catch (error) {
    console.error('Error fetching cities:', error);
    errorMessage.value = 'Unable to load cities. Please try again later.';
  }
});

const handleSignup = async () => {
  // Reset error message
  errorMessage.value = '';
  
  // Basic validation
  if (!phone.value || !name.value || !password.value || !confirmPassword.value || !selectedCity.value) {
    errorMessage.value = 'All fields are required.';
    return;
  }
  
  // Validate phone number format
  // 10 digit check
  if (!/^\d{10}$/.test(phone.value)) {
    errorMessage.value = 'Please enter a valid 10-digit phone number.';
    return;
  }
  
  // Check if passwords match
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }
  
  try {
    isLoading.value = true;
    
    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        phone_number: phone.value,
        name: name.value,
        password: password.value,
        city_id: selectedCity.value
      }
    });
    
    // Reset form
    phone.value = '';
    name.value = '';
    password.value = '';
    confirmPassword.value = '';
    selectedCity.value = '';
    
    // Redirect to login page after successful signup
    navigateTo('/login');
  } catch (error) {
    console.error('Signup error:', error);
    if (error.statusCode === 409) {
      errorMessage.value = 'A user with this phone number already exists.';
    } else if (error.statusCode === 400) {
      errorMessage.value = error.statusMessage || 'Please check your information and try again.';
    } else {
      errorMessage.value = 'Error creating account. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script> 