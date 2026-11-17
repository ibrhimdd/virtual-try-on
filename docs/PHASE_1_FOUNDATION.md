# VESTRA ART LAB — Phase 1 Foundation

## Approved architecture
- Multidisciplinary creative lab for college students.
- Provider-agnostic AI integration boundary; no AI vendor is coupled to the UI.
- Firebase Authentication and Cloud Firestore for Phase 1.
- Existing virtual fitting room remains at the root path and is preserved.
- Student workspace is available at /lab.

## Phase 1 features
- Email/password student registration, sign-in, and sign-out.
- Responsive Arabic RTL student dashboard.
- Multidisciplinary discipline selection.
- Create and list student-owned Firestore projects.
- Setup guidance when Firebase environment values are absent.

## Firebase setup
1. Create a Firebase project and register a Web App.
2. Enable Email/Password in Firebase Authentication.
3. Create a Cloud Firestore database.
4. Publish the repository firestore.rules rules.
5. Add values from .env.example to local .env.local and Vercel environment variables.
6. Deploy and open /lab.

Firebase web configuration is not a service-account credential. Restrict API-key referrers and enforce access through Authentication and Firestore Security Rules. Never expose service-account credentials or AI provider secrets in VITE_ variables.

## Initial data model
Path: users/{uid}/projects/{projectId}
Fields: title, discipline, disciplineName, status, ownerUid, createdAt, updatedAt.

## AI provider boundary
Future generation and analysis requests will call server-side application endpoints through a provider adapter. UI components must not call vendor SDKs directly. Decart remains dedicated to the existing real-time virtual fitting feature.

## Acceptance criteria
- / continues to render the existing virtual fitting room.
- /lab displays setup guidance if Firebase is not configured.
- With Firebase configured, a student can register, sign in, sign out, create a project, refresh, and see their saved projects.
- Firestore rules restrict access to the authenticated owner UID.
- Layout remains usable on mobile screens.
