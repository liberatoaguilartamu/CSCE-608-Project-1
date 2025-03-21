<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="max-w-md w-full p-6 bg-card rounded-lg shadow-lg border border-border">
      <h1 class="text-2xl font-bold text-foreground mb-6 text-center">Log In</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
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

        <!-- Password -->
        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-foreground">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            class="w-full p-2 rounded-md border border-input bg-background text-foreground"
            placeholder="Enter your password"
            required
          />
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </button>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 bg-destructive/20 text-destructive text-sm rounded-md">
          {{ errorMessage }}
        </div>
      </form>

      <!-- Sign Up Link -->
      <div class="mt-6 text-center text-sm">
        <span class="text-muted-foreground">Don't have an account?</span>
        <NuxtLink to="/signup" class="ml-1 text-primary hover:underline">Sign Up</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Ref vals
const phone = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  // Reset error message
  errorMessage.value = '';
  
  // Basic validation
  if (!phone.value || !password.value) {
    errorMessage.value = 'Phone number and password are required.';
    return;
  }
  
  try {
    isLoading.value = true;
    
    // Call the server API for authentication
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        phone_number: phone.value,
        password: password.value
      }
    });
    
    // Store user info in localStorage (not secure, for demo purposes)
    if (response && response.user) {
      localStorage.setItem('auth', JSON.stringify({
        user_id: response.user.user_id,
        phone: response.user.phone_number,
        name: response.user.name,
        city_id: response.user.city_id,
        anonymous_flag: response.user.anonymous_flag
      }));
      
      // Redirect to polling page after successful login
      navigateTo('/polling');
    } else {
      errorMessage.value = 'Invalid response from server.';
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.statusCode === 401) {
      errorMessage.value = 'Invalid phone number or password.';
    } else {
      errorMessage.value = error.statusMessage || 'Error logging in. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script> 