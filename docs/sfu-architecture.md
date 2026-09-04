# Luminary — Scalability Blueprint: WebRTC Mesh to SFU Migration

## 1. Executive Summary

Luminary currently operates on a **peer-to-peer (P2P) Full-Mesh WebRTC architecture**. While full-mesh is optimal for zero-infrastructure costs and ultra-low latency between 2 to 4 participants, connection overhead and client upload constraints scale quadratically ($N \times (N-1)$ connections).

This document outlines the architectural blueprint, mathematical analysis, SFU engine evaluation, and step-by-step implementation guide to scale Luminary to **100+ concurrent participants per room** while preserving our **₹0 infrastructure cost** principle.

---

## 2. Mathematical Scaling Limits: Mesh vs. SFU vs. MCU

| Metric | Full-Mesh (Current) | SFU (Selective Forwarding Unit) | MCU (Multipoint Control Unit) |
| :--- | :--- | :--- | :--- |
| **Peer Connections per Client** | $N - 1$ | **1 upstream + 1 downstream** | 1 upstream + 1 downstream |
| **Total Media Streams in Room** | $N \times (N - 1)$ | $N \text{ (in)} + N \times (N - 1) \text{ (out)}$ | $N \text{ (in)} + N \text{ (out)}$ |
| **Client Upload Bandwidth** | $(N - 1) \times B_{\text{up}}$ | **$1 \times B_{\text{up}}$ (Constant)** | $1 \times B_{\text{up}}$ |
| **Client Download Bandwidth** | $(N - 1) \times B_{\text{down}}$ | $(N - 1) \times B_{\text{down}}$ (simulcast-managed) | $1 \times B_{\text{down}}$ (composite) |
| **Client CPU Utilization** | High ($N-1$ encoders) | **Low (1 hardware encoder)** | Low |
| **Server CPU Utilization** | None (Signaling only) | Low to Medium (Packet routing) | Extreme (Server re-encoding) |
| **Server Bandwidth** | 0 MB (Signaling only) | High (Packet forwarding) | Medium |
| **Max Practical Participants** | **4 – 6** | **50 – 250+** | 20 – 50 |

### The "Uplink Wall" in Mesh
For a 720p 30fps video stream requiring $\sim 1.5\text{ Mbps}$:
- **4 participants:** Client uploads $3 \times 1.5 = 4.5\text{ Mbps}$ (Feasible for typical broadband).
- **8 participants:** Client uploads $7 \times 1.5 = 10.5\text{ Mbps}$ (Exceeds typical residential uplink $\to$ packet loss, frame freezes).
- **12 participants:** Client uploads $11 \times 1.5 = 16.5\text{ Mbps}$ (Total failure for mobile and standard Wi-Fi).

In an **SFU**, the client uploads only **one stream** (or 3 simulcast layers: 1080p, 720p, 180p totaling $\sim 2.2\text{ Mbps}$) regardless of whether there are 5 or 150 participants in the meeting room.

---

## 3. SFU Engine Comparison

| Engine | Language | Pros | Cons | Verdict for Luminary |
| :--- | :--- | :--- | :--- | :--- |
| **LiveKit** | Go / Rust | • Batteries-included (Auth, E2EE, Turn, SDKs)<br>• Official React SDK (`@livekit/components-react`)<br>• Zero-cost cloud tier (50GB free/month)<br>• Easy single-binary Docker deployment | • Higher memory footprint than Mediasoup | **Primary Recommendation** |
| **Mediasoup** | C++ / Node.js | • Unmatched raw performance<br>• Extremely low resource usage<br>• Tight Node.js integration | • Low-level C++ library; requires building custom signaling, auth, and state handling from scratch | Strong alternative for custom C++ control |
| **Janus** | C | • Proven mature WebRTC gateway<br>• Modular plugin architecture | • Complex C config, older architecture | Less developer-friendly for React |
| **Pion WebRTC** | Go | • Pure Go implementation<br>• Great flexibility | • Requires building high-level SFU features manually | Best for custom Go backends |

---

## 4. LiveKit Architecture Blueprint

```
                     ┌────────────────────────┐
                     │   Luminary Client      │
                     │  (React 19 + LiveKit)  │
                     └──────────┬─────────────┘
                                │
               ┌────────────────┴────────────────┐
               │ WebRTC (SRTP/DTLS Media Tracks)  │
               ▼                                 ▼
      ┌─────────────────┐               ┌─────────────────┐
      │  Publish Track  │               │ Subscribe Track │
      │  (1 x Simulcast)│               │  (Active Grid)  │
      └────────┬────────┘               └────────▲────────┘
               │                                 │
               ▼                                 │
   ┌─────────────────────────────────────────────────────────────┐
   │                   LiveKit SFU Gateway                       │
   │                                                             │
   │  ┌─────────────────┐  Dynamic Packet  ┌──────────────────┐  │
   │  │ Upstream Router │ ───────────────► │ Downstream Sub   │  │
   │  └─────────────────┘   Optimization   │ (Adaptive Res)   │  │
   │                                       └──────────────────┘  │
   └──────────────────────────────▲──────────────────────────────┘
                                  │
                    Token Auth & Room Lifecycle
                                  │
                     ┌────────────┴───────────┐
                     │  Luminary Auth Server  │
                     │  (Node.js Express API) │
                     └────────────────────────┘
```

