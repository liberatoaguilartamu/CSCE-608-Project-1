<template>
  <div class="min-h-screen bg-background p-4 md:p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-foreground">Your Groups</h1>
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
        <div class="text-primary">Loading groups data...</div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Create Group Form -->
        <div class="md:col-span-1">
          <div class="bg-card rounded-lg shadow-md border border-border p-6 space-y-4">
            <h2 class="text-xl font-semibold text-foreground mb-4">Create New Group</h2>
            
            <form @submit.prevent="createGroup" class="space-y-4">
              <!-- Group Name -->
              <div class="space-y-2">
                <label for="groupName" class="text-sm font-medium text-foreground">Group Name</label>
                <input 
                  type="text" 
                  id="groupName" 
                  v-model="newGroup.name" 
                  class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  placeholder="Enter group name"
                  required
                />
              </div>
              
              <!-- City -->
              <div class="space-y-2">
                <label for="city" class="text-sm font-medium text-foreground">City</label>
                <select 
                  id="city" 
                  v-model="newGroup.city_id" 
                  class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  required
                >
                  <option value="" disabled>Select a city</option>
                  <option v-for="city in cities" :key="city.city_id" :value="city.city_id">
                    {{ city.city_name }}
                  </option>
                </select>
              </div>
              
              <!-- Submit Button -->
              <button 
                type="submit" 
                class="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                :disabled="creatingGroup"
              >
                {{ creatingGroup ? 'Creating...' : 'Create Group' }}
              </button>
              
              <!-- Success/Error Messages -->
              <div v-if="createMessage" class="p-3 bg-green-100 text-green-800 text-sm rounded-md">
                {{ createMessage }}
              </div>
              
              <div v-if="createError" class="p-3 bg-destructive/20 text-destructive text-sm rounded-md">
                {{ createError }}
              </div>
            </form>
          </div>
          
          <!-- Invite User Form -->
          <div class="bg-card rounded-lg shadow-md border border-border p-6 space-y-4 mt-6">
            <h2 class="text-xl font-semibold text-foreground mb-4">Invite User</h2>
            
            <form @submit.prevent="inviteUser" class="space-y-4">
              <!-- Group Selection -->
              <div class="space-y-2">
                <label for="inviteGroup" class="text-sm font-medium text-foreground">Select Group</label>
                <select 
                  id="inviteGroup" 
                  v-model="invitation.group_id" 
                  class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  required
                >
                  <option value="" disabled>Select a group</option>
                  <option v-for="group in userGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
              
              <!-- Phone Number -->
              <div class="space-y-2">
                <label for="invitePhone" class="text-sm font-medium text-foreground">User Phone Number</label>
                <input 
                  type="text" 
                  id="invitePhone" 
                  v-model="invitation.phone_number" 
                  class="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <!-- Submit Button -->
              <button 
                type="submit" 
                class="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                :disabled="sendingInvite || userGroups.length === 0"
              >
                {{ sendingInvite ? 'Sending...' : 'Send Invitation' }}
              </button>
              
              <p v-if="userGroups.length === 0" class="text-sm text-muted-foreground text-center">
                Create a group first to invite users
              </p>
              
              <!-- Success/Error Messages -->
              <div v-if="inviteMessage" class="p-3 bg-green-100 text-green-800 text-sm rounded-md">
                {{ inviteMessage }}
              </div>
              
              <div v-if="inviteError" class="p-3 bg-destructive/20 text-destructive text-sm rounded-md">
                {{ inviteError }}
              </div>
            </form>
          </div>
        </div>
        
        <!-- Groups and Invitations -->
        <div class="md:col-span-2">
          <!-- Pending Invitations -->
          <div class="bg-card rounded-lg shadow-md border border-border p-6 mb-6">
            <h2 class="text-xl font-semibold text-foreground mb-4">Pending Invitations</h2>
            
            <div v-if="pendingInvitations.length === 0" class="text-center py-4 text-muted-foreground">
              No pending invitations.
            </div>
            
            <div v-else class="space-y-3">
              <div 
                v-for="invite in pendingInvitations" 
                :key="invite.id" 
                class="border border-border rounded-md p-3"
              >
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-medium text-foreground">{{ invite.group_name }}</h3>
                    <p class="text-sm text-muted-foreground">From: {{ invite.from_name }}</p>
                    <p class="text-xs text-muted-foreground">City: {{ invite.city_name }}</p>
                  </div>
                  <div class="flex gap-2">
                    <button 
                      @click="respondToInvite(invite.id, 'accepted')" 
                      class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                      :disabled="respondingToInvite"
                    >
                      Accept
                    </button>
                    <button 
                      @click="respondToInvite(invite.id, 'denied')" 
                      class="px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                      :disabled="respondingToInvite"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- My Groups -->
          <div class="bg-card rounded-lg shadow-md border border-border p-6">
            <h2 class="text-xl font-semibold text-foreground mb-4">My Groups</h2>
            
            <div v-if="userGroups.length === 0" class="text-center py-8 text-muted-foreground">
              You haven't created or joined any groups yet.
            </div>
            
            <div v-else class="space-y-4">
              <div 
                v-for="group in userGroups" 
                :key="group.id" 
                class="border border-border rounded-md p-4"
              >
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h3 class="font-medium text-foreground">{{ group.name }}</h3>
                    <p class="text-sm text-muted-foreground">City: {{ group.city_name }}</p>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ group.is_admin ? 'You are the admin' : '' }}
                    </p>
                  </div>
                  
                  <div class="flex gap-2">
                    <button 
                      @click="loadGroupMembers(group)" 
                      class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm"
                      :disabled="loadingMembers"
                    >
                      {{ group.showMembers ? 'Hide Members' : 'Show Members' }}
                    </button>
                    
                    <!-- Leave Group Button (shown only if user is not the admin) -->
                    <button 
                      v-if="!group.is_admin"
                      @click="leaveGroup(group)" 
                      class="px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 text-sm"
                      :disabled="leavingGroup === group.id"
                    >
                      {{ leavingGroup === group.id ? 'Leaving...' : 'Leave' }}
                    </button>

                    <!-- Delete Group Button (shown only if user is the admin) -->
                    <button 
                      v-if="group.is_admin"
                      @click="deleteGroup(group)" 
                      class="px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 text-sm"
                      :disabled="deletingGroup === group.id"
                    >
                      {{ deletingGroup === group.id ? 'Deleting...' : 'Delete Group' }}
                    </button>
                  </div>
                </div>
                
                <!-- Group Members -->
                <div v-if="group.showMembers" class="pt-2 border-t border-border mt-2">
                  <h4 class="font-medium text-sm text-foreground mb-2">Members</h4>
                  
                  <div v-if="group.members && group.members.length > 0">
                    <ul class="space-y-1">
                      <li 
                        v-for="member in group.members" 
                        :key="member.id" 
                        class="flex justify-between items-center py-1"
                      >
                        <span class="text-sm text-foreground">{{ member.name }}</span>
                        <span 
                          v-if="member.is_admin" 
                          class="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground"
                        >
                          Admin
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div v-else class="text-sm text-muted-foreground text-center py-2">
                    Loading members...
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

