import { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import {
  loginUser,
  registerUser,
  logoutUser,
  resendVerificationEmail,
  API_BASE_URL,
} from "../services/api";
import { auth, provider } from "../firebase";

// Create Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpRequired, setOtpRequired] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Load user from localStorage when app starts
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate the stored session has a valid token (not a stale/broken token from before JWT fix)
        const token = parsed.accessToken || parsed.token;
        if (!token || token === 'dummy-token') {
          // Clear stale/invalid session
          localStorage.removeItem("user");
          setLoading(false);
          return;
        }
        if (parsed.user) {
          setUser(parsed.user);
        } else if (parsed.token) {
          setUser(parsed);
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // ======================
  // Login
  // ======================
  const login = async (email, password, remember = false, recaptchaToken = "") => {
    try {
      setRememberMe(remember);

      // 1. Try Firebase Email/Password Sign-In
      let firebaseUser = null;
      try {
        const firebaseResult = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = firebaseResult.user;
      } catch (fbErr) {
        console.warn("Firebase login failed, trying MySQL fallback:", fbErr.message);
      }

      if (firebaseUser) {
        const response = await axios.post(`${API_BASE_URL}/auth/firebase-login`, {
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          uid: firebaseUser.uid,
        });
        const data = response.data;
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data));
        return {
          success: true,
          message: "Login successful!",
          user: data.user
        };
      }

      // 2. Fallback to traditional MySQL login
      const response = await loginUser({
        email,
        password,
        rememberMe: remember,
        recaptchaToken
      });

      const data = response.data;

      // Handle Two-Factor requirement
      if (data.twoFactorRequired) {
        setTempToken(data.tempToken);
        setOtpRequired(true);
        return {
          success: true,
          twoFactorRequired: true,
          message: data.message
        };
      }

      // Successful login without 2FA
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data));

      // Attempt to migrate this user to Firebase in the background
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (migrateErr) {
        // Ignore if already exists
      }

      return {
        success: true,
        message: "Login successful!",
        user: data.user
      };
    } catch (error) {
      const errData = error.response?.data || {};
      let message = errData.message || "Login failed";
      if (error.code === "ERR_NETWORK" || !error.response) {
        message = "Could not connect to the backend server. Please verify your Node server is running on port 5000.";
      } else if (message.toLowerCase().includes("database") || message.toLowerCase().includes("connrefused") || message.toLowerCase().includes("mysql")) {
        message = "Database connection error. Please verify your MySQL server is running on port 3306.";
      }
      return {
        success: false,
        message,
        emailNotVerified: errData.emailNotVerified || false,
        email: errData.email || null,
      };
    }
  };

  const loginWithFirebaseGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const response = await axios.post(`${API_BASE_URL}/auth/firebase-login`, {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        profileImage: firebaseUser.photoURL,
        uid: firebaseUser.uid,
      });

      const data = response.data;

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data));

      return {
        success: true,
        message: "Logged in with Google successfully.",
        user: data.user,
      };
    } catch (error) {
      console.error("Google Sign-In Error Details:", {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        error
      });
      const errorMessage = error.response?.data?.message || error.message || "Google sign-in failed.";
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // ======================
  // Verify OTP Code
  // ======================
  const verifyOtpCode = async (code) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        code,
        tempToken,
        rememberMe
      });

      const data = response.data;
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data));
      setOtpRequired(false);
      setTempToken("");

      return {
        success: true,
        message: "Login successful!",
        user: data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid OTP code",
      };
    }
  };

  // ======================
  // Resend OTP Code
  // ======================
  const resendOtpCode = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/send-otp`, {
        tempToken
      });
      return {
        success: true,
        message: "A new OTP code has been emailed to you."
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to resend OTP",
      };
    }
  };

  // ======================
  // Register
  // ======================
  const register = async (name, email, password, phone = "", address = "", recaptchaToken = "") => {
    try {
      // 1. Create in Firebase
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (fbErr) {
        console.warn("Firebase registration skipped/failed:", fbErr.message);
      }

      // 2. Create in MySQL
      const response = await registerUser({
        name,
        email,
        password,
        phone,
        address,
        recaptchaToken
      });

      return {
        success: true,
        message: response.data?.message || "Registration successful! Please check your email to verify your account."
      };
    } catch (error) {
      console.error("Registration Error Details:", {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        error
      });
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // ======================
  // Resend Verification Email
  // ======================
  const resendVerification = async (email) => {
    try {
      const response = await resendVerificationEmail(email);
      return {
        success: true,
        message: response.data?.message || "Verification email sent!"
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send verification email"
      };
    }
  };

  // ======================
  // Logout
  // ======================
  const logout = async () => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const refreshToken = parsed.refreshToken;
        const historyId = parsed.historyId;
        await logoutUser({ refreshToken, historyId });
      }
    } catch (e) {
      console.error("Logout API failed:", e);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/login";
    }
  };

  // Context Values
  const value = {
    user,
    setUser,
    loading,
    login,
    loginWithFirebaseGoogle,
    logout,
    register,
    resendVerification,
    otpRequired,
    setOtpRequired,
    verifyOtpCode,
    resendOtpCode,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;