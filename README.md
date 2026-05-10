# Atlas Workspace

Aplikasi workspace mirip Notion yang berjalan local-first dan siap disambungkan ke Firebase untuk authentication serta cloud sync.

## Fitur

- Email/password authentication lewat Firebase Auth.
- Cloud sync ke Cloud Firestore per user.
- Local-first storage lewat `localStorage`.
- Responsive desktop/mobile.
- Kanban drag-drop.
- Markdown editor dan preview.
- Reminders dengan browser notifications.
- Tags, search, filter, duplicate, dan delete page.
- PWA shell saat dijalankan lewat `http://` atau hosting.

## Cara menjalankan

Untuk preview cepat, buka `index.html` langsung di browser.

Untuk mode PWA/service worker, jalankan static server di folder ini:

```bash
npx serve .
```

## Setup Firebase

1. Buat project di Firebase Console.
2. Buka Build > Authentication > Sign-in method, lalu aktifkan Email/Password.
3. Buka Build > Firestore Database, buat database, lalu publish rules dari `firebase.rules`.
4. Buka Project settings > General > Your apps, buat Web app.
5. Salin `apiKey`, `authDomain`, `projectId`, dan `appId`.
6. Buka app, klik tombol Firebase Settings, masukkan config tersebut.
7. Login atau buat akun dari app.

Data workspace disimpan di:

```text
users/{uid}/private/workspace
```

Contoh Firebase config yang dibutuhkan app:

```js
{
  apiKey: "AIza...",
  authDomain: "project-id.firebaseapp.com",
  projectId: "project-id",
  appId: "1:123:web:abc"
}
```

## Deploy

Folder ini bisa di-deploy sebagai static site ke Firebase Hosting, Vercel, Netlify, atau Cloudflare Pages. Untuk production, config Firebase bisa tetap dimasukkan lewat Firebase Settings di app.
