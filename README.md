Atlas Workspace

Calm Productivity Workspace — local-first personal workspace for notes, Kanban, reminders, and structured thinking.

Overview

Atlas Workspace (formerly Ruang Kerja) is a lightweight local-first productivity workspace inspired by principles from Notion, Linear, Trello, and Google Keep.

The project is designed as a Personal Workspace OS:

fast
offline-friendly
static-hosted
Firebase-enabled
easy to deploy
minimal dependency overhead

Built with:

Vanilla JavaScript (ES Modules)
Firebase Auth
Cloud Firestore
Firebase Hosting
PWA architecture
Modular CSS architecture
Live Demo
Firebase Hosting
https://atlas-workspace-af04b.web.app/
https://atlas-workspace-af04b.firebaseapp.com/
GitHub Repository
https://github.com/fermantonoihsan/Ruang-Kerja
Features
Workspace Core
Markdown notes editor
Live markdown preview
Kanban board drag & drop
Reminder management
Tags & filtering
Search system
Dashboard overview
Empty states
Dark mode
Responsive layout
Local-First Architecture
Works without login
Instant localStorage persistence
Offline-friendly behavior
Progressive enhancement with cloud sync
Firebase Integration
Firebase Authentication
Firestore cloud backup & sync
User-isolated workspace storage
Firestore security rules
PWA Support
Service Worker
Installable web app
Cached application shell
Product Direction

Atlas Workspace is intentionally positioned as:

Personal Workspace OS

instead of:

admin dashboard
enterprise SaaS clone
bloated collaboration suite

Design direction:

calm
spacious
rounded
modern
readable
low cognitive load
Tech Stack
Layer	Technology
Frontend	Vanilla JavaScript
Styling	Modular CSS Architecture
State	Local State + localStorage
Cloud	Firebase Firestore
Auth	Firebase Authentication
Hosting	Firebase Hosting
PWA	Service Worker
Icons	Lucide Icons
Architecture
Current Structure
Ruang-Kerja/
├── index.html
├── app.js
├── manifest.webmanifest
├── service-worker.js
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
├── package.json
├── src/
│   ├── main.js
│   ├── services/
│   ├── state/
│   ├── ui/
│   └── features/
├── styles/
│   ├── main.css
│   ├── 00-tokens.css
│   ├── 01-reset.css
│   ├── 02-base.css
│   ├── 03-layout.css
│   ├── 04-components.css
│   ├── 05-features.css
│   ├── 06-utilities.css
│   └── 07-responsive.css
└── .github/
    └── workflows/
CSS Architecture
00-tokens.css      Design tokens
01-reset.css       Reset & normalization
02-base.css        Base typography & forms
03-layout.css      App shell & layout
04-components.css  Buttons, cards, chips, modals
05-features.css    Dashboard, notes, kanban, reminders
06-utilities.css   Utility helper classes
07-responsive.css  Breakpoints
Firebase Security Rules

Each user can only access their own workspace.

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/private/{documentId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
Getting Started
1. Clone Repository
git clone https://github.com/fermantonoihsan/Ruang-Kerja.git
2. Install Firebase CLI
npm install -g firebase-tools
3. Login Firebase
firebase login
4. Run Local Server
firebase serve
5. Deploy
firebase deploy
Deployment Scripts

Example package.json scripts:

{
  "scripts": {
    "dev": "firebase serve",
    "serve": "firebase serve",
    "deploy": "firebase deploy",
    "deploy:hosting": "firebase deploy --only hosting",
    "deploy:rules": "firebase deploy --only firestore:rules"
  }
}
Roadmap
Phase 1
Firebase deployment readiness
CSS architecture migration
Dashboard foundation
Phase 2
Kanban redesign
Reminder redesign
Dark mode stabilization
App modularization
Phase 3
Complete ES module architecture
Sync optimization
Better offline support
GitHub Actions deployment
Accessibility improvements
Planned Features
Multi-workspace support
Command palette
Favorites / pinned pages
Workspace templates
Import/export JSON
Conflict resolution viewer
Keyboard-first workflow
Better mobile gestures
Design Principles
Local-first by default
Fast interaction over complexity
Minimal cognitive friction
Clear visual hierarchy
Modern calm UI
Offline-friendly workflow
Progressive enhancement
Current Development Status
[x] Workspace layout
[x] Sidebar
[x] Notes
[x] Kanban
[x] Reminders
[x] Firebase Settings
[x] Topbar command/search bar
[x] Settings modal
[x] Sync badge
[x] Dark mode
[x] Empty states
[~] Dashboard refinement
[~] Sidebar restructuring
[~] JS modularization
[ ] Full production refactor
Author

Muhammad Himam Awali
Atlas Workspace / Ruang Kerja Project

License

MIT License
