<template>
  <div class="min-h-screen bg-background p-4 md:p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-foreground">Bar Polling</h1>
        <div class="flex gap-2">
          <NuxtLink 
            to="/profile" 
            class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Profile
          </NuxtLink>
          <NuxtLink 
            to="/groups" 
            class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Groups
          </NuxtLink>
          <button 
            @click="logout" 
            class="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/80"
          >
            Logout
          </button>
        </div>
      </header>

      <!-- City Info -->
      <div class="mb-6 p-3 bg-muted rounded-md">
        <p class="text-center text-foreground">
          <span class="font-medium">Current City:</span> {{ cityName }}
        </p>
      </div>

      <!-- Poll Selector -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-foreground mb-2">Select Poll</label>
        <select 
          v-model="selectedPoll" 
          class="w-full p-2 rounded-md border border-input bg-background text-foreground"
          @change="handlePollSelection"
        >
          <option value="" disabled>Select a poll</option>
          <option :value="{ type: 'city', id: userData?.city_id }">{{ cityName }} (City Poll)</option>
          <option v-for="group in userGroups" :key="group.id" :value="{ type: 'group', id: group.id }">
            {{ group.name }}
          </option>
        </select>
        <p v-if="userGroups.length === 0" class="mt-2 text-sm text-muted-foreground">
          You are not a member of any groups in this city. <NuxtLink to="/groups" class="text-primary hover:underline">Join or create a group</NuxtLink>
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-8">
        <div class="text-primary">Loading poll data...</div>
      </div>

      <div v-else>
        <!-- Countdown Timer -->
        <div class="mb-6 p-3 bg-muted rounded-md">
          <p class="text-center text-foreground">
            <span class="font-medium">Time remaining to vote:</span> {{ formatTimeRemaining }}
          </p>
        </div>

        <!-- Poll Results -->
        <div class="bg-card rounded-lg shadow-md border border-border p-4">
          <h2 class="text-xl font-bold text-foreground mb-4">
            {{ pollType === 'city' ? 'City Poll Results' : 'Group Poll Results' }}
          </h2>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-3 bg-destructive/20 text-destructive text-sm rounded-md mb-4">
            {{ errorMessage }}
          </div>

          <!-- No votes message -->
          <p v-else-if="pollResults.length === 0" class="text-center text-muted-foreground py-8">
            No votes have been cast yet. Be the first to vote!
          </p>

          <!-- Results list -->
          <div v-else class="space-y-4">
            <div 
              v-for="(result, index) in pollResults" 
              :key="result.id" 
              class="border border-border rounded-md p-3"
            >
              <div class="flex justify-between items-center mb-2">
                <div>
                  <span class="text-lg font-medium text-foreground">{{ result.name }}</span>
                  <span class="ml-2 text-sm text-muted-foreground">({{ result.votePercentage }}%)</span>
                </div>
                <span class="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                  {{ result.votes }} {{ result.votes === 1 ? 'vote' : 'votes' }}
                </span>
              </div>
              
              <!-- Progress bar -->
              <div class="w-full bg-muted rounded-full h-2.5">
                <div 
                  class="bg-primary h-2.5 rounded-full" 
                  :style="{ width: `${result.votePercentage}%` }"
                ></div>
              </div>
              
              <!-- Voters list -->
              <div v-if="result.votes > 0" class="mt-3 mb-2">
                <div class="flex justify-between items-center cursor-pointer" @click="toggleVoters(result)">
                  <span class="text-sm text-muted-foreground">
                    {{ result.showVoters ? 'Hide voters' : 'Show voters' }}
                  </span>
                  <span class="text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" :class="{ 'rotate-180': result.showVoters }">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </div>
                
                <div v-if="result.showVoters" class="mt-2 p-2 bg-muted/50 rounded-md">
                  <div v-if="result.voters && result.voters.length > 0">
                    <div class="text-xs font-medium text-muted-foreground mb-1">Non-anonymous voters:</div>
                    <div class="flex flex-wrap gap-1">
                      <span v-for="voter in result.voters" :key="voter.id" class="text-xs bg-secondary/30 text-secondary-foreground px-1.5 py-0.5 rounded">
                        {{ voter.name }}
                      </span>
                    </div>
                  </div>
                  <div v-else class="text-xs text-muted-foreground">
                    No non-anonymous voters to display.
                  </div>
                </div>
              </div>
              
              <!-- Vote button -->
              <button 
                @click="voteForBar(result.id)" 
                class="mt-3 w-full py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium"
                :disabled="userHasVotedGlobally || isVoting"
              >
                {{ isVoting ? 'Submitting Vote...' : userHasVotedGlobally ? 'Already Voted Today' : 'Vote' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// Ref vals
const pollType = ref('city');
const selectedPoll = ref('');
const userGroups = ref([]);
const pollResults = ref([]);
const currentPollId = ref(null);
const userHasVotedGlobally = ref(false);
const hoursRemaining = ref(0);
const minutesRemaining = ref(0);
const secondsRemaining = ref(0);
const isLoading = ref(true);
const isVoting = ref(false);
const errorMessage = ref('');
const userData = ref(null);
const cityName = ref('');

// Check auth and load data
onMounted(async () => {
  // auth is stored in local storage (not secure, for demo purposes)
  const auth = localStorage.getItem('auth');
  if (!auth) {
    return navigateTo('/login');
  }

  try {
    userData.value = JSON.parse(auth);
    
    // Start timer for time remaining and load data
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    // Get the city name
    await loadCityName();
    
    // Load groups from user's city
    await loadUserGroups();
    
    // Set default selection to city
    selectedPoll.value = { type: 'city', id: userData.value.city_id };
    pollType.value = 'city';
    
    // Check if user has voted globally today
    await checkGlobalVoteStatus();
    
    // Fetch poll results
    await fetchPollResults();
    
    isLoading.value = false;
    
    return () => clearInterval(timer);
  } catch (error) {
    console.error('Error parsing auth data:', error);
    localStorage.removeItem('auth');
    return navigateTo('/login');
  }
});

// Get the user's city name
const loadCityName = async () => {
  try {
    const response = await $fetch(`/api/cities?city_id=${userData.value.city_id}`);
    if (response && response.city) {
      cityName.value = response.city.city_name;
    }
  } catch (error) {
    console.error('Error loading city name:', error);
    cityName.value = 'Unknown City';
  }
};

// Handle poll selection change
const handlePollSelection = () => {
  if (!selectedPoll.value) return;
  
  pollType.value = selectedPoll.value.type;
  fetchPollResults();
};

// Load user groups (only from current city)
const loadUserGroups = async () => {
  try {
    const response = await $fetch(`/api/user/groups?user_id=${userData.value.user_id}&city_id=${userData.value.city_id}`);
    if (response && response.groups) {
      userGroups.value = response.groups;
    }
  } catch (error) {
    console.error('Error loading user groups:', error);
    errorMessage.value = 'Unable to load your groups. Please try again.';
  }
};

// Check if user has voted anywhere today
const checkGlobalVoteStatus = async () => {
  try {
    const response = await $fetch(`/api/polls/vote/status?user_id=${userData.value.user_id}`);
    userHasVotedGlobally.value = response && response.hasVoted;
  } catch (error) {
    console.error('Error checking global vote status:', error);
    userHasVotedGlobally.value = false;
  }
};

// Fetch poll results
const fetchPollResults = async () => {
  if (!selectedPoll.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  pollResults.value = [];
  currentPollId.value = null;
  
  try {
    const pollTypeValue = selectedPoll.value.type;
    const pollId = selectedPoll.value.id;
    
    let url = `/api/polls?city_id=${userData.value.city_id}&poll_type=${pollTypeValue}`;
    
    if (pollTypeValue === 'group') {
      url += `&group_id=${pollId}`;
    }
    
    const response = await $fetch(url);
    
    if (response) {
      currentPollId.value = response.poll_id;
      
      // Add showVoters flag to each bar result (toggleable user list)
      pollResults.value = response.bars.map(bar => ({
        ...bar,
        showVoters: false
      }));
    }
  } catch (error) {
    console.error('Error fetching poll results:', error);
    if (error.statusCode === 404) {
      errorMessage.value = 'No poll found for today.';
    } else {
      errorMessage.value = 'Unable to load poll results. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

// Toggle voters list visibility
const toggleVoters = (result) => {
  result.showVoters = !result.showVoters;
};

// Vote for a bar
const voteForBar = async (barId) => {
  if (userHasVotedGlobally.value || !currentPollId.value) return;
  
  isVoting.value = true;
  errorMessage.value = '';
  
  try {
    await $fetch('/api/polls/vote', {
      method: 'POST',
      body: {
        user_id: userData.value.user_id,
        poll_id: currentPollId.value,
        bar_id: barId
      }
    });
    
    // Mark user as voted globally
    userHasVotedGlobally.value = true;
    
    // Refresh poll results
    await fetchPollResults();
  } catch (error) {
    console.error('Error voting:', error);
    if (error.statusCode === 409) {
      errorMessage.value = 'You have already voted today.';
      userHasVotedGlobally.value = true;
    } else {
      errorMessage.value = error.statusMessage || 'Failed to submit your vote. Please try again.';
    }
  } finally {
    isVoting.value = false;
  }
};

// Countdown timer logic
const calculateTimeRemaining = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  
  const diff = midnight - now;
  
  hoursRemaining.value = Math.floor(diff / (1000 * 60 * 60));
  minutesRemaining.value = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  secondsRemaining.value = Math.floor((diff % (1000 * 60)) / 1000);
};

const formatTimeRemaining = computed(() => {
  return `${hoursRemaining.value.toString().padStart(2, '0')}:${minutesRemaining.value.toString().padStart(2, '0')}:${secondsRemaining.value.toString().padStart(2, '0')}`;
});

// Logout function
const logout = () => {
  localStorage.removeItem('auth');
  navigateTo('/login');
};
</script> 