import { useState } from "react";
import { BACKEND_URL } from "../services/api";
import "./GoogleChooserModal.css";

function GoogleChooserModal({ onClose }) {
  const [customEmail, setCustomEmail] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Read provider query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const provider = searchParams.get("provider") || "google";

  const mockGoogleAccounts = [
    {
      name: "Srikanth Girijala",
      email: "srikanthgirijala073@gmail.com",
      googleId: "google-1092837482",
      avatar: "https://lh3.googleusercontent.com/a/default-user=s120-c",
    },
    {
      name: "Demo Manager",
      email: "demo.manager@gmail.com",
      googleId: "google-1122334455",
      avatar: "https://lh3.googleusercontent.com/a/default-user=s120-c",
    },
    {
      name: "Cleaning staff",
      email: "staff@example.com",
      googleId: "google-9988776655",
      avatar: "https://lh3.googleusercontent.com/a/default-user=s120-c",
    }
  ];

  const mockGithubAccounts = [
    {
      name: "Octocat",
      email: "octocat@github.com",
      googleId: "github-123456",
      avatar: "",
    },
    {
      name: "Srikanth (GitHub)",
      email: "srikanthgirijala073@gmail.com",
      googleId: "github-789012",
      avatar: "",
    }
  ];

  const mockMicrosoftAccounts = [
    {
      name: "Srikanth (Microsoft)",
      email: "srikanthgirijala073@gmail.com",
      googleId: "microsoft-556677",
      avatar: "",
    },
    {
      name: "Corporate Manager",
      email: "demo.manager@gmail.com",
      googleId: "microsoft-889900",
      avatar: "",
    }
  ];

  const getMockAccounts = () => {
    if (provider === "github") return mockGithubAccounts;
    if (provider === "microsoft") return mockMicrosoftAccounts;
    return mockGoogleAccounts;
  };

  const mockAccounts = getMockAccounts();

  const handleSelectAccount = (account) => {
    const query = new URLSearchParams({
      email: account.email,
      name: account.name,
      googleId: account.googleId,
      profileImage: account.avatar
    }).toString();

    // Redirect to mock endpoint depending on provider
    const endpoint = provider === "github" ? "github/mock-login" : (provider === "microsoft" ? "microsoft/mock-login" : "google/mock-login");
    window.location.href = `${BACKEND_URL}/api/auth/${endpoint}?${query}`;
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;

    const nameFromEmail = customEmail.split("@")[0];
    const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    handleSelectAccount({
      name: capitalizedName,
      email: customEmail,
      googleId: `${provider}-mock-${Date.now()}`,
      avatar: ""
    });
  };

  const getProviderName = () => {
    if (provider === "github") return "GitHub";
    if (provider === "microsoft") return "Microsoft";
    return "Google";
  };

  return (
    <div className="google-chooser-overlay">
      <div className="google-chooser-card">
        
        {/* Branding Header */}
        <div className="google-header">
          {provider === "google" && (
            <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg" className="google-icon-header">
              <g>
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.29c1.92,-1.77 3.02,-4.38 3.02,-7.4C21.65,11.75 21.55,11.4 21.35,11.1z" fill="#4285F4" />
                <path d="M12,20.5c2.43,0 4.47,-0.8 5.96,-2.2l-3.29,-2.6c-0.9,0.6 -2.07,0.97 -3.67,0.97 -2.83,0 -5.23,-1.91 -6.08,-4.48H1.53v2.7C3.02,17.92 7.18,20.5 12,20.5z" fill="#34A853" />
                <path d="M5.92,12.19c-0.22,-0.66 -0.35,-1.37 -0.35,-2.09s0.13,-1.43 0.35,-2.09V5.31H1.53c-0.78,1.57 -1.23,3.34 -1.23,5.19s0.45,3.62 1.23,5.19L5.92,12.19z" fill="#FBBC05" />
                <path d="M12,5.23c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.51 14.43,2 12,2C7.18,2 3.02,4.58 1.53,7.61l4.39,3.38C6.77,8.42 9.17,6.23 12,5.23z" fill="#EA4335" />
              </g>
            </svg>
          )}

          {provider === "microsoft" && (
            <svg viewBox="0 0 23 23" width="32" height="32" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "12px" }}>
              <path d="M0 0h11v11H0z" fill="#F25022" />
              <path d="M12 0h11v11H12z" fill="#7FBA00" />
              <path d="M0 12h11v11H0z" fill="#00A4EF" />
              <path d="M12 12h11v11H12z" fill="#FFB900" />
            </svg>
          )}

          {provider === "github" && (
            <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: "12px" }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          )}

          <h2>Choose an account</h2>
          <p>to continue with <span>{getProviderName()}</span></p>
        </div>

        {/* Content list */}
        {!showCustomInput ? (
          <div className="google-accounts-list">
            {mockAccounts.map((account, index) => (
              <div 
                key={index} 
                className="google-account-item" 
                onClick={() => handleSelectAccount(account)}
              >
                <div className="google-avatar-img">
                  {account.name.charAt(0)}
                </div>
                <div className="google-account-details">
                  <div className="google-account-name">{account.name}</div>
                  <div className="google-account-email">{account.email}</div>
                </div>
              </div>
            ))}

            <div 
              className="google-account-item use-another-item"
              onClick={() => setShowCustomInput(true)}
            >
              <div className="google-avatar-img another-avatar">
                👤
              </div>
              <div className="google-account-details">
                <div className="google-account-name" style={{ color: "#2563eb", fontWeight: "600" }}>
                  Use another email address
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="google-custom-email-form">
            <input
              type="email"
              placeholder="Enter your Gmail/Email address"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="google-custom-input"
              required
              autoFocus
            />
            <div className="google-custom-buttons">
              <button 
                type="button" 
                className="google-cancel-btn"
                onClick={() => setShowCustomInput(false)}
              >
                Back
              </button>
              <button type="submit" className="google-next-btn">
                Continue
              </button>
            </div>
          </form>
        )}

        <div className="google-footer-actions">
          <p className="google-notice">
            To make local sign-in easy, this simulator bypasses the external OAuth screen.
          </p>
          <button className="google-close-btn-main" onClick={onClose} type="button">
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

export default GoogleChooserModal;
