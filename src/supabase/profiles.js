import { supabase } from './client';

// Fetch the current user's profile
export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching profile:', error);
    throw error;
  }

  return data;
};

// Create a profile for a new user (called after signup)
export const createProfile = async (userId, username = null) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username: username || `user_${userId.slice(0, 8)}`,
      total_xp: 0,
      level: 1,
      momentum: 50,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data;
};

// Update profile (XP, level, momentum)
export const updateProfile = async (updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
};

// Update user's XP
export const addXP = async (amount) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  // First get current XP
  const profile = await getProfile();
  const newXP = (profile?.total_xp || 0) + amount;

  const { data, error } = await supabase
    .from('profiles')
    .update({ total_xp: newXP })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error adding XP:', error);
    throw error;
  }

  return data;
};

// Get momentum for current user
export const getMomentum = async () => {
  const profile = await getProfile();
  return profile?.momentum || 50;
};