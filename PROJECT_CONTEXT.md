# Class Memories Gallery Project Context

## Project Overview
This is a responsive, interactive web gallery application designed to display class yearbook photos and videos. It provides a premium, cinematic user experience with smooth animations and "dark mode" aesthetics.

## Tech Stack
- **Framework**: React (via Vite)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox/Grid) with custom Glassmorphism effects. No Tailwind.
- **Animations**: `framer-motion` (for layout transitions, modals, parallax).
- **Icons**: `react-icons` (Io5).
- **Infinite Scroll**: `react-intersection-observer`.

## Key Features
1.  **Media Source**: Automatically imports all images/videos from the local directory `../../Cloud` (relative to the project root).
    - *Note*: Vite config is modified to allow serving files from the parent directory.
2.  **Layout**:
    - **Masonry Grid**: Dynamic column layout that adapts to screen size (1-4 columns).
    - **Parallax Header**: Title text moves slower than background on scroll.
    - **Ambient Background**: Floating animated "orbs" in the background.
3.  **Navigation & Interaction**:
    - **Splash Screen**: Intro animation on first load.
    - **Lightbox Modal**: detailed view for media with "layoutId" shared element transitions (zoom effect).
    - **Gestures**: Swipe left/right support on touch devices to navigate the lightbox.
    - **Keyboard Support**: Arrow keys to navigate, Esc to close.
4.  **Settings Drawer**:
    - Slide-out menu to control: Grid columns, Auto-play videos, and Info overlay visibility.
    - Settings are persisted in `localStorage`.

## Directory Structure
- `src/App.jsx`: Main logic (Data loading, State management, UI rendering).
- `src/App.css`: All styling (Reset, Grid, specific animations, media queries).
- `vite.config.js`: Configured with `server.fs.allow: ['..']` to access external media folder.

## Current State
The application is fully functional, mobile-responsive, and runs locally. It does not require a backend (serverless/static logic relying on Vite's build-time glob import).
