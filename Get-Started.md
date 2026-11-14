# VocNix — Developer Quick-Start & Authentication Guide

Welcome to **VocNix**. This guide provides everything team members need to set up the project locally, run the development server, and access the various administrative portals and roles.

---

## 1. Quick Setup & Local Development

### Prerequisites
* **Node.js**: `v18.x` or `v20.x` recommended
* **npm**: `v9.x` or higher

### Steps

1. **Clone the repository & install dependencies:**
   ```bash
   git clone <repo-url>
   cd VocNix
   npm install
   ```

2. **Configure Environment Variables:**
   Ensure `.env.local` is present in the project root. If creating from scratch:
   ```bash
   cp .env.example .env.local
   ```
   *Make sure Supabase and LiveKit credentials are configured for full real-time audio and DB sync.*

3. **Start the local Next.js development server:**
   ```bash
   # Option 1: Standard local development (.env.local)
   npm run dev

   # Option 2: Run locally using production environment (.env.production.local)
   npm run dev:prod
   ```
   The application will be live at: **[http://localhost:3000](http://localhost:3000)**

---

## 2. Super Admin Access (Platform Command Center)

The **Super Admin** role oversees platform-wide operations: managing organizations, subscriptions, global MRR, and manually resetting usage limits or demo restrictions.

### Option A: 1-Click Direct Login Bypass (Fastest)
Use the direct session route to automatically create an authenticated Super Admin session cookie and redirect directly to `/admin`:
* **Local:** [http://localhost:3000/api/auth/super-admin-direct](http://localhost:3000/api/auth/super-admin-direct)
* **Production:** [https://vocnix.site/api/auth/super-admin-direct](https://vocnix.site/api/auth/super-admin-direct)

### Option B: Form Login with Credentials
Navigate to the Super Admin login portal:
* **Login URL:** [http://localhost:3000/super-admin/login](http://localhost:3000/super-admin/login) *(or [/login/super-admin](http://localhost:3000/login/super-admin))*

| Field | Value |
| :--- | :--- |
| **Username** | `superadmin` |
| **Email (Alternative)** | `admin@vocnix.site` |
| **Password** | `Admin123!` |
| **Role** | `super_admin` |

### Super Admin Dashboard
Once logged in, manage the platform at:
* **Local:** [http://localhost:3000/admin](http://localhost:3000/admin) *(or [/super-admin](http://localhost:3000/super-admin))*
* **Production:** [https://vocnix.site/admin](https://vocnix.site/admin)

---

## 3. Organization Admin Access (Tenant Console)

The **Org Admin** role is used by tenants to schedule events, manage translation languages, assign human translators, and generate audience listen links/QR codes.

### Option A: 1-Click Direct Login Bypass
* **Local:** [http://localhost:3000/api/auth/admin-direct](http://localhost:3000/api/auth/admin-direct)
  *(Authenticates as a default demo organization admin and redirects to `/dashboard`)*

### Option B: Standard Login
* **Login URL:** [http://localhost:3000/login](http://localhost:3000/login) *(or [/admin/login](http://localhost:3000/admin/login))*

### Tenant Dashboard
* **Local:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 4. Translators & Audience Portals (Testing Audio Streams)

VocNix uses sub-second WebRTC audio streaming:

1. **Translator Interface:**
   - Translators access dedicated rooms via tokens generated in the tenant dashboard:
     `/translator/room/<room-token>`
   - Requires microphone permissions; shows live RMS VU meters and pause/resume stream controls.
2. **Audience Listener Interface:**
   - Audience members require **no account or app download**:
     `/listen/<listen-token>`
   - Compliant with mobile browser autoplay (users click **"TAP TO LISTEN"**).

---

## 5. Helpful Commands & Verification

* **Run Linting:**
  ```bash
  npm run lint
  ```
* **Build for Production:**
  ```bash
  npm run build
  ```
* **Run Super Admin Test Suite:**
  ```bash
  node test_super_admin.mjs
  ```
* **Run End-to-End Platform Tests:**
  ```bash
  node test_e2e_platform.mjs
  ```

---

## 6. Architecture & Data Storage Note
* **Primary DB:** Supabase PostgreSQL with Row Level Security (RLS).
* **Local Fallback:** In environments where Supabase is offline or during offline testing, the platform falls back to `data/vocnix_db.json`.
* Both auth systems are kept synchronized for seamless local testing.