// Ref variables
const cities = ref([]);
const userGroups = ref([]);
const pendingInvitations = ref([]);
const userData = ref(null);
const isLoading = ref(true);
const creatingGroup = ref(false);
const sendingInvite = ref(false);
const respondingToInvite = ref(false);
const loadingMembers = ref(false);
const leavingGroup = ref(null); // Stores the ID of the group being left
const deletingGroup = ref(null); // Stores the ID of the group being deleted

// Form blank data
const newGroup = ref({
  name: '',
  city_id: ''
});

const invitation = ref({
  group_id: '',
  phone_number: ''
});

// Error, success, invite messages
const createMessage = ref('');
const createError = ref('');
const inviteMessage = ref('');
const inviteError = ref('');

// Check authentication and load data
onMounted(async () => {
  // auth is stored in local storage (not secure, for demo purposes)
  const auth = localStorage.getItem('auth');
  if (!auth) {
    return navigateTo('/login');
  }
  
  try {
    userData.value = JSON.parse(auth);
    
    // Load data
    await Promise.all([
      loadCities(),
      loadGroupsData()
    ]);
    
    isLoading.value = false;
  } catch (error) {
    console.error('Error initializing groups page:', error);
    isLoading.value = false;
  }
});

// Load cities
const loadCities = async () => {
  try {
    const response = await $fetch('/api/cities');
    if (response && response.cities) {
      cities.value = response.cities;
    }
  } catch (error) {
    console.error('Error loading cities:', error);
  }
};

// Load user's groups and invitations
const loadGroupsData = async () => {
  try {
    const response = await $fetch(`/api/groups?user_id=${userData.value.user_id}`);
    
    if (response) {
      // Map groups and add showMembers flag
      userGroups.value = response.groups.map(group => ({
        ...group,
        showMembers: false,
        members: null
      }));
      
      pendingInvitations.value = response.invitations;
    }
  } catch (error) {
    console.error('Error loading groups data:', error);
  }
};

// Load group members (show after toggle)
const loadGroupMembers = async (group) => {
  // Toggle the members visibility
  group.showMembers = !group.showMembers;
  
  // If hiding members or already loaded, do nothing
  if (!group.showMembers || (group.members && group.members.length > 0)) {
    return;
  }
  
  // Load members
  loadingMembers.value = true;
  
  try {
    const response = await $fetch(`/api/groups?user_id=${userData.value.user_id}&group_id=${group.id}`);
    
    if (response && response.group) {
      // Update group data with members
      group.members = response.group.members;
    }
  } catch (error) {
    console.error('Error loading group members:', error);
    group.showMembers = false; // Hide members on error
  } finally {
    loadingMembers.value = false;
  }
};

