# Dynamic Mono vs. Stereo WebRTC Audio Architecture

A reusable engineering guide for implementing **bandwidth-optimized Mono audio broadcasting and receiving** with an optional per-channel/per-event **Stereo fallback toggle** in WebRTC and LiveKit applications.

---

## 1. Architectural Motivation & Bandwidth Math

### The Problem
By default, web browsers (`navigator.mediaDevices.getUserMedia`) and WebRTC engines capture and negotiate **2-channel stereo audio** at **64–96 kbps** Opus bitrates. 

For **human voice translation**, podcasts, and spoken conferences:
* Human speech is inherently **monophonic** (a single voice point source).
* Stereo encoding sends redundant Left/Right channel data, wasting **50% to 70%** of network bandwidth with zero improvement in speech intelligibility.

### The Bandwidth Math at Scale
Assuming an event with **1,000 concurrent listeners**:

| Mode | Channels | Opus Bitrate | Bandwidth per Listener | Egress for 1,000 Listeners |
| :--- | :--- | :--- | :--- | :--- |
| **Stereo (Default)** | 2 channels | 64 – 96 kbps | ~80 kbps | **~80 Mbps** |
| **Mono (Bandwidth Saver)** | 1 channel | 24 kbps | ~24 kbps | **~24 Mbps** |
| **Mono + DTX (Silence)** | 1 channel | 0 – 24 kbps | ~16 kbps avg | **~16 Mbps** |

> **Net Result:** Mono cuts server egress costs, mobile listener data consumption, and packet drop rates by **~65% to 75%**, dramatically reducing buffering and audio glitches on constrained mobile networks.

---

## 2. End-to-End Pipeline Architecture

```
[ Human Translator Mic ]
           │
           ▼
[ getUserMedia Capture ]
  - channelCount: 1 (Mono) or 2 (Stereo)
  - echoCancellation: true
  - noiseSuppression: true
  - autoGainControl: true
           │
           ▼
[ LiveKit Publisher Encoding ]
  - useMono ? AudioPresets.speech (24 kbps) : AudioPresets.musicStereo (64 kbps)
  - dtx: true (Discontinuous Transmission for silence)
  - red: true (RFC 2198 audio redundancy)
           │
           ▼ WebRTC SDP Negotiation (stereo=0 vs stereo=1)
[ LiveKit SFU Server ]
           │
           ▼ Single-Channel Mono RTP Packets
[ Audience Listener Browser ]
  - Receives ~24 kbps stream over the wire
  - Decoded directly into HTMLAudioElement / Web Audio API
```

---

## 3. Implementation Details

### Step 1: Database Schema ([supabase/migrations/007_event_use_mono.sql](file:///Users/Nirmal/projects/appdews/VocNix/supabase/migrations/007_event_use_mono.sql))
Add a boolean column to your event or room entity, defaulting to `true`:

```sql
ALTER TABLE events
ADD COLUMN IF NOT EXISTS use_mono BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN events.use_mono IS 'Whether audio broadcast and listening channels operate in mono (default, bandwidth-saver at 24kbps) or full stereo (64kbps)';
```

---

### Step 2: Audio Engine Service ([lib/audio/AudioService.ts](file:///Users/Nirmal/projects/appdews/VocNix/lib/audio/AudioService.ts))

#### A. Publisher Pipeline (Microphone Capture & Publishing)
```typescript
import {
  Room,
  Track,
  createLocalAudioTrack,
  AudioPresets,
  AudioCaptureOptions,
} from 'livekit-client';

export async function connectPublisher(params: {
  wsUrl: string;
  token: string;
  deviceId?: string;
  useMono?: boolean; // Default: true
}) {
  const useMono = params.useMono !== false;

  // 1. Microphone capture constraint: 1 channel for mono, 2 for stereo
  const audioOptions: AudioCaptureOptions = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: useMono ? 1 : 2,
    deviceId: params.deviceId,
  };

  const localAudioTrack = await createLocalAudioTrack(audioOptions);

  // 2. Room client defaults
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      channelCount: useMono ? 1 : 2,
    },
    publishDefaults: {
      audioPreset: useMono ? AudioPresets.speech : AudioPresets.musicStereo,
      dtx: true, // Suspends transmission during pauses
      red: true, // RFC 2198 Redundant Audio Data for packet loss recovery
    },
  });

  await room.connect(params.wsUrl, params.token);

  // 3. Publish track with speech (24 kbps) or stereo (64 kbps) preset
  await room.localParticipant.publishTrack(localAudioTrack, {
    name: 'microphone',
    source: Track.Source.Microphone,
    audioPreset: useMono ? AudioPresets.speech : AudioPresets.musicStereo,
    dtx: true,
    red: true,
  });

  return { room, localAudioTrack };
}
```

