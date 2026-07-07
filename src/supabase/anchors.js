import { supabase } from './client';

// Fetch all anchors for the current user
export const getAnchors = async () => {
  const { data, error } = await supabase
    .from('anchors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching anchors:', error);
    throw error;
  }

  return data || [];
};

// Create a new anchor
export const createAnchor = async (anchor) => {
  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // In dev mode, show helpful message
    if (__DEV__) {
      throw new Error('Please log in or use Skip Login (Dev) on the Login screen');
    }
    throw new Error('User must be authenticated to create anchors');
  }

  const { data, error } = await supabase
    .from('anchors')
    .insert({
      user_id: user.id,
      title: anchor.title,
      color: anchor.color || '#007AFF',
      icon: anchor.icon || 'anchor',
      target_days: anchor.targetDays || 7,
      minimum_duration: anchor.minimumDuration || 15,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating anchor:', error);
    throw error;
  }

  return data;
};

// Update an existing anchor
export const updateAnchor = async (id, updates) => {
  const { data, error } = await supabase
    .from('anchors')
    .update({
      title: updates.title,
      color: updates.color,
      icon: updates.icon,
      target_days: updates.targetDays,
      minimum_duration: updates.minimumDuration,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating anchor:', error);
    throw error;
  }

  return data;
};

// Delete an anchor (cascade deletes sessions based on DB schema)
export const deleteAnchor = async (id) => {
  const { error } = await supabase
    .from('anchors')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting anchor:', error);
    throw error;
  }

  return true;
};

// Subscribe to anchor changes in real-time
export const subscribeToAnchors = (callback) => {
  const subscription = supabase
    .channel('anchors-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'anchors' },
      (payload) => callback(payload)
    )
    .subscribe();

  return subscription;
};