### Key Architectural Concepts
1. **Simulcast**:
   - The publisher sends 3 spatial layers:
     - **High**: 1080p @ 3.0 Mbps (rendered when participant is pinned/spotlighted).
     - **Medium**: 720p @ 1.2 Mbps (rendered in 2x2 or 3x3 grids).
     - **Low**: 180p @ 150 kbps (rendered in 16+ gallery thumbnails).
   - The SFU dynamically routes the appropriate layer to each subscriber based on their viewport DOM size.
2. **Dynamic Audio Mixing / Selective Subscriptions**:
   - Audio tracks are never re-encoded; packets are forwarded directly with zero latency.
   - Subscribers only receive audio from the top 6 active speakers to prevent browser audio graph congestion.
3. **End-to-End Encryption (E2EE)**:
   - WebRTC Insertable Streams encrypt audio/video frames on the sender with AES-GCM before transmission; the SFU forwards ciphertext without ability to inspect media.

---

## 5. Migration Roadmap: From Mesh to LiveKit

### Step 1: Server Token Generation
Add `livekit-server-sdk` to `server/package.json`:
```javascript
// server/src/routes/livekit.js
import { AccessToken } from 'livekit-server-sdk';

export const createMeetingToken = (roomId, participantName, isHost) => {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
      name: participantName,
    }
  );

  at.addGrant({
    roomJoin: true,
    room: roomId,
    canPublish: true,
    canSubscribe: true,
    roomAdmin: isHost,
  });

  return at.toJwt();
};
```

### Step 2: Client WebRTC Layer Swap
Replace peer connection loops in `client/src/context/WebRTCContext.tsx` with LiveKit's `Room`:
```typescript
import { Room, RoomEvent, VideoPresets } from 'livekit-client';

const room = new Room({
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
});

await room.connect(LIVEKIT_URL, token);
await room.localParticipant.enableCameraAndMicrophone();
```

### Step 3: Backward-Compatible Fallback Strategy
To maintain a ₹0 operating cost:
- For rooms with $\le 4$ participants: Client can optionally negotiate P2P mesh directly (zero server bandwidth).
- When the 5th participant joins: The host triggers an in-band migration signal (`sfu-migration-required`), and clients seamlessly reconnect to the LiveKit SFU instance.

---

## 6. Zero-Cost / Free-Tier Hosting Strategy (₹0 Budget)

| Provider | Specifications | Cost | Suitability |
| :--- | :--- | :--- | :--- |
| **Oracle Cloud Free Tier** | 4 OCPU ARM (Ampere A1), 24 GB RAM, 10 TB/month egress | **₹0 forever** | **Best for Self-Hosted SFU**: Can handle 300+ concurrent video streams with zero cost. |
| **LiveKit Cloud Free Tier** | 50 GB bandwidth/month, 100 max participants, 20 concurrent rooms | **₹0 forever** | **Best for Managed Setup**: Zero server maintenance, instant deployment. |
| **Fly.io Free Tier** | 3 shared-cpu-1x VMs, 256MB RAM, 100GB outbound data | **₹0 forever** | Good for Node.js signaling and token server. |
| **Hetzner Cloud (Budget)** | 2 vCPU, 4 GB RAM, 20 TB traffic (€3.79 / month) | $\sim$ ₹340 / mo | Extreme value if bandwidth exceeds free tiers. |

---

## 7. Production Docker Deployment for LiveKit SFU

To deploy LiveKit alongside Luminary on any VM:

```yaml
# livekit-compose.yml
version: '3.9'

services:
  livekit:
    image: livekit/livekit-server:latest
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    command: --config /etc/livekit.yaml

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
```

```yaml
# livekit.yaml
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
keys:
  API_KEY_LUMINARY: YOUR_SECRET_KEY_LUMINARY_SECURE_HASH
```

---

## 8. Summary of Benefits Post-Migration

1. **Scalability**: Seamless expansion from 4 participants to 100+ participants per call.
2. **Network Resilience**: 75% reduction in client upload bandwidth requirements.
3. **Battery & Thermals**: Client devices only encode 1 stream instead of $N-1$, drastically lowering CPU temperature and battery drain on laptops and mobile devices.
4. **Adaptive Quality**: Users on slow 4G/3G connections automatically receive lower resolution without degrading the stream quality for participants on high-speed fiber.
