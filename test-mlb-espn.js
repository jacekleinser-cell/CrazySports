const fetch = require('node-fetch');

async function test() {
  const eventId = '746684';
  const mlbRes = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${eventId}/feed/live`);
  const mlbData = await mlbRes.json();
  const gameDate = new Date(mlbData.gameData.datetime.dateTime);
  const dateStr = gameDate.toISOString().split('T')[0].replace(/-/g, '');
  const homeTeamName = mlbData.gameData.teams.home.name;
  console.log('MLB Date:', dateStr, 'Home Team:', homeTeamName);

  const espnRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`);
  const espnData = await espnRes.json();
  const espnGame = espnData.events?.find(e => 
    e.competitions[0].competitors.some(c => c.homeAway === 'home' && (c.team.displayName === homeTeamName || c.team.name === homeTeamName || homeTeamName.includes(c.team.name)))
  );
  console.log('ESPN Game ID:', espnGame?.id);
}

test();
