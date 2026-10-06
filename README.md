# ADARSH VIDYA MANDIR (AVM) SCHOOL ERP

A complete dual-application architecture separating the **Admin Web Application** (deployable to Vercel) and the **Student & Employee Mobile App** (buildable as Android APK).

---

## 📁 Repository Structure

```
c:\adarsh vidya mandir\
├── admin-web/          # Admin Web Application (Vercel Deployable)
│   ├── src/            # Admin Screens, Components & Settings
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── mobile-app/         # Student & Employee Mobile Application (Capacitor/Android APK)
│   ├── src/            # Student & Employee Screens, Navigation & Drawers
│   ├── android/        # Standalone Android Native Studio Project
│   ├── capacitor.config.json
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── shared/             # Central Shared Data Layer & Abstraction
│   ├── src/
│   │   ├── services/   # Auth, DemoDataStore, Settings, Academic & Feature Services
│   │   ├── types/      # Global Type Definitions
│   │   ├── mock/       # Seed Data
│   │   ├── config/     # School Configuration
│   │   └── utils/      # Image & Utility Helpers
│   └── package.json
├── package.json        # Root Workspace & Command Delegates
└── README.md
```

---

## 🚀 Admin Web Deployment (Vercel)

The **Admin Web Application** is completely isolated in `admin-web/` and can be deployed directly to Vercel.

### Vercel Deployment Settings:
- **Root Directory**: `admin-web`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Local Admin Web Commands:
```bash
# Navigate to Admin Web folder
cd admin-web

# Install dependencies
npm install

# Run local development server
npm run dev

# Build production web bundle (0 TypeScript errors)
npm run build
```

---

## 📱 Mobile Application (Android APK)

The **Student & Employee Mobile App** is contained in `mobile-app/` with integrated Capacitor Android native bindings.

### Build Android APK:
```bash
# Navigate to Mobile App folder
cd mobile-app

# Install dependencies
npm install

# Build web distribution and sync to Android native project
npm run build:android

# Open in Android Studio to build APK
npx cap open android
```

---

## 🔑 Demo Login Credentials

Both applications share the central persistent demo data store for seamless testing:

| Role | Username / ID | Password | Access Platform |
|---|---|---|---|
| **Admin / Principal** | `admin` | `admin123` | **Admin Web Only** (`admin-web`) |
| **Student** | `rahul` | `123456` | **Mobile App** (`mobile-app`) |
| **Employee / Teacher** | `priya` | `123456` | **Mobile App** (`mobile-app`) |

---

## ⚡ Central Service & Database Abstraction

All UI components interact with the central data service layer (`shared/src/services/` & `services/`). 
This abstraction preserves current local persistent demo store testing and prepares the codebase for seamless future migration to **Supabase** or a custom backend database without rewriting any UI components.

### Environment Configuration:
Copy `.env.example` to `.env` in `admin-web` or `mobile-app`:
```env
VITE_API_URL=https://api.adarshvidyamandir.edu.in
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
