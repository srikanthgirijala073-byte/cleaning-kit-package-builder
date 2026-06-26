import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./OtpModal.css";

function OtpModal({ onClose, onSuccess }) {
  const { verifyOtpCode, resendOtpCode } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    const otpString = code.join("");
    if (otpString.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    const result = await verifyOtpCode(otpString);
    setLoading(false);

    if (result.success) {
      onSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMessage("");
    const result = await resendOtpCode();
    if (result.success) {
      setTimer(60);
      setResendMessage(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal-card">
        <button className="otp-close-btn" onClick={onClose} type="button">
          ×
        </button>
        
        <h2>2-Step Verification</h2>
        <p className="otp-desc">
          We sent a 6-digit security OTP code to your email. Enter the code to authorize this login.
        </p>

        <form onSubmit={handleVerify}>
          <div className="otp-input-group">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                required
              />
            ))}
          </div>

          {error && <div className="otp-error">{error}</div>}
          {resendMessage && <div className="otp-success">{resendMessage}</div>}

          <button className="otp-verify-btn" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="otp-resend-section">
          {timer > 0 ? (
            <span>Resend OTP in <strong>{timer}s</strong></span>
          ) : (
            <button className="otp-resend-btn" onClick={handleResend} type="button">
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OtpModal;
