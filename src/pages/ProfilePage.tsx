import { Camera, Crown, LogOut, ShieldAlert, User } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  userEmail?: string;
  onLogout: () => void;
  onResetAppData: () => void;
};

export function ProfilePage({ userEmail, onLogout, onResetAppData }: Props) {
  const storageKey = userEmail ? `sellsmart-profile-${userEmail}` : "sellsmart-profile";

  const savedProfile = useMemo(() => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return {
        displayName: "",
        avatarUrl: "",
      };
    }

    try {
      return JSON.parse(raw) as {
        displayName: string;
        avatarUrl: string;
      };
    } catch {
      return {
        displayName: "",
        avatarUrl: "",
      };
    }
  }, [storageKey]);

  const [displayName, setDisplayName] = useState(savedProfile.displayName);
  const [avatarUrl, setAvatarUrl] = useState(savedProfile.avatarUrl);
  const [saved, setSaved] = useState(false);

  const avatarText = getAvatarText(displayName || userEmail);

  const saveProfile = (next?: { displayName?: string; avatarUrl?: string }) => {
    const profile = {
      displayName: next?.displayName ?? displayName,
      avatarUrl: next?.avatarUrl ?? avatarUrl,
    };

    localStorage.setItem(storageKey, JSON.stringify(profile));
    setSaved(true);

    window.setTimeout(() => setSaved(false), 1800);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const nextAvatarUrl = String(reader.result ?? "");

      setAvatarUrl(nextAvatarUrl);
      saveProfile({ avatarUrl: nextAvatarUrl });
    };

    reader.readAsDataURL(file);
  };

  const handleResetProfile = () => {
    localStorage.removeItem(storageKey);
    setDisplayName("");
    setAvatarUrl("");
    setSaved(false);
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
              onClick={() => saveProfile()}
            >
              Save profile
            </button>

            {saved && <p className="profile-saved-note">Profile saved</p>}
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
            <User size={22} />
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
              <p>These actions affect locally saved SellSmart data.</p>
            </div>
          </div>

          <div className="profile-danger-actions">
            <button
              type="button"
              className="secondary-button profile-action-button"
              onClick={handleResetProfile}
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