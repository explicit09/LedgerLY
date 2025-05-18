# LedgerLY - Personal Finance Dashboard

LedgerLY is a private, user-centric finance dashboard designed to connect to bank accounts, track spending, highlight recurring transactions, and provide clear analytics.

**Goal:** Deliver robust privacy, security, and data isolation for each user.  
**Audience:** Private beta (friends, invite-only).

---

## ✨ Core Features

-   **User Accounts:** Secure registration, login, password reset, and account deletion with full data isolation.
-   **Bank Integration:** Connect bank accounts via Plaid, import transaction history, and sync daily.
-   **Transaction Management:** Auto-categorization, recurring transaction detection, and manual editing.
-   **Dashboard Analytics:** Visualize cash flow, net worth trends, spending by category, and active subscriptions.
-   **Privacy & Security:** End-to-end encryption for sensitive data, HTTPS only, and a "Delete My Data" feature.
-   **Data Export:** Users can export their data in CSV format.

---

## 🛠️ Tech Stack

-   **Frontend:** React (with TypeScript)
-   **Backend:** Node.js + Express (with TypeScript)
-   **Database:** PostgreSQL
-   **Bank API Aggregator:** Plaid
-   **Authentication:** JWT sessions, bcrypt for password hashing

---

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+ recommended)
-   npm or yarn
-   Docker (for PostgreSQL, or a local Postgres installation)
-   Plaid API Keys (Sandbox for development)
-   OpenSSL (for HTTPS development)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/LedgerLY.git
    cd LedgerLY
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    cp .env.example .env 
    # Fill in your .env with database credentials, Plaid keys, JWT secret, etc.
    # npm run db:migrate (once migrations are set up)
    npm run dev:https 
    ```
    The backend will typically run on `https://localhost:3443`.

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    cp .env.example .env
    # Fill in your .env with the backend API URL (e.g., REACT_APP_API_URL=https://localhost:3443/api)
    npm start
    ```
    The frontend will typically run on `https://localhost:5173`.

4.  **Database Setup (using Docker):**
    ```bash
    docker run --name ledgerly-postgres -e POSTGRES_USER=youruser -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=ledgerly_dev -p 5432:5432 -d postgres
    ```
    Make sure your backend `.env` file matches these credentials.

5. **Set up HTTPS for development:**
    ```bash
    # Run the HTTPS setup script
    ./scripts/setup-https.sh
    ```

### Running the Application

#### Development Mode

1. Start the backend server:
    ```bash
    # In the backend directory
    npm run dev:https  # Runs with HTTPS on port 3443
    # or
    npm run dev       # Runs without HTTPS on port 3001
    ```

2. Start the frontend development server:
    ```bash
    # In the frontend directory
    npm start         # Runs with HTTPS on port 5173
    ```

3. Access the application:
    - Frontend: https://localhost:5173
    - Backend API: https://localhost:3443

Note: When accessing the application for the first time, you may need to accept the self-signed certificate in your browser.

#### Production Mode

1. Build the applications:
    ```bash
    # Build backend
    cd backend
    npm run build

    # Build frontend
    cd ../frontend
    npm run build
    ```

2. Start the production server:
    ```bash
    # In the backend directory
    npm start
    ```

### Development Notes

- The development environment uses self-signed certificates for HTTPS
- API requests from the frontend are automatically proxied to the backend
- In production, HTTPS should be handled by a reverse proxy (e.g., Nginx)

---

## ⚙️ Project Structure

```
LedgerLY/
├── backend/        # Node.js/Express API
├── docs/           # Project documentation (PRD, Style Guide)
├── frontend/       # React Application
├── scripts/        # Utility scripts
├── tasks/          # Task Master generated tasks
├── .gitignore
└── README.md
```

---

## 🤝 Contributing

This is a private project. For major changes, please discuss with the core team first.

---

## ⚠️ Security & Privacy

-   Data isolation is paramount.
-   Plaid developer keys are for testing only.
-   Always use HTTPS in any cloud-hosted environment. 