// Create a new group
const createGroup = async () => {
  // Reset message vals
  createMessage.value = '';
  createError.value = '';
  creatingGroup.value = true;
  
  // Basic validation
  if (!newGroup.value.name || !newGroup.value.city_id) {
    createError.value = 'Group name and city are required.';
    creatingGroup.value = false;
    return;
  }
  
  try {
    const response = await $fetch('/api/groups/create', {
      method: 'POST',
      body: {
        name: newGroup.value.name,
        city_id: parseInt(newGroup.value.city_id),
        admin_id: userData.value.user_id
      }
    });
    
    if (response && response.group) {
      // Add the new group to the list with showMembers flag
      userGroups.value.push({
        ...response.group,
        showMembers: false,
        members: null
      });
      
      // Sort groups by name
      userGroups.value.sort((a, b) => a.name.localeCompare(b.name));
      
      // Show success message
      createMessage.value = response.message || 'Group created successfully.';
      
      // Reset form
      newGroup.value = {
        name: '',
        city_id: ''
      };
    }
  } catch (error) {
    console.error('Error creating group:', error);
    createError.value = error.statusMessage || 'Error creating group. Please try again.';
  } finally {
    creatingGroup.value = false;
  }
};

// Invite a user to a group
const inviteUser = async () => {
  // Reset messages
  inviteMessage.value = '';
  inviteError.value = '';
  sendingInvite.value = true;
  
  // Basic validation
  if (!invitation.value.group_id || !invitation.value.phone_number) {
    inviteError.value = 'Group and phone number are required.';
    sendingInvite.value = false;
    return;
  }
  
  // Validate phone number format
  // Only 10 digit check
  if (!/^\d{10}$/.test(invitation.value.phone_number)) {
    inviteError.value = 'Please enter a valid 10-digit phone number.';
    sendingInvite.value = false;
    return;
  }
  
  try {
    const response = await $fetch('/api/groups/invite', {
      method: 'POST',
      body: {
        group_id: invitation.value.group_id,
        phone_number: invitation.value.phone_number,
        inviter_id: userData.value.user_id
      }
    });
    
    // Show success message
    inviteMessage.value = response.message || 'Invitation sent successfully.';
    
    // Reset form
    invitation.value = {
      group_id: '',
      phone_number: ''
    };
  } catch (error) {
    console.error('Error sending invitation:', error);
    inviteError.value = error.statusMessage || 'Error sending invitation. Please try again.';
  } finally {
    sendingInvite.value = false;
  }
};

// Respond to an invitation
const respondToInvite = async (groupId, status) => {
  respondingToInvite.value = true;
  
  try {
    const response = await $fetch('/api/groups/respond', {
      method: 'PUT',
      body: {
        group_id: groupId,
        user_id: userData.value.user_id,
        status: status
      }
    });
    
    // Handle acceptance
    if (status === 'accepted' && response.group) {
      // Add the group to user's groups
      userGroups.value.push({
        ...response.group,
        showMembers: false,
        members: null
      });
      // If not accepted only remove invitation below
      
      // Sort groups by name
      userGroups.value.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Remove the invitation from the list
    pendingInvitations.value = pendingInvitations.value.filter(inv => inv.id !== groupId);
  } catch (error) {
    console.error('Error responding to invitation:', error);
    alert(error.statusMessage || 'Error responding to invitation. Please try again.');
  } finally {
    respondingToInvite.value = false;
  }
};

// Leave a group
const leaveGroup = async (group) => {
  // Confirm with the user
  if (!confirm(`Are you sure you want to leave the group "${group.name}"?`)) {
    return;
  }
  
  leavingGroup.value = group.id;
  
  try {
    const response = await $fetch('/api/groups/leave', {
      method: 'DELETE',
      body: {
        group_id: group.id,
        user_id: userData.value.user_id
      }
    });
    
    // Remove the group from the list
    userGroups.value = userGroups.value.filter(g => g.id !== group.id);
    
    // Show success message
    alert(response.message || 'You have left the group successfully.');
  } catch (error) {
    console.error('Error leaving group:', error);
    alert(error.statusMessage || 'Error leaving group. Please try again.');
  } finally {
    leavingGroup.value = null;
  }
};

// Delete a group (admin only)
const deleteGroup = async (group) => {
  // Confirm with the user with a more serious warning
  if (!confirm(`WARNING: Are you sure you want to delete the group "${group.name}"?\n\nThis action cannot be undone and will remove all members from the group.`)) {
    return;
  }
  
  deletingGroup.value = group.id;
  
  try {
    const response = await $fetch('/api/groups/delete', {
      method: 'DELETE',
      body: {
        group_id: group.id,
        user_id: userData.value.user_id
      }
    });
    
    // Remove the group from the list
    userGroups.value = userGroups.value.filter(g => g.id !== group.id);
    
    // Show success message
    alert(response.message || 'Group deleted successfully.');
  } catch (error) {
    console.error('Error deleting group:', error);
    alert(error.statusMessage || 'Error deleting group. Please try again.');
  } finally {
    deletingGroup.value = null;
  }
};
</script> 