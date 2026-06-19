import { Camera, Crown, LogOut, ShieldAlert, User as UserIcon } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import type { User } from "@supabase/supabase-js";

import {
  saveUserProfile,
  type UserProfile,
} from "../api/userProfile";

const SAVE_FEEDBACK_MS = 1800;

const emptyProfile = {
  displayName: "",
  avatarUrl: "",
};

type Props = {
  user: User;
  userProfile: UserProfile | null;
  userEmail?: string;
  userAvatarUrl?: string;
  onProfileSaved: (profile: UserProfile) => void;
  onLogout: () => void;
  onResetAppData: () => void;
};

export function ProfilePage({
  user,
  userProfile,
  userEmail,
  userAvatarUrl,
  onProfileSaved,
  onLogout,
  onResetAppData,
}: Props) {
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName ?? emptyProfile.displayName,
  );
  const [avatarUrl, setAvatarUrl] = useState(
    userProfile?.avatarUrl || userAvatarUrl || emptyProfile.avatarUrl,
  );
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(userProfile?.displayName ?? emptyProfile.displayName);
    setAvatarUrl(userProfile?.avatarUrl || userAvatarUrl || emptyProfile.avatarUrl);
  }, [userProfile, userAvatarUrl]);

  const avatarText = getAvatarText(displayName || userEmail);

  const saveProfile = async (next?: {
    displayName?: string;
    avatarUrl?: string;
  }) => {
    const profile = {
      displayName: next?.displayName ?? displayName,
      avatarUrl: next?.avatarUrl ?? avatarUrl,
    };

    try {
      setIsSaving(true);
      setSaveError(null);

      const savedProfile = await saveUserProfile(user, profile);

      onProfileSaved(savedProfile);
      setDisplayName(savedProfile.displayName);
      setAvatarUrl(savedProfile.avatarUrl || userAvatarUrl || "");
      setSaved(true);

      window.setTimeout(() => setSaved(false), SAVE_FEEDBACK_MS);
    } catch (error) {
      console.error(error);
      setSaveError("Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const nextAvatarUrl = String(reader.result ?? "");

      setAvatarUrl(nextAvatarUrl);
      void saveProfile({ avatarUrl: nextAvatarUrl });
    };

    reader.readAsDataURL(file);
  };

  const handleResetProfile = () => {
    setDisplayName("");
    setAvatarUrl(userAvatarUrl || "");
    setSaved(false);
    setSaveError(null);
    void saveProfile({ displayName: "", avatarUrl: "" });
  };

  return (
    <section className="profile-page">
      <div className="profile-grid">
        <div className="profile-card profile-main-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-preview">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" />
              ) : (
                <span>{avatarText}</span>
              )}
            </div>

            <div>
              <h2>Your profile</h2>
              <p>Manage your SellSmart account identity and preferences.</p>

              <label className="profile-upload-button">
                <Camera size={18} />
                Upload photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} />
              </label>
            </div>
          </div>

          <div className="profile-form">
            <label>
              <span>Display name</span>
              <input
                value={displayName}
                placeholder="Your name"
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <label>
              <span>Email</span>
              <input value={userEmail ?? "No email available"} disabled />
            </label>

            <button
              type="button"
              className="primary-button profile-save-button"
              onClick={() => void saveProfile()}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>

            {saved && <p className="profile-saved-note">Profile saved</p>}
            {saveError && <p className="profile-saved-note">{saveError}</p>}
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <Crown size={22} />
            <div>
              <h2>Account plan</h2>
              <p>Your current SellSmart subscription.</p>
            </div>
          </div>

          <div className="profile-plan-box">
            <span>Current plan</span>
            <strong>Free</strong>
            <p>
              Portfolio risk analysis, watchlist monitoring, alerts, insights, and
              reports are available in the current MVP plan.
            </p>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <UserIcon size={22} />
            <div>
              <h2>Account actions</h2>
              <p>Manage your active session.</p>
            </div>
          </div>

          <button type="button" className="secondary-button profile-action-button" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <div className="profile-card danger-zone profile-danger-card">
          <div className="profile-card-header">
            <ShieldAlert size={22} />
            <div>
              <h2>Danger zone</h2>
              <p>These actions affect your saved SellSmart data.</p>
            </div>
          </div>

          <div className="profile-danger-actions">
            <button
              type="button"
              className="secondary-button profile-action-button"
              onClick={handleResetProfile}
              disabled={isSaving}
            >
              Reset profile
            </button>

            <button
              type="button"
              className="secondary-button profile-action-button danger-button"
              onClick={onResetAppData}
            >
              Reset app data
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function getAvatarText(value?: string) {
  if (!value) return "SS";

  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "");

  if (!cleaned) return "SS";

  return cleaned.slice(0, 2).toUpperCase();
}
