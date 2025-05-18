# LedgerLY UI Component Library

This document lists all reusable UI components for LedgerLY, with descriptions and key props/states for each.

---

## 1. **App Layout & Navigation**
- **AppShell**: Main layout wrapper (sidebar, header, content area)
  - Props: `children`, `user`, `onLogout`
- **SidebarNav**: Navigation links for dashboard sections
  - Props: `links`, `activeSection`, `onNavigate`
- **HeaderBar**: Top bar with app name, user menu, notifications
  - Props: `user`, `onLogout`, `onOpenSettings`

## 2. **Authentication & Onboarding**
- **LoginForm**: Email/password login form
  - Props: `onSubmit`, `loading`, `error`
- **RegisterForm**: Registration form
  - Props: `onSubmit`, `loading`, `error`
- **PasswordResetForm**: Password reset request and confirmation
  - Props: `onSubmit`, `loading`, `error`
- **OnboardingStepper**: Multi-step onboarding flow (connect bank, set preferences)
  - Props: `steps`, `activeStep`, `onNext`, `onBack`
- **PlaidConnectButton**: Triggers Plaid Link flow
  - Props: `onSuccess`, `onError`, `loading`

## 3. **Dashboard & Analytics**
- **DashboardSummaryCard**: Shows key metrics (balance, inflow, outflow)
  - Props: `title`, `value`, `icon`, `trend`
- **CashFlowChart**: Line/bar chart for inflow/outflow
  - Props: `data`, `loading`, `dateRange`
- **CategoryPieChart**: Pie chart of expenses by category
  - Props: `data`, `loading`, `onCategorySelect`
- **RecurringList**: List of active subscriptions/recurring payments
  - Props: `items`, `onFlagChange`, `loading`

## 4. **Transactions**
- **TransactionTable**: Table of transactions (sortable, filterable)
  - Props: `transactions`, `onEdit`, `onFlagRecurring`, `loading`, `filters`
- **TransactionRow**: Single transaction row (inline editing)
  - Props: `transaction`, `onEdit`, `editing`, `onSave`, `onCancel`
- **TransactionEditModal**: Modal for editing transaction details
  - Props: `transaction`, `open`, `onSave`, `onClose`
- **TransactionFilters**: Controls for filtering/searching transactions
  - Props: `filters`, `onChange`

## 5. **Forms & Inputs**
- **TextInput**: Standard input field
  - Props: `label`, `value`, `onChange`, `error`, `type`, `placeholder`
- **SelectInput**: Dropdown selector
  - Props: `label`, `options`, `value`, `onChange`, `error`
- **DatePicker**: Date selection input
  - Props: `label`, `value`, `onChange`, `error`
- **Checkbox**: Checkbox input
  - Props: `label`, `checked`, `onChange`
- **Button**: Primary/secondary/ghost button
  - Props: `children`, `variant`, `onClick`, `loading`, `disabled`

## 6. **Modals & Dialogs**
- **Modal**: Generic modal wrapper
  - Props: `open`, `onClose`, `title`, `children`
- **ConfirmDialog**: Confirmation dialog (e.g., delete account)
  - Props: `open`, `onConfirm`, `onCancel`, `message`, `loading`

## 7. **Notifications & Feedback**
- **Toast**: Temporary notification popup
  - Props: `message`, `type`, `open`, `onClose`
- **Alert**: Inline alert for errors/warnings
  - Props: `message`, `type`, `onClose`
- **LoadingSpinner**: Animated spinner for loading states
  - Props: `size`, `color`

## 8. **Data Export & Settings**
- **ExportDataButton**: Triggers CSV export
  - Props: `onExport`, `loading`
- **SettingsPanel**: User settings (profile, password, delete account)
  - Props: `user`, `onUpdate`, `onDeleteAccount`

---

**Note:** All components should follow the LedgerLY UI Style Guide for color, spacing, and accessibility. Components should be designed for composability and reusability. 