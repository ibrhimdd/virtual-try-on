# VESTRA — Virtual Try-On

A React + Vite virtual fitting room prototype. It uses the device camera and MediaPipe Pose Landmarker to estimate shoulder/torso position, then renders a selected garment overlay on the live video.

## Run locally

```bash
npm install
npm run dev
```

Camera access requires HTTPS or localhost. On mobile, open the deployed site in a modern browser and allow camera permission. Use the rear/front camera switch when available.

## Deploy

Import this repository into Vercel. Framework preset: **Vite**. Build command: `npm run build`; output directory: `dist`.

## Prototype notes

This is a real-time pose-aligned 2D garment overlay, not a photorealistic AI clothing synthesis model or a guarantee of garment sizing/fit. MediaPipe model and WASM assets are loaded from Google-hosted URLs at runtime.
