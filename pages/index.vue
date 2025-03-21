<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="max-w-md w-full p-6 bg-card rounded-lg shadow-lg border border-border text-center">
      <h1 class="text-3xl font-bold text-foreground mb-4">Local Bar Polling</h1>
      <p class="text-muted-foreground mb-8">Vote for your favorite bars with friends and locals!</p>
      
      <div class="space-y-4">
        <NuxtLink 
          to="/login" 
          class="block w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Log In
        </NuxtLink>
        
        <NuxtLink 
          to="/signup" 
          class="block w-full py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Sign Up
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
// Redirect to polling page if user is already logged in
onMounted(() => {
  // auth is stored in local storage (not secure, for demo purposes)
  const auth = localStorage.getItem('auth');
  if (auth) {
    navigateTo('/polling');
  }
});
</script> 