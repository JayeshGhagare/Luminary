# 🌟 Luminary

> **Cinematic, High-Performance Video Meetings & Real-Time Collaboration**  
> *100% Free, Open-Source, and Powered by WebRTC & Socket.IO*

---

## ✨ Overview

**Luminary** is a modern, high-fidelity video conferencing web application designed with boutique cinema-grade aesthetics, responsive grid layouts, and built-in productivity tooling.

Built from the ground up with **React 19**, **TypeScript**, **Tailwind CSS**, and a **Node.js + Socket.IO** real-time engine using **Google's public STUN servers**, Luminary offers zero-cost, serverless peer-to-peer audio/video streaming with zero external subscription fees.

---

## 🎨 The 6 Signature Themes

Luminary features custom CSS custom-property design tokens, delicate 3D card borders, and glowing active speaker highlights:

1. 🎬 **Crimson Velvet (Dark)**: Flagship velvet crimson rose on soothing charcoal obsidian depth.
2. 🌸 **Crimson Rose (Light)**: Silky light theme with gentle rosewood accents on warm alabaster pearl.
3. 🎞️ **Cinematic Dark**: Auteur film aesthetic with warm 35mm amber sheen on charcoal matte slate.
4. 🌊 **Midnight Ocean**: Bioluminescent soft neon cyan and aquamarine glassmorphism on midnight navy.
5. 🌙 **Classic Dark**: Authentic dark meeting interface with soft Google Blue accents.
6. ☀️ **Clean Light**: Crisp, professional material daytime design.

---

## 🚀 Key Features

* **🎥 Core Audio & Video Engine**:
  * P2P WebRTC video mesh with Google STUN (`stun:stun.l.google.com:19302`).
  * Real-time **Active Speaker Detection** via Web Audio API `AnalyserNode` with pulsating theme-colored glow rings.
  * Instant camera and mic toggles with persistent stream binding (no remount lag or blank frames).
  * **Spacebar Push-to-Talk**: Hold Spacebar to speak while muted.
  * Green Room pre-join lobby with live mic volume visualizer, device speaker test, and background blur preview.
* **🖥️ Screen Sharing with Tab/System Audio**:
  * Share entire screen, application window, or browser tab.
  * Web Audio API mixer combines presenter microphone and tab/system audio into a unified outbound stream.
  * Automatic room-wide presentation spotlighting for all participants.
* **📝 Notes & To-Do Productivity Drawer**:
  * Dedicated **Notes icon** on the bottom control bar and sidebar.
  * **Meeting Scratchpad**: Auto-saves to `localStorage`, toggle between **Shared Room Notes** (live synced via WebSockets) and **Personal Private Notes**, with **1-Click Export to Markdown (`.md`)**.
  * **Interactive Action Items**: Checkable tasks with priority badges (`High` 🔴, `Medium` 🟡, `Low` 🟢) and synthesized audio completion chimes.
  * **1-Click Meeting Templates**: *Sprint Standup*, *1-on-1 Catchup*, *Brainstorming*, and *Architecture Decision Log (ADR)*.
* **💬 Real-Time In-Meeting Collaboration**:
  * Real-time room chat with pinned messages and emoji quickbar.
  * Floating emoji reactions (`💖`, `👍`, `🎉`, `👏`, `😂`, `😮`, `😢`, `🤔`, `👎`) with organic physics animations.
  * Ordered hand-raising queue with authentic audio bell chimes.
  * Zero-cost **Live Captions (`CC`)** powered by the native browser Web Speech API.
* **🛡️ Host Controls & Moderation**:
  * Mute all participants.
  * Lower all hands.
  * Remove participants.
* **📱 Mobile & Responsive Design**:
  * Fully responsive from 4K widescreen down to mobile smartphone screens.
  * Touch-friendly bottom bar and swipeable drawer sheets.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
* **Signaling Server**: Node.js, Express, Socket.IO.
* **Media Protocols**: WebRTC (`RTCPeerConnection`, `MediaStream`), Web Audio API, Web Speech API.

---

## 🏁 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* `npm` or `pnpm`

### Installation
```bash
# Clone the repository
git clone https://github.com/JayeshGhagare/Luminary.git
cd Luminary

# Install all dependencies (root, server, and client)
npm install
npm install --prefix server
npm install --prefix client
```

### Running Locally
```bash
# Starts both signaling server (:5000) and client (:3000) concurrently
npm run dev
```

Visit **`http://localhost:3000`** in your browser!

---

## 📄 License
MIT License. Built with ❤️ for open, free video communication.
