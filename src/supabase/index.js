export { supabase, isSupabaseConfigured, isAuthenticated, getCurrentUser } from './client';
export { getAnchors, createAnchor, updateAnchor, deleteAnchor } from './anchors';
export { getProfile, createProfile, updateProfile, addXP, getMomentum } from './profiles';
export { getTodaySessions, getSessionsByAnchor, createSession, calculateSessionXP, awardSessionXP, getTotalSessionTime, getTotalSessionCount } from './sessions';