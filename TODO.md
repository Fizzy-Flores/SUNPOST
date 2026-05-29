# TODO

- [ ] Implement server-side Gmail OTP verification flow
  - [ ] Add OTP generation/storage + rate limiting in `WEBSITE/Sunpost/backend/main.py`
  - [ ] Add `POST /public/request-otp` endpoint (verify Firebase idToken, send OTP email)
  - [ ] Add `POST /public/verify-otp` endpoint (verify OTP, mark session as verified)
  - [ ] Add simple in-memory OTP/session state (per-user)

- [ ] Frontend updates
  - [ ] Add new `Sunpost-frontend/verify-otp.html` with OTP input UI
  - [ ] Update `Sunpost-frontend/auth.js` to request OTP after Google sign-in / login
  - [ ] Update auth gating so protected pages require OTP-verified state

- [ ] Email sending configuration
  - [ ] Ensure backend uses Gmail SMTP via env vars (document in README or code comments)

- [ ] Test
  - [ ] Sign in with Google → OTP email arrives → OTP typed → redirect to homepage
  - [ ] Invalid/expired OTP rejected

