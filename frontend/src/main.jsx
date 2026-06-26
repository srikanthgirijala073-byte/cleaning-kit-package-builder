import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { RbacAuthProvider } from "./context/RbacAuthContext";

const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
        <ThemeProvider>
          <AuthProvider>
            <RbacAuthProvider>
              <CartProvider>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: "#0b0e18",
                      color: "#eaecf2",
                      border: "1px solid rgba(255,255,255,0.09)",
                      fontSize: "14px",
                    },
                  }}
                />
                <App />
              </CartProvider>
            </RbacAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </GoogleReCaptchaProvider>
    </BrowserRouter>
  </React.StrictMode>
);