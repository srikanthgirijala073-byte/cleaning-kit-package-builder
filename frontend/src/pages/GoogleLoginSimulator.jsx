import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BACKEND_URL } from "../services/api";
import "./GoogleLoginSimulator.css";

function GoogleLoginSimulator() {
  const { provider = "google" } = useParams();
  const [searchParams] = useSearchParams();

  // Route callback handler state
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refreshToken");
  const historyId = searchParams.get("historyId");
  const oauthError = searchParams.get("error");

  // Authentication stages:
  // "choose" - Select from pre-configured accounts or click "Use another account"
  // "email" - Input custom email
  // "password" - Input password
  // "loading" - Simulation of authorization check
  const [stage, setStage] = useState("choose");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const mockAccounts = {
    google: [
      {
        name: "Srikanth Girijala",
        email: "srikanthgirijala073@gmail.com",
        googleId: "google-1092837482",
        avatar: "S",
        color: "#1a73e8"
      },
      {
        name: "Demo Manager",
        email: "demo.manager@gmail.com",
        googleId: "google-1122334455",
        avatar: "D",
        color: "#0f9d58"
      },
      {
        name: "Cleaning staff",
        email: "staff@example.com",
        googleId: "google-9988776655",
        avatar: "C",
        color: "#f4b400"
      }
    ],
    github: [
      {
        name: "Octocat",
        email: "octocat@github.com",
        googleId: "github-123456",
        avatar: "O",
        color: "#24292e"
      },
      {
        name: "Srikanth (GitHub)",
        email: "srikanthgirijala073@gmail.com",
        googleId: "github-789012",
        avatar: "S",
        color: "#6f42c1"
      }
    ],
    microsoft: [
      {
        name: "Srikanth (Microsoft)",
        email: "srikanthgirijala073@gmail.com",
        googleId: "microsoft-556677",
        avatar: "S",
        color: "#00a4ef"
      },
      {
        name: "Corporate Manager",
        email: "demo.manager@gmail.com",
        googleId: "microsoft-889900",
        avatar: "C",
        color: "#ffb900"
      }
    ]
  };

  const currentMockAccounts = mockAccounts[provider] || mockAccounts.google;

  // 1. Detect if this is the callback redirect from backend
  useEffect(() => {
    if (token && refreshToken) {
      if (window.opener) {
        // Post message to the parent window
        window.opener.postMessage(
          {
            type: "OAUTH_SUCCESS",
            token,
            refreshToken,
            historyId
          },
          "*"
        );
      }
      // Close popup window
      setTimeout(() => {
        window.close();
      }, 800);
    }
  }, [token, refreshToken, historyId]);

  // 1a. Handle OAuth error callbacks
  useEffect(() => {
    if (oauthError) {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "OAUTH_FAILURE",
            error: oauthError
          },
          "*"
        );
      }
      setTimeout(() => {
        window.close();
      }, 800);
    }
  }, [oauthError]);

  // If callback is loading, show closing window state
  if (token && refreshToken) {
    return (
      <div className={`simulator-popup-container ${provider}-theme`}>
        <div className="simulator-callback-card">
          <div className="spinner"></div>
          <h2>Completing Sign-In...</h2>
          <p>This window will close automatically.</p>
        </div>
      </div>
    );
  }

  // If callback failed, show closing window state with error
  if (oauthError) {
    return (
      <div className={`simulator-popup-container ${provider}-theme`}>
        <div className="simulator-callback-card">
          <div className="error-icon" style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
          <h2>Authentication Failed</h2>
          <p>Closing window and returning details...</p>
        </div>
      </div>
    );
  }

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setEmail(account.email);
    if (provider === "google") {
      setStage("continue");
    } else {
      setStage("password");
    }
    setError("");
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError("Enter an email address");
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    if (provider === "google") {
      setStage("continue");
    } else {
      setStage("password");
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError("Enter a password");
      return;
    }
    setError("");
    handleContinue();
  };

  const handleContinue = () => {
    if (!email) {
      setError("Enter an email address");
      return;
    }

    setError("");
    setStage("loading");

    const nameFromEmail = email.split("@")[0];
    const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    const displayName = selectedAccount ? selectedAccount.name : capitalizedName;
    const providerId = selectedAccount
      ? selectedAccount.googleId
      : `${provider}-mock-${Date.now()}`;

    const query = new URLSearchParams({
      email: email,
      name: displayName,
      googleId: providerId,
      profileImage: ""
    }).toString();

    const endpoint =
      provider === "github"
        ? "github/mock-login"
        : provider === "microsoft"
        ? "microsoft/mock-login"
        : "google/mock-login";

    setTimeout(() => {
      window.location.href = `${BACKEND_URL}/api/auth/${endpoint}?${query}`;
    }, 500);
  };

  const handleBackToEmail = () => {
    setError("");
    setPassword("");
    if (selectedAccount) {
      setStage("choose");
      setSelectedAccount(null);
    } else {
      setStage("email");
    }
  };

  // Google Layout Render
  const renderGoogle = () => {
    return (
      <div className="google-card">
        <div className="google-logo">
          <span style={{ color: "#4285F4" }}>G</span>
          <span style={{ color: "#EA4335" }}>o</span>
          <span style={{ color: "#FBBC05" }}>o</span>
          <span style={{ color: "#4285F4" }}>g</span>
          <span style={{ color: "#34A853" }}>l</span>
          <span style={{ color: "#EA4335" }}>e</span>
        </div>

        {stage === "choose" && (
          <>
            <h1 className="google-title">Choose an account</h1>
            <p className="google-subtitle">to continue to Cleaning Kit Builder</p>

            <div className="google-account-list">
              {currentMockAccounts.map((account, idx) => (
                <div key={idx} className="google-account-item" onClick={() => handleSelectAccount(account)}>
                  <div className="google-avatar" style={{ backgroundColor: account.color }}>
                    {account.avatar}
                  </div>
                  <div className="google-account-info">
                    <div className="google-account-name">{account.name}</div>
                    <div className="google-account-email">{account.email}</div>
                  </div>
                </div>
              ))}

              <div className="google-account-item use-another" onClick={() => setStage("email")}>
                <div className="google-avatar another-avatar">👤</div>
                <div className="google-account-info">
                  <div className="google-account-name" style={{ color: "#1a73e8", fontWeight: "500" }}>
                    Use another account
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {stage === "email" && (
          <form onSubmit={handleEmailSubmit}>
            <h1 className="google-title">Sign in</h1>
            <p className="google-subtitle">to continue to Cleaning Kit Builder</p>

            <div className="google-input-group">
              <input
                type="email"
                required
                className={error ? "google-input error" : "google-input"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                id="google-email"
                autoFocus
              />
              <label htmlFor="google-email" className="google-label">
                Email or phone
              </label>
              {error && <div className="google-error-msg">⚠️ {error}</div>}
            </div>

            <div className="google-help-link">
              <a href="#" onClick={(e) => e.preventDefault()}>Forgot email?</a>
            </div>

            <p className="google-terms-notice">
              Not your computer? Use Guest mode to sign in privately. <a href="#" onClick={(e) => e.preventDefault()}>Learn more</a>
            </p>

            <div className="google-actions">
              <button type="button" className="google-btn-text" onClick={() => setStage("choose")}>
                Back
              </button>
              <button type="submit" className="google-btn-primary">
                Next
              </button>
            </div>
          </form>
        )}

        {stage === "continue" && (
          <div>
            <h1 className="google-title">Continue to Cleaning Kit Builder</h1>
            <p className="google-subtitle">Use the selected account to sign in.</p>

            <div className="google-email-pill" onClick={handleBackToEmail}>
              <span className="pill-avatar">👤</span>
              <span className="pill-email">{email}</span>
              <span className="pill-arrow">▼</span>
            </div>

            {error && <div className="google-error-msg">⚠️ {error}</div>}

            <div className="google-actions" style={{ marginTop: "28px" }}>
              <button type="button" className="google-btn-text" onClick={handleBackToEmail}>
                Choose another account
              </button>
              <button type="button" className="google-btn-primary" onClick={handleContinue}>
                Continue
              </button>
            </div>
          </div>
        )}

        {stage === "loading" && (
          <div className="google-loading-container">
            <div className="google-spinner-logo">
              <div className="google-spinner-sector sector-blue"></div>
              <div className="google-spinner-sector sector-red"></div>
              <div className="google-spinner-sector sector-yellow"></div>
              <div className="google-spinner-sector sector-green"></div>
            </div>
            <h2>Verifying Credentials...</h2>
            <p>One moment, authenticating with Cleaning Kit Builder</p>
          </div>
        )}
      </div>
    );
  };

  // Microsoft Layout Render
  const renderMicrosoft = () => {
    return (
      <div className="microsoft-card">
        <div className="microsoft-logo">
          <div className="ms-box ms-red"></div>
          <div className="ms-box ms-green"></div>
          <div className="ms-box ms-blue"></div>
          <div className="ms-box ms-yellow"></div>
          <span className="ms-brand-name">Microsoft</span>
        </div>

        {stage === "choose" && (
          <>
            <h1 className="ms-title">Pick an account</h1>
            <div className="ms-account-list">
              {currentMockAccounts.map((account, idx) => (
                <div key={idx} className="ms-account-item" onClick={() => handleSelectAccount(account)}>
                  <div className="ms-avatar" style={{ backgroundColor: account.color }}>
                    {account.avatar}
                  </div>
                  <div className="ms-account-info">
                    <div className="ms-account-name">{account.name}</div>
                    <div className="ms-account-email">{account.email}</div>
                  </div>
                </div>
              ))}

              <div className="ms-account-item use-another" onClick={() => setStage("email")}>
                <div className="ms-avatar another-avatar">➕</div>
                <div className="ms-account-info">
                  <div className="ms-account-name" style={{ color: "#0067b8" }}>
                    Use another account
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {stage === "email" && (
          <form onSubmit={handleEmailSubmit}>
            <h1 className="ms-title">Sign in</h1>
            <div className="ms-input-container">
              <input
                type="email"
                required
                className={error ? "ms-input error" : "ms-input"}
                placeholder="Email, phone, or Skype"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {error && <div className="ms-error-msg">{error}</div>}
            </div>

            <p className="ms-notice">
              No account? <a href="#" onClick={(e) => e.preventDefault()}>Create one!</a>
            </p>

            <div className="ms-actions">
              <button type="button" className="ms-btn-secondary" onClick={() => setStage("choose")}>
                Back
              </button>
              <button type="submit" className="ms-btn-primary">
                Next
              </button>
            </div>
          </form>
        )}

        {stage === "password" && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="ms-identity-pill" onClick={handleBackToEmail}>
              <span className="ms-pill-arrow">←</span> {email}
            </div>
            <h1 className="ms-title" style={{ marginTop: "12px" }}>Enter password</h1>

            <div className="ms-input-container">
              <input
                type="password"
                required
                className={error ? "ms-input error" : "ms-input"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <div className="ms-error-msg">{error}</div>}
            </div>

            <p className="ms-notice">
              <a href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </p>

            <div className="ms-actions">
              <button type="button" className="ms-btn-secondary" onClick={handleBackToEmail}>
                Cancel
              </button>
              <button type="submit" className="ms-btn-primary">
                Sign in
              </button>
            </div>
          </form>
        )}

        {stage === "loading" && (
          <div className="ms-loading-container">
            <div className="ms-dots-loader">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <h2>Signing you in...</h2>
            <p>Connecting to Cleaning Kit Package Builder</p>
          </div>
        )}
      </div>
    );
  };

  // GitHub Layout Render
  const renderGithub = () => {
    return (
      <div className="github-card">
        <div className="github-logo">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </div>

        {stage === "choose" && (
          <>
            <h1 className="github-title">Sign in to GitHub</h1>
            <p className="github-subtitle">to authorize Cleaning Kit Builder</p>

            <div className="github-account-list">
              {currentMockAccounts.map((account, idx) => (
                <div key={idx} className="github-account-item" onClick={() => handleSelectAccount(account)}>
                  <div className="github-avatar" style={{ backgroundColor: account.color }}>
                    {account.avatar}
                  </div>
                  <div className="github-account-info">
                    <div className="github-account-name">{account.name}</div>
                    <div className="github-account-email">{account.email}</div>
                  </div>
                </div>
              ))}

              <div className="github-account-item use-another" onClick={() => setStage("email")}>
                <div className="github-avatar another-avatar">🔑</div>
                <div className="github-account-info">
                  <div className="github-account-name" style={{ color: "#0969da" }}>
                    Sign in with another username
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {stage === "email" && (
          <form onSubmit={handleEmailSubmit} className="github-form">
            <h1 className="github-title">Sign in to GitHub</h1>
            
            <div className="github-form-body">
              <label>Username or email address</label>
              <input
                type="email"
                required
                className={error ? "github-input error" : "github-input"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {error && <div className="github-error-msg">{error}</div>}

              <div className="github-actions-row">
                <button type="button" className="github-btn-cancel" onClick={() => setStage("choose")}>
                  Back
                </button>
                <button type="submit" className="github-btn-primary">
                  Continue
                </button>
              </div>
            </div>
          </form>
        )}

        {stage === "password" && (
          <form onSubmit={handlePasswordSubmit} className="github-form">
            <h1 className="github-title">Password validation</h1>
            
            <div className="github-form-body">
              <div className="github-account-preview">
                Signed in as: <strong>{email}</strong>
              </div>

              <div className="github-label-row">
                <label>Password</label>
                <a href="#" className="github-forgot-link" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>
              <input
                type="password"
                required
                className={error ? "github-input error" : "github-input"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <div className="github-error-msg">{error}</div>}

              <div className="github-actions-row">
                <button type="button" className="github-btn-cancel" onClick={handleBackToEmail}>
                  Cancel
                </button>
                <button type="submit" className="github-btn-primary">
                  Sign in
                </button>
              </div>
            </div>
          </form>
        )}

        {stage === "loading" && (
          <div className="github-loading-container">
            <div className="github-dots-loader"></div>
            <h2>Authorizing Application...</h2>
            <p>Granting read access to Cleaning Kit Builder</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`simulator-popup-container ${provider}-theme`}>
      {provider === "google" && renderGoogle()}
      {provider === "microsoft" && renderMicrosoft()}
      {provider === "github" && renderGithub()}
    </div>
  );
}

export default GoogleLoginSimulator;
