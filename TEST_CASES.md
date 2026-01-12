# Credit System Verification & Test Cases

## Overview
This document outlines the verification of the Credit System implementation, ensuring the default credit value is 2 and updates occur dynamically and consistently.

## 1. Configuration Verification
- **Requirement:** Default credit value must be 2.
- **Verification:** 
  - Checked `server/models/User.js`.
  - Field `timeCredits` has `default: 2`.
  - **Status:** ✅ Verified.

## 2. Real-Time Monitoring & Automatic Updates
- **Requirement:** Updates triggered by system events must reflect immediately.
- **Implementation:**
  - **Backend:** `server.js` now initializes Socket.IO and assigns users to personal rooms.
  - **Controller:** `transactionController.js` emits `credit_update` events to specific users upon credit changes (deduction/addition).
  - **Frontend:** `SocketContext.jsx` listens for `credit_update` and triggers `refreshUser()` to update the UI instantly without page reload.
  - **Status:** ✅ Implemented.

## 3. Test Cases

### Automated Backend Tests
Run the included script: `node server/verify-credits.js`

| Test Case | Description | Expected Result | Status |
|-----------|-------------|-----------------|--------|
| **TC-01** | **Initial Credit Load** | New users start with exactly 2 credits. | ✅ PASSED |
| **TC-02** | **Credit Deduction** | Booking a class reduces student credits by 1. | ✅ PASSED |
| **TC-03** | **Credit Addition** | Completing a class increases teacher credits by 1. | ✅ PASSED |
| **TC-04** | **Data Consistency** | Database reflects changes immediately after transactions. | ✅ PASSED |

### Manual Frontend Verification Steps

#### TC-05: Real-Time UI Update (Student)
1. **Login** as Student (Window A). Check Navbar: `2 CR`.
2. **Login** as Teacher (Window B).
3. **Action:** In Window A, book a class.
4. **Result:** Navbar in Window A should update to `1 CR` immediately (via Socket/State update).

#### TC-06: Real-Time UI Update (Teacher)
1. **Prerequisite:** Pending transaction exists.
2. **Action:** In Window A (Student), click "Release Funds" (Complete Transaction).
3. **Result:** 
   - Window A shows success message.
   - Window B (Teacher) should show a toast notification "Credits updated!" and Navbar updates to `3 CR` **without refreshing**.

#### TC-07: Persistence
1. **Action:** Refresh the page in both windows.
2. **Result:** Credit values remain `1 CR` (Student) and `3 CR` (Teacher).

## 4. Code References
- **Model:** [User.js](file:///c:/Users/priyansh/Desktop/COde/Vibe Coding/Skill Barter/server/models/User.js)
- **Controller:** [transactionController.js](file:///c:/Users/priyansh/Desktop/COde/Vibe Coding/Skill Barter/server/controllers/transactionController.js)
- **Frontend Socket:** [SocketContext.jsx](file:///c:/Users/priyansh/Desktop/COde/Vibe Coding/Skill Barter/client/src/context/SocketContext.jsx)
