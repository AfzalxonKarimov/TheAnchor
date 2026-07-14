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

  const title = (anchor.title || '').trim();
  if (!title) {
    throw new Error('Anchor name is required');
  }

  // Prevent duplicates: one anchor per title per user (case-insensitive).
  // This is the first line of defense; the DB unique index (migration 0005)
  // is the real guarantee against races.
  const { data: existing, error: dupError } = await supabase
    .from('anchors')
    .select('id')
    .eq('user_id', user.id)
    .ilike('title', title)
    .limit(1);

  if (dupError) {
    console.error('Error checking for duplicate anchor:', dupError);
    throw dupError;
  }
  if (existing && existing.length > 0) {
    throw new Error(`You already have an anchor called "${title}".`);
  }

  const { data, error } = await supabase
    .from('anchors')
    .insert({
      user_id: user.id,
      title,
      color: anchor.color || '#007AFF',
      icon: anchor.icon || 'anchor',
      target_days: anchor.targetDays || 7,
      minimum_duration: anchor.minimumDuration || 15,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation: the DB unique index caught a duplicate that
    // slipped past the check above (e.g. a rapid double-tap / race).
    if (error.code === '23505') {
      throw new Error(`You already have an anchor called "${title}".`);
    }
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
    // 23505 = unique_violation: renaming onto an existing anchor title.
    if (error.code === '23505') {
      throw new Error(`You already have an anchor called "${updates.title}".`);
    }
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