import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== VOCNIX: TRANSLATOR-AUDIENCE INTERACTIVE ANNOUNCEMENTS TEST SUITE ===\n');

  // STEP 1: Create an Event with Tamil and Hindi
  console.log('[TEST 1] Creating live event...');
  const createRes = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Interactive Keynote 2026',
      description: 'Testing translator-audience interactivity announcements',
      scheduled_start: new Date().toISOString(),
      languages: [
        { code: 'ta', name: 'Tamil' },
        { code: 'hi', name: 'Hindi' },
      ],
    }),
  });

  const createData = await createRes.json();
  assert.strictEqual(createData.success, true, 'Event creation should succeed');
  assert(createData.rooms && createData.rooms.length > 0, 'Rooms should be generated');

  const roomId = createData.rooms[0].id;
  const eventToken = createData.event.public_access_token;
  console.log('  ✔ Created event ID:', createData.event.id);
  console.log('  ✔ Room ID (Tamil):', roomId);
  console.log('  Passed!\n');

  // STEP 2: Verify Initial Announcements is Empty
  console.log('[TEST 2] Fetching initial announcements for new room...');
  const initRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/announcements`);
  const initData = await initRes.json();
  assert.strictEqual(initRes.status, 200);
  assert.strictEqual(initData.success, true);
  assert(Array.isArray(initData.announcements), 'announcements should be an array');
  assert.strictEqual(initData.announcements.length, 0, 'initial announcements should be empty');
  console.log('  ✔ Initial count:', initData.announcements.length);
  console.log('  Passed!\n');

  // STEP 3: Translator Posts First Announcement
  console.log('[TEST 3] Translator posts first announcement...');
  const post1Res = await fetch(`${BASE_URL}/api/rooms/${roomId}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '📢 Welcome to the Tamil live translation stream!',
      senderName: 'Translator (Tamil)',
      languageCode: 'ta',
    }),
  });
  const post1Data = await post1Res.json();
  assert.strictEqual(post1Res.status, 201);
  assert.strictEqual(post1Data.success, true);
  assert.strictEqual(post1Data.announcement.message, '📢 Welcome to the Tamil live translation stream!');
  assert.strictEqual(post1Data.announcement.sender_name, 'Translator (Tamil)');
  assert.strictEqual(post1Data.announcement.language_code, 'ta');
  console.log('  ✔ Announcement 1 created ID:', post1Data.announcement.id);
  console.log('  Passed!\n');

  // STEP 4: Translator Posts Second Announcement
  console.log('[TEST 4] Translator posts second announcement...');
  const post2Res = await fetch(`${BASE_URL}/api/rooms/${roomId}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '⏸️ Short 2-minute technical break, resuming shortly.',
      senderName: 'Translator (Tamil)',
      languageCode: 'ta',
    }),
  });
  const post2Data = await post2Res.json();
  assert.strictEqual(post2Res.status, 201);
  assert.strictEqual(post2Data.success, true);
  console.log('  ✔ Announcement 2 created ID:', post2Data.announcement.id);
  console.log('  Passed!\n');

  // STEP 5: Audience Fetches Announcements List
  console.log('[TEST 5] Audience fetches room announcements...');
  const fetchRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/announcements`);
  const fetchData = await fetchRes.json();
  assert.strictEqual(fetchRes.status, 200);
  assert.strictEqual(fetchData.success, true);
  assert.strictEqual(fetchData.announcements.length, 2, 'Should contain 2 announcements');
  assert.strictEqual(fetchData.announcements[0].message, '📢 Welcome to the Tamil live translation stream!');
  assert.strictEqual(fetchData.announcements[1].message, '⏸️ Short 2-minute technical break, resuming shortly.');
  console.log('  ✔ Received announcements:', fetchData.announcements.length);
  fetchData.announcements.forEach((a, i) => {
    console.log(`    [${i + 1}] ${a.sender_name}: "${a.message}" (${a.created_at})`);
  });
  console.log('  Passed!\n');

  // STEP 6: Validate Empty Message Rejection
  console.log('[TEST 6] Validating empty announcement rejection...');
  const emptyRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '   ',
      senderName: 'Translator',
    }),
  });
  const emptyData = await emptyRes.json();
  assert.strictEqual(emptyRes.status, 400);
  assert.strictEqual(emptyData.success, false);
  console.log('  ✔ Correctly rejected empty message with status 400:', emptyData.error);
  console.log('  Passed!\n');

  console.log('====================================================');
  console.log('🎉 ALL 6 INTERACTIVE ANNOUNCEMENT TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
