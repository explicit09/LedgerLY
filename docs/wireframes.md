# LedgerLY Wireframe Plan

This document outlines the wireframes for LedgerLY's core user flows. Use this as a blueprint for Figma or other design tools.

---

## 1. Registration / Login
### Login Screen
- Centered card with app logo and name
- Email and password fields
- "Login" button (primary)
- "Forgot password?" link
- "Create account" link (secondary)
- Error message area

### Registration Screen
- Centered card with app logo and name
- Email, password, confirm password fields
- "Register" button (primary)
- "Already have an account? Login" link
- Password requirements hint
- Error message area

---

## 2. Onboarding (Bank Connect)
### Onboarding Stepper
- Progress indicator (e.g., 1/3, 2/3, 3/3)
- Welcome message and privacy reassurance
- Step 1: Connect bank account (PlaidConnectButton)
  - Large "Connect Bank" button
  - Security/privacy copy
- Step 2: Set preferences (optional)
  - Notification opt-in, data export info
- Step 3: Success confirmation
  - "Go to Dashboard" button

---

## 3. Main Dashboard
### Layout
- SidebarNav (left): Dashboard, Transactions, Export, Settings
- HeaderBar (top): App name, user menu, notifications
- Main content area (right):
  - DashboardSummaryCards (Balance, Inflow, Outflow)
  - CashFlowChart (line/bar)
  - CategoryPieChart (expenses by category)
  - RecurringList (active subscriptions)
  - Last sync time indicator

---

## 4. Transactions
### Transaction Table Screen
- Filters (date range, category, search)
- TransactionTable (sortable, paginated)
- Each row: merchant, date, amount, category, recurring flag, note icon
- Inline editing: click row to edit category, recurring flag, or add note
- "Export to CSV" button (top right)

### Transaction Edit Modal
- Opens when editing a transaction
- Fields: merchant, date, amount (read-only), category (select), recurring (checkbox), note (textarea)
- "Save" and "Cancel" buttons

---

## 5. Settings & Account
### Settings Panel
- Profile info (email, change password)
- Data export button
- "Delete My Account" button (danger, confirmation dialog)
- Last sync info

---

**Notes:**
- All screens use the LedgerLY UI Style Guide for spacing, color, and typography.
- Mobile layouts stack elements vertically, with navigation as a bottom bar.
- All actions provide clear feedback (loading, error, success). 