# Atlas Workspace

> A calm, local-first productivity workspace for notes, Kanban planning, reminders, and structured thinking.

Atlas Workspace is a lightweight personal workspace app designed for fast daily planning. It works without login, stores data locally first, and adds Firebase-powered cloud sync for signed-in users.

## Live Demo

- https://atlas-workspace-af04b.web.app/
- https://atlas-workspace-af04b.firebaseapp.com/

## Repository

- https://github.com/fermantonoihsan/Ruang-Kerja

## Product Positioning

Atlas Workspace is positioned as a calm productivity workspace, not a heavy project management suite. The product focuses on quick capture, readable notes, lightweight Kanban flow, reminders, and low-friction daily use.

## Features

- Markdown notes editor with live preview
- Kanban board generated from pages
- Reminder management
- Tags, filtering, and search
- Dashboard overview
- Local-first storage with `localStorage`
- Firebase Authentication and Firestore cloud sync
- User-isolated Firestore security rules
- Dark mode
- Responsive PWA-ready interface

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript |
| Styling | CSS |
| State | Local state + localStorage |
| Cloud | Firebase Firestore |
| Auth | Firebase Authentication |
| Hosting | Firebase Hosting |
| PWA | Service Worker |
| Icons | Lucide Icons + local SVG assets |

## Project Structure

```text
Ruang-Kerja/
├── index.html
├── app.js
├── styles.css
├── manifest.webmanifest
├── service-worker.js
├── firebase.json
├── firebase.rules
├── firestore.indexes.json
├── package.json
├── src/
│   ├── app.runtime.js
│   ├── config/
│   ├── features/
│   ├── services/
│   ├── state/
│   ├── ui/
│   └── utils/
└── styles/
    └── modular CSS source files
```

## Getting Started

```bash
git clone https://github.com/fermantonoihsan/Ruang-Kerja.git
cd Ruang-Kerja
npm install
npm run serve
```

For Firebase deployment:

```bash
npm run deploy:hosting
```

## Development Status

- [x] Workspace layout
- [x] Sidebar navigation
- [x] Notes and Markdown preview
- [x] Kanban board
- [x] Reminders
- [x] Firebase settings
- [x] Auth and sync badge
- [x] Dark mode
- [x] Empty states
- [x] Brand consistency pass
- [ ] Import/export workspace JSON
- [ ] Full accessibility QA
- [ ] Conflict handling for offline sync
- [ ] Production release checklist

## Roadmap

1. Stabilize the beta UI and mobile experience.
2. Add import/export so users can own and move their data.
3. Improve cloud sync state, error recovery, and conflict handling.
4. Add workspace templates and pinned pages.
5. Publish the first beta release as `v0.1.0-beta`.

## Firebase Security Rules

Each authenticated user can only access their own workspace document.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/private/workspace {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Author

Ihsan Fermantono

## License

MIT License
