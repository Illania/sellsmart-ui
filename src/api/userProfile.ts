import type { User } from "@supabase/supabase-js";

import { supabase } from "../supabaseClient";

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string;
  onboardingVersion: number;
  onboardingCompletedAt: string | null;
};

function getGoogleAvatarUrl(user: User) {
  return (
    user.user_metadata.avatar_url ??
    user.user_metadata.picture ??
    ""
  );
}

function normalizeProfile(row: any, user: User): UserProfile {
  return {
    id: user.id,
    email: row?.email ?? user.email ?? null,
    displayName: row?.display_name ?? "",
    avatarUrl: row?.avatar_url ?? getGoogleAvatarUrl(user),
    onboardingVersion: Number(row?.onboarding_version ?? 0),
    onboardingCompletedAt: row?.onboarding_completed_at ?? null,
  };
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const now = new Date().toISOString();
  const fallbackAvatarUrl = getGoogleAvatarUrl(user);

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select(
      "id, email, display_name, avatar_url, onboarding_version, onboarding_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const updates: Record<string, string> = {};

    if (!existing.email && user.email) updates.email = user.email;
    if (!existing.avatar_url && fallbackAvatarUrl) {
      updates.avatar_url = fallbackAvatarUrl;
    }

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: now })
        .eq("id", user.id)
        .select(
          "id, email, display_name, avatar_url, onboarding_version, onboarding_completed_at",
        )
        .single();

      if (error) throw error;
      return normalizeProfile(data, user);
    }

    return normalizeProfile(existing, user);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      display_name: "",
      avatar_url: fallbackAvatarUrl || null,
      onboarding_version: 0,
      created_at: now,
      updated_at: now,
    })
    .select(
      "id, email, display_name, avatar_url, onboarding_version, onboarding_completed_at",
    )
    .single();

  if (error) throw error;

  return normalizeProfile(data, user);
}

export async function loadUserProfile(user: User): Promise<UserProfile> {
  return ensureUserProfile(user);
}

export async function saveUserProfile(
  user: User,
  profile: Pick<UserProfile, "displayName" | "avatarUrl">,
): Promise<UserProfile> {
  await ensureUserProfile(user);

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      email: user.email ?? null,
      display_name: profile.displayName.trim(),
      avatar_url: profile.avatarUrl || null,
      updated_at: now,
    })
    .eq("id", user.id)
    .select(
      "id, email, display_name, avatar_url, onboarding_version, onboarding_completed_at",
    )
    .single();

  if (error) throw error;

  return normalizeProfile(data, user);
}

export async function updateOnboardingVersion(
  user: User,
  onboardingVersion: number,
): Promise<UserProfile> {
  await ensureUserProfile(user);

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      email: user.email ?? null,
      onboarding_version: onboardingVersion,
      onboarding_completed_at: now,
      updated_at: now,
    })
    .eq("id", user.id)
    .select(
      "id, email, display_name, avatar_url, onboarding_version, onboarding_completed_at",
    )
    .single();

  if (error) throw error;

  return normalizeProfile(data, user);
}
