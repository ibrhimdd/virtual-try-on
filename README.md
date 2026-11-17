# VESTRA ART LAB

A multidisciplinary digital art and design innovation lab for college students, combining creative workflows, future AI-assisted generation and critique (provider-agnostic), and the existing VESTRA virtual fitting room.

## Applications
- / — Existing VESTRA virtual fitting room; current catalog and Decart camera workflow are preserved.
- /lab — Student workspace foundation (Firebase Authentication and student-owned Firestore projects).

## Stack
- React 18 + Vite 6
- Firebase Authentication + Cloud Firestore
- Provider-agnostic AI architecture (AI integrations are a later phase)
- Existing Decart SDK for real-time virtual fitting only

## Local development
1. Use Node.js 20 or newer.
2. Copy .env.example to .env.local and add Firebase Web App values.
3. Enable Email/Password Authentication and create Firestore in Firebase Console.
4. Publish firestore.rules to Firebase.
5. Run npm install and npm run dev.
6. Open /lab for the workspace or / for the original fitting room.

If Firebase is not configured, /lab displays setup guidance; / remains available.

## Deployment
Vercel preset: Vite. Build command: npm run build. Output: dist. Configure the variables listed in .env.example before using /lab. GitHub Actions builds feature branches and main.

## Security
Firestore rules scope projects to the authenticated owner UID. Restrict Firebase API-key referrers. Never expose service-account credentials or AI provider secrets through VITE_ variables. AI calls will be server-side through a provider adapter.

## Scope note
The current virtual fitting feature is an experimental real-time clothing preview, not a guarantee of physical garment sizing or material simulation. Phase 1 does not implement AI design generation or analysis yet.
