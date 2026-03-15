async function test() {
  const eventId = '401570067'; // ESPN event ID
  const mlbRes = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${eventId}/feed/live`);
  const data = await mlbRes.json();
  console.log(Object.keys(data));
}

test();