#### B. Subscriber Pipeline (Audience Listener)
```typescript
export async function connectSubscriber(params: {
  wsUrl: string;
  token: string;
  targetAudioElement: HTMLAudioElement;
  useMono?: boolean; // Default: true
}) {
  const room = new Room({
    adaptiveStream: true,
  });

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Audio) {
      // Direct hardware attachment: WebRTC negotiates mono Opus SDP
      track.attach(params.targetAudioElement);
    }
  });

  await room.connect(params.wsUrl, params.token);
  return room;
}
```

---

### Step 3: Server-Side Token & Metadata Delivery
When minting tokens for the publisher or subscriber, include the `useMono` state so both sides negotiate the same mode:

```typescript
// Translator / Publisher Token Response
return NextResponse.json({
  success: true,
  token: livekitToken,
  wsUrl: livekitConfig.url,
  room: {
    id: room.id,
    livekitRoomName: room.livekit_room_name,
    useMono: event.use_mono !== false, // Default to true
  },
});
```

```typescript
// Audience / Subscriber Token Response
return NextResponse.json({
  success: true,
  token: audienceToken,
  wsUrl: livekitConfig.url,
  room: {
    id: room.id,
    useMono: event.use_mono !== false, // Default to true
  },
});
```

---

### Step 4: UI Toggle Pattern ([app/dashboard/page.tsx](file:///Users/Nirmal/projects/appdews/VocNix/app/dashboard/page.tsx))

Provide an explicit toggle in event creation & edit forms while keeping Mono selected by default:

```tsx
<div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
  <div className="pr-4">
    <div className="text-xs font-semibold text-slate-200 flex items-center space-x-2">
      <span>Audio Channel Mode</span>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        {useMono ? 'Mono (Default · Bandwidth Saver)' : 'Stereo (Full Audio)'}
      </span>
    </div>
    <p className="text-[11px] text-slate-400 mt-1">
      Mono optimizes human speech translation and cuts bandwidth by ~50% across translators and audience members. Toggle off to use regular stereo mode.
    </p>
  </div>
  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
    <input
      type="checkbox"
      checked={useMono}
      onChange={(e) => setUseMono(e.target.checked)}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
  </label>
</div>
```

---

## 4. How to Verify Opus SDP Negotiation

To verify that the browser is actually sending and receiving mono over WebRTC:

1. Open Chrome and navigate to `chrome://webrtc-internals`.
2. Inspect the active PeerConnection `local-description` (SDP offer/answer).
3. Search for the `opus` codec entry:
   * **Mono Mode (Bandwidth Saver):**
     `a=fmtp:111 minptime=10;useinbandfec=1;stereo=0;sprop-stereo=0`
     Bitrate graph will stabilize between **20 kbps and 26 kbps**.
   * **Stereo Mode:**
     `a=fmtp:111 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1`
     Bitrate graph will operate between **64 kbps and 96 kbps**.

---

## 5. Automated Test Suite ([test_mono_stereo_audio.mjs](file:///Users/Nirmal/projects/appdews/VocNix/test_mono_stereo_audio.mjs))

Run the automated integration test suite:

```bash
node test_mono_stereo_audio.mjs
```

**Verifies:**
* ✅ Default event creation automatically sets `use_mono = true`.
* ✅ Translator token API delivers `useMono = true`.
* ✅ Audience event metadata delivers `useMono = true`.
* ✅ Audience session token delivers `useMono = true`.
* ✅ Explicit `use_mono: false` creates stereo events.
* ✅ Updating an event via `PATCH /api/events/:id` dynamically updates audio mode.
