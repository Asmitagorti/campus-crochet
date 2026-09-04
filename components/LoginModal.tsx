"use client";

import { useState, useEffect } from "react";
import type { AuthUser } from "../types";
import { YarnBall } from "./YarnDecor";
import { supabase } from "../lib/supabase";

// ── Allowed college email domains ─────────────────────────────────────────────
export const ALLOWED_DOMAINS = [
  "acet.ac.in",
  "aec.ac.in",
  "aus.ac.in",
];

const DEV_TEST_USERNAME = "puppy";
const DEV_TEST_PASSWORD = "puppy";
const DEV_TEST_LOGIN = process.env.NODE_ENV !== "production";
const ADMIN_EMAIL = "asmileis4evr@gmail.com";

const COLLEGES = [
  "ACET",
  "AEC",
  "AUS",
  "Aditya Pharmacy College"
];

const DEPARTMENTS = [
  "CSE",
  "ECE",
  "EEE",
  "ME",
  "CE",
  "IT",
  "MBA",
  "MCA",
  "B.Pharm",
  "Other",
];

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "PG",
];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim()
  );
}

function getDomainError(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  // Admin is allowed even though the admin email
  // isn't an Aditya college domain.
  if (trimmed === ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  const domain = trimmed.split("@")[1];

  if (!domain) {
    return null;
  }

  const allowed = ALLOWED_DOMAINS.some(
    (d) =>
      domain === d ||
      domain.endsWith("." + d)
  );

  if (!allowed) {
    return `Only students from Aditya institutions (${ALLOWED_DOMAINS.join(
      ", "
    )}) can order. Only Aditya students from Aditya Surampalem, Kakinada can order from Campus Crochet.`;
  }

  return null;
}

type LoginStep = "email" | "otp" | "details";

interface Props {
  mode: "toast" | "modal";
  onLogin: (user: AuthUser) => void;
  onDismiss: () => void;
}

export default function LoginModal({
  mode,
  onLogin,
  onDismiss,
}: Props) {
  const [showForm, setShowForm] = useState(
    mode === "modal"
  );

  const [step, setStep] =
    useState<LoginStep>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [otpError, setOtpError] = useState("");
  const [domainError, setDomainError] = useState("");
  const [authError, setAuthError] = useState("");

  const [sending, setSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Dev test login (hardcoded credentials, bypasses Supabase)
  const [devUsername, setDevUsername] = useState("");
  const [devPassword, setDevPassword] = useState("");
  const [devError, setDevError] = useState("");

  // Details form
  const [details, setDetails] = useState({
    name: "",
    college: "",
    department: "",
    year: "",
    phone: "",
  });

  const [detailError, setDetailError] =
    useState("");

  // Open modal when App changes mode
  useEffect(() => {
    if (mode === "modal") {
      setShowForm(true);
    }
  }, [mode]);

  // Prevent page scrolling while modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showForm]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setTimeout(
      () => setResendTimer((value) => value - 1),
      1000
    );

    return () => clearTimeout(timer);
  }, [resendTimer]);

  // ── Dev test login ───────────────────────────────────────────────────────
  function handleDevLogin() {
    if (
      devUsername.trim() !== DEV_TEST_USERNAME ||
      devPassword.trim() !== DEV_TEST_PASSWORD
    ) {
      setDevError("Wrong test credentials");
      return;
    }

    setDevError("");

    const testUser: AuthUser = {
      id: "dev-test-user",
      username: DEV_TEST_USERNAME,
      email: "puppy@acet.ac.in",
      role: "student",
      name: "Test Student",
      college: "ACET",
      department: "CSE",
      year: "3rd Year",
      phone: "9999999999",
    };

    onLogin(testUser);
  }

  // ── Send Supabase OTP ────────────────────────────────────────────────────
  async function handleSendOTP(
  e: React.FormEvent
) {
  e.preventDefault();

  const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      return;
    }

    const domainErr =
      getDomainError(trimmedEmail);

    if (domainErr) {
      setDomainError(domainErr);
      return;
    }

    setDomainError("");
    setAuthError("");
    setSending(true);

    const adminMode =
      trimmedEmail === ADMIN_EMAIL.toLowerCase();

    setIsAdmin(adminMode);

    try {
      /*
       * REAL SUPABASE AUTH
       *
       * Supabase sends the OTP/magic-link email.
       * We do NOT generate the OTP ourselves.
       */
      const { error } =
        await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            shouldCreateUser: true,
          },
        });

      if (error) {
        console.error(
          "Supabase OTP error:",
          error
        );

        setAuthError(
          error.message ||
            "Unable to send OTP. Please try again."
        );

        return;
      }

      setEmail(trimmedEmail);
      setOtp("");
      setOtpError("");
      setResendTimer(60);
      setStep("otp");
    } catch (error) {
      console.error(error);

      setAuthError(
        "Something went wrong while sending the OTP."
      );
    } finally {
      setSending(false);
    }
  }

  // ── Verify Supabase OTP ──────────────────────────────────────────────────
  async function handleVerifyOTP(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (otp.trim().length !== 6) {
      return;
    }

    setOtpError("");
    setAuthError("");
    setSending(true);

    try {
      const { data, error } =
        await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp.trim(),
          type: "email",
        });

      if (error) {
        console.error(
          "Supabase OTP verification error:",
          error
        );

        setOtpError(
          error.message ||
            "Incorrect or expired OTP. Please try again."
        );

        return;
      }

      if (!data.user) {
        setOtpError(
          "Authentication succeeded, but no user was returned."
        );

        return;
      }

      /*
       * Supabase has now authenticated the user.
       *
       * App.tsx is already listening to
       * supabase.auth.onAuthStateChange(), so the
       * global user state will also update.
       */

      if (isAdmin) {
        await supabase.auth.updateUser({
          data: { name: "Admin", role: "admin" },
        });

        const user: AuthUser = {
          id: data.user.id,
          username: email,
          role: "admin",
          name: "Admin",
          email,
        };

        onLogin(user);
      } else {
        setStep("details");
      }
    } catch (error) {
      console.error(error);

      setAuthError(
        "Something went wrong while verifying the OTP."
      );
    } finally {
      setSending(false);
    }
  }

  // ── Complete student profile ─────────────────────────────────────────────
  async function handleDetails(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!details.name.trim()) {
      setDetailError("Please enter your name.");
      return;
    }

    if (!details.college) {
      setDetailError(
        "Please select your college."
      );
      return;
    }

    if (
      !details.phone.trim() ||
      details.phone.length < 10
    ) {
      setDetailError(
        "Enter a valid 10-digit phone number."
      );
      return;
    }

    setDetailError("");

    /*
     * At this point Supabase has already authenticated
     * the user. Persist name + role on the auth user so
     * subsequent calls and onAuthStateChange callbacks
     * carry the metadata with them.
     */
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      setDetailError(
        "Your session expired. Please sign in again."
      );
      setStep("email");
      return;
    }

    await supabase.auth.updateUser({
      data: {
        name: details.name.trim(),
        role: "student",
        college: details.college,
        department: details.department || undefined,
        year: details.year || undefined,
        phone: details.phone.trim(),
      },
    });

    const user: AuthUser = {
      id: supabaseUser.id,
      username: email.split("@")[0],
      role: "student",
      name: details.name.trim(),
      email,
      college: details.college,
      department:
        details.department || undefined,
      year: details.year || undefined,
      phone: details.phone.trim(),
    };

    /*
     * Do NOT use localStorage here.
     *
     * Supabase is the source of truth for authentication.
     * App.tsx receives the authenticated session through
     * onAuthStateChange().
     */
    onLogin(user);
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendTimer > 0 || !email) {
      return;
    }

    setAuthError("");
    setOtpError("");
    setOtp("");
    setSending(true);

    try {
      const { error } =
        await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: {
            shouldCreateUser: true,
          },
        });

      if (error) {
        setAuthError(
          error.message ||
            "Unable to resend OTP."
        );

        return;
      }

      setResendTimer(60);
    } catch (error) {
      console.error(error);

      setAuthError(
        "Something went wrong while resending the OTP."
      );
    } finally {
      setSending(false);
    }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  if (mode === "toast" && !showForm) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 90,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          backgroundColor: "#2E1D15",
          color: "#F7F3EC",
          borderRadius: 50,
          padding:
            "0.75rem 1.25rem 0.75rem 1rem",
          boxShadow:
            "0 8px 32px rgba(46,29,21,0.28)",
          whiteSpace: "nowrap",
          animation: "slideUp 0.35s ease",
        }}
      >
        <YarnBall
          size={24}
          color="#D8A7A7"
        />

        <span
          style={{
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          Sign in to place orders 🧶
        </span>

        <button
          onClick={() => setShowForm(true)}
          style={{
            backgroundColor: "#C97B63",
            color: "#FFFDF8",
            fontWeight: 600,
            padding: "0.4rem 1rem",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            fontSize: "0.82rem",
            marginLeft: 4,
          }}
        >
          Sign in
        </button>

        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#B88080",
            cursor: "pointer",
            fontSize: "1.1rem",
            lineHeight: 1,
            padding: "0 0.25rem",
          }}
        >
          ×
        </button>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform:
                translateX(-50%)
                translateY(16px);
            }

            to {
              opacity: 1;
              transform:
                translateX(-50%)
                translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor:
            "rgba(46,29,21,0.5)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          backdropFilter: "blur(2px)",
          animation: "fadeIn 0.2s ease",
        }}
      >
        <div
          onClick={(e) =>
            e.stopPropagation()
          }
          style={{
            backgroundColor: "#FFFDF8",
            borderRadius: 24,
            padding: "2.25rem",
            width: "100%",
            maxWidth: 420,
            boxShadow:
              "0 24px 64px rgba(46,29,21,0.2)",
            position: "relative",
            animation: "popIn 0.25s ease",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <button
            onClick={onDismiss}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A6058",
              fontSize: "1.25rem",
              lineHeight: 1,
              zIndex: 1,
            }}
          >
            ×
          </button>

          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <YarnBall
              size={28}
              color="#C97B63"
            />

            <span
              style={{
                fontFamily:
                  "Playfair Display, Georgia, serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#2E1D15",
              }}
            >
              Campus Crochet
            </span>
          </div>

          {/* ── EMAIL ───────────────────────────────────────────────────── */}
          {step === "email" && (
            <>
              <h2 style={h2St}>
                Sign in with college email
              </h2>

              <p style={subSt}>
                Enter your Aditya institution email
                to receive a one-time password.
              </p>

              <div
                style={{
                  backgroundColor: "#F7F3EC",
                  borderRadius: 10,
                  padding:
                    "0.6rem 0.85rem",
                  border:
                    "1px solid #EDD4D4",
                  marginTop: "0.85rem",
                  marginBottom: "0.25rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "#7A6058",
                    lineHeight: 1.5,
                  }}
                >
                  <strong
                    style={{
                      color: "#2E1D15",
                    }}
                  >
                    Only Aditya students
                  </strong>{" "}
                  from Aditya Surampalem,
                  Kakinada can order from
                  Campus Crochet.
                  <br />

                  Accepted domains:{" "}
                  <span
                    style={{
                      fontFamily: "monospace",
                      color: "#C97B63",
                    }}
                  >
                    {ALLOWED_DOMAINS.join(
                      ", "
                    )}
                  </span>
                </p>
              </div>

              <form
                onSubmit={handleSendOTP}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  marginTop: "1rem",
                }}
              >
                <div>
                  <label style={labelSt}>
                    College Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(
                        e.target.value
                      );
                      setDomainError("");
                      setAuthError("");
                    }}
                    placeholder="you@acet.ac.in"
                    required
                    autoFocus
                    style={inputSt}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "#C97B63")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        "#EDD4D4")
                    }
                  />
                </div>

                {domainError && (
                  <ErrorBox
                    msg={domainError}
                  />
                )}

                {authError && (
                  <ErrorBox
                    msg={authError}
                  />
                )}

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !isValidEmail(email)
                  }
                  style={btnSt(
                    sending ||
                      !isValidEmail(email)
                  )}
                >
                  {sending
                    ? "Sending OTP..."
                    : "Send OTP →"}
                </button>
              </form>

              {DEV_TEST_LOGIN && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginTop: "0.85rem",
                    paddingTop: "0.85rem",
                    borderTop: "1px dashed #EDD4D4",
                  }}
                >
                  <label
                    style={{
                      ...labelSt,
                      color: "#7A6058",
                    }}
                  >
                    🧪 Dev test login
                  </label>

                  <input
                    type="text"
                    placeholder="test username"
                    value={devUsername}
                    onChange={(e) => {
                      setDevUsername(e.target.value);
                      setDevError("");
                    }}
                    style={inputSt}
                  />

                  <input
                    type="text"
                    placeholder="test password"
                    value={devPassword}
                    onChange={(e) => {
                      setDevPassword(e.target.value);
                      setDevError("");
                    }}
                    style={inputSt}
                  />

                  {devError && (
                    <ErrorBox msg={devError} />
                  )}

                  <button
                    type="button"
                    onClick={handleDevLogin}
                    style={{
                      backgroundColor: "#F7F3EC",
                      color: "#7A6058",
                      fontWeight: 600,
                      padding: "0.8rem",
                      borderRadius: 50,
                      border: "1px solid #EDD4D4",
                      cursor: "pointer",
                      fontSize: "0.92rem",
                      width: "100%",
                    }}
                  >
                    Test Login
                  </button>
                </div>
              )}

              <p
                style={{
                  textAlign: "center",
                  color: "#B88080",
                  fontSize: "0.75rem",
                  marginTop: "1.25rem",
                  fontFamily:
                    "Caveat, cursive",
                }}
              >
                For students of Aditya
                institutions, Surampalem 🌸
              </p>
            </>
          )}

          {/* ── OTP ─────────────────────────────────────────────────────── */}
          {step === "otp" && (
            <>
              <h2 style={h2St}>
                Enter your OTP
              </h2>

              <p style={subSt}>
                A 6-digit code was sent to{" "}
                <strong
                  style={{
                    color: "#2E1D15",
                  }}
                >
                  {email}
                </strong>
              </p>

              <form
                onSubmit={handleVerifyOTP}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  marginTop: "1rem",
                }}
              >
                <div>
                  <label style={labelSt}>
                    6-digit OTP
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      );
                      setOtpError("");
                      setAuthError("");
                    }}
                    placeholder="000000"
                    autoFocus
                    style={{
                      ...inputSt,
                      textAlign: "center",
                      letterSpacing: "0.3em",
                      fontSize: "1.25rem",
                      fontFamily: "monospace",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "#C97B63")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        "#EDD4D4")
                    }
                  />
                </div>

                {otpError && (
                  <ErrorBox
                    msg={otpError}
                  />
                )}

                {authError && (
                  <ErrorBox
                    msg={authError}
                  />
                )}

                <button
                  type="submit"
                  disabled={
                    sending ||
                    otp.length !== 6
                  }
                  style={btnSt(
                    sending ||
                      otp.length !== 6
                  )}
                >
                  {sending
                    ? "Verifying..."
                    : isAdmin
                    ? "Verify & Enter Admin Panel →"
                    : "Verify & Continue →"}
                </button>
              </form>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginTop: "1rem",
                }}
              >
                <button
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setOtpError("");
                    setAuthError("");
                  }}
                  style={{
                    color: "#7A6058",
                    fontSize: "0.78rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ← Change email
                </button>

                <button
                  onClick={handleResend}
                  disabled={
                    resendTimer > 0 ||
                    sending
                  }
                  style={{
                    color:
                      resendTimer > 0 ||
                      sending
                        ? "#B88080"
                        : "#C97B63",
                    fontSize: "0.78rem",
                    background: "none",
                    border: "none",
                    cursor:
                      resendTimer > 0 ||
                      sending
                        ? "default"
                        : "pointer",
                    fontWeight: 500,
                  }}
                >
                  {resendTimer > 0
                    ? `Resend in ${resendTimer}s`
                    : "Resend OTP"}
                </button>
              </div>
            </>
          )}

          {/* ── DETAILS ─────────────────────────────────────────────────── */}
          {step === "details" && (
            <>
              <h2 style={h2St}>
                Complete your profile
              </h2>

              <p style={subSt}>
                Just a few details to
                personalise your experience.
              </p>

              <form
                onSubmit={handleDetails}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.8rem",
                  marginTop: "1.25rem",
                }}
              >
                <div>
                  <label style={labelSt}>
                    Full Name *
                  </label>

                  <input
                    type="text"
                    value={details.name}
                    onChange={(e) =>
                      setDetails((d) => ({
                        ...d,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Your name"
                    required
                    style={inputSt}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "#C97B63")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        "#EDD4D4")
                    }
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "0.6rem",
                  }}
                >
                  <div>
                    <label style={labelSt}>
                      College *
                    </label>

                    <select
                      value={details.college}
                      onChange={(e) =>
                        setDetails((d) => ({
                          ...d,
                          college:
                            e.target.value,
                        }))
                      }
                      required
                      style={inputSt}
                    >
                      <option value="">
                        Select
                      </option>

                      {COLLEGES.map((college) => (
                        <option
                          key={college}
                        >
                          {college}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelSt}>
                      Department
                    </label>

                    <select
                      value={
                        details.department
                      }
                      onChange={(e) =>
                        setDetails((d) => ({
                          ...d,
                          department:
                            e.target.value,
                        }))
                      }
                      style={inputSt}
                    >
                      <option value="">
                        Select
                      </option>

                      {DEPARTMENTS.map(
                        (department) => (
                          <option
                            key={department}
                          >
                            {department}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "0.6rem",
                  }}
                >
                  <div>
                    <label style={labelSt}>
                      Year
                    </label>

                    <select
                      value={details.year}
                      onChange={(e) =>
                        setDetails((d) => ({
                          ...d,
                          year: e.target.value,
                        }))
                      }
                      style={inputSt}
                    >
                      <option value="">
                        Select
                      </option>

                      {YEARS.map((year) => (
                        <option key={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelSt}>
                      Phone *
                    </label>

                    <input
                      type="tel"
                      value={details.phone}
                      onChange={(e) =>
                        setDetails((d) => ({
                          ...d,
                          phone:
                            e.target.value.replace(
                              /\D/g,
                              ""
                            ),
                        }))
                      }
                      placeholder="10-digit"
                      maxLength={10}
                      required
                      style={inputSt}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          "#C97B63")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          "#EDD4D4")
                      }
                    />
                  </div>
                </div>

                {detailError && (
                  <ErrorBox
                    msg={detailError}
                  />
                )}

                <button
                  type="submit"
                  style={btnSt(false)}
                >
                  Create Account & Sign In →
                </button>
              </form>
            </>
          )}

          {/* Step dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              marginTop: "1.5rem",
            }}
          >
            {(
              [
                "email",
                "otp",
                "details",
              ] as LoginStep[]
            ).map((currentStep) => (
              <div
                key={currentStep}
                style={{
                  width:
                    currentStep === step
                      ? 18
                      : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    currentStep === step
                      ? "#C97B63"
                      : "#EDD4D4",
                  transition:
                    "all 0.3s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.94);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

function ErrorBox({
  msg,
}: {
  msg: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#FDF0EC",
        borderRadius: 10,
        padding: "0.5rem 0.8rem",
        border: "1px solid #EDD4D4",
        fontSize: "0.78rem",
        color: "#A86248",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.4rem",
        lineHeight: 1.5,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        ⚠
      </span>

      {msg}
    </div>
  );
}

const h2St: React.CSSProperties = {
  fontFamily:
    "Playfair Display, Georgia, serif",
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "#2E1D15",
  marginBottom: "0.3rem",
};

const subSt: React.CSSProperties = {
  color: "#7A6058",
  fontSize: "0.82rem",
  lineHeight: 1.5,
};

const labelSt: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#2E1D15",
  marginBottom: "0.3rem",
};

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.9rem",
  borderRadius: 12,
  border: "1.5px solid #EDD4D4",
  backgroundColor: "#F7F3EC",
  color: "#2E1D15",
  fontSize: "0.88rem",
  outline: "none",
  fontFamily:
    "DM Sans, system-ui, sans-serif",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

function btnSt(
  disabled: boolean
): React.CSSProperties {
  return {
    backgroundColor: disabled
      ? "#EDD4D4"
      : "#C97B63",
    color: disabled
      ? "#B88080"
      : "#FFFDF8",
    fontWeight: 600,
    padding: "0.8rem",
    borderRadius: 50,
    border: "none",
    cursor: disabled
      ? "not-allowed"
      : "pointer",
    fontSize: "0.92rem",
    boxShadow: disabled
      ? "none"
      : "0 4px 14px rgba(201,123,99,0.28)",
    transition: "all 0.2s",
    width: "100%",
  };
}