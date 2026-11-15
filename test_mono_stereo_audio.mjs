import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== VOCNIX: MONO / STEREO AUDIO BANDWIDTH SAVER TEST SUITE ===\n');

  // STEP 1: Create Event with default settings (should default to use_mono = true)
  console.log('[TEST 1] Creating event with default settings (expecting use_mono: true)...');
  const createDefaultRes = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Global Tech Summit (Default Mono)',
      description: 'Testing default mono bandwidth saver mode',
      scheduled_start: new Date().toISOString(),
      languages: [
        { code: 'ta', name: 'Tamil' },
        { code: 'hi', name: 'Hindi' },
      ],
    }),
  });

  const createDefaultData = await createDefaultRes.json();
  assert.strictEqual(createDefaultData.success, true, 'Event creation should succeed');
  assert.strictEqual(createDefaultData.event.use_mono, true, 'Default use_mono must be true');
  assert.strictEqual(createDefaultData.event.useMono, true, 'Default useMono must be true');
  console.log('  ✔ Created event ID:', createDefaultData.event.id);
  console.log('  ✔ use_mono:', createDefaultData.event.use_mono);
  console.log('  ✔ useMono:', createDefaultData.event.useMono);
  console.log('  Passed!\n');

  const defaultEventId = createDefaultData.event.id;
  const defaultEventPublicToken = createDefaultData.event.public_access_token;
  const defaultRoomToken = createDefaultData.rooms[0].secure_room_token;
  const defaultRoomId = createDefaultData.rooms[0].id;

  // STEP 2: Verify Translator Token returns useMono = true
  console.log('[TEST 2] Verifying translator token endpoint returns useMono: true...');
  const transTokenRes = await fetch(`${BASE_URL}/api/livekit/translator-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secureRoomToken: defaultRoomToken,
      translatorName: 'Tamil Translator',
    }),
  });
  const transTokenData = await transTokenRes.json();
  assert.strictEqual(transTokenData.success, true);
  assert.strictEqual(transTokenData.room.useMono, true, 'Translator room must have useMono = true');
  console.log('  ✔ Translator room useMono:', transTokenData.room.useMono);
  console.log('  Passed!\n');

  // STEP 3: Verify Audience Event endpoint returns useMono = true
  console.log('[TEST 3] Verifying audience event endpoint returns useMono: true...');
  const audEventRes = await fetch(`${BASE_URL}/api/audience/event/${defaultEventPublicToken}`);
  const audEventData = await audEventRes.json();
  assert.strictEqual(audEventData.success, true);
  assert.strictEqual(audEventData.event.useMono, true, 'Audience event must have useMono = true');
  console.log('  ✔ Audience event useMono:', audEventData.event.useMono);
  console.log('  Passed!\n');

  // STEP 4: Verify Audience Token endpoint returns useMono = true
  console.log('[TEST 4] Verifying audience token endpoint returns useMono: true...');
  const audTokenRes = await fetch(`${BASE_URL}/api/livekit/audience-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventToken: defaultEventPublicToken,
      roomId: defaultRoomId,
      languageCode: 'ta',
    }),
  });
  const audTokenData = await audTokenRes.json();
  assert.strictEqual(audTokenData.success, true);
  assert.strictEqual(audTokenData.room.useMono, true, 'Audience token room must have useMono = true');
  console.log('  ✔ Audience room useMono:', audTokenData.room.useMono);
  console.log('  Passed!\n');

  // STEP 5: Create Event with explicit use_mono = false (Stereo Mode)
  console.log('[TEST 5] Creating event with explicit use_mono: false (Stereo mode)...');
  const createStereoRes = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Orchestral Symphony Broadcast (Stereo)',
      description: 'Full stereo fidelity audio stream',
      scheduled_start: new Date().toISOString(),
      use_mono: false,
      languages: [
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'French' },
      ],
    }),
  });

  const createStereoData = await createStereoRes.json();
  assert.strictEqual(createStereoData.success, true);
  assert.strictEqual(createStereoData.event.use_mono, false, 'use_mono must be false for stereo');
  assert.strictEqual(createStereoData.event.useMono, false, 'useMono must be false for stereo');
  console.log('  ✔ Created stereo event ID:', createStereoData.event.id);
  console.log('  ✔ use_mono:', createStereoData.event.use_mono);
  console.log('  ✔ useMono:', createStereoData.event.useMono);
  console.log('  Passed!\n');

  // STEP 6: Toggle Event from Stereo to Mono via PATCH /api/events/:id
  console.log('[TEST 6] Toggling stereo event to mono via PATCH /api/events/:id...');
  const patchRes = await fetch(`${BASE_URL}/api/events/${createStereoData.event.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      use_mono: true,
    }),
  });
  const patchData = await patchRes.json();
  assert.strictEqual(patchData.success, true);
  assert.strictEqual(patchData.event.use_mono, true, 'Updated event use_mono must be true');
  console.log('  ✔ Patched event use_mono to:', patchData.event.use_mono);
  console.log('  Passed!\n');

  console.log('===============================================================');
  console.log('ALL MONO/STEREO AUDIO BANDWIDTH SAVER TESTS PASSED 100% SUCCESS!');
  console.log('===============================================================');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
