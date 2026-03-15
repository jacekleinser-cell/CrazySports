async function test() {
  const eventId = '746684';
  let finalEventId = eventId;
  const mlbRes = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${eventId}/feed/live`);
  const mlbData = await mlbRes.json();
  const dateTimeStr = mlbData.gameData?.datetime?.dateTime;
  
  if (dateTimeStr) {
    const gameDate = new Date(dateTimeStr);
    // Format date as YYYYMMDD in local time of the game? No, ESPN dates are usually in EST/EDT.
    // Let's use UTC or local?
    // Actually, ESPN API `dates=YYYYMMDD` uses EST.
    // gameDate is UTC. Let's subtract 4 hours to approximate EST.
    gameDate.setHours(gameDate.getHours() - 4);
    const year = gameDate.getFullYear();
    const month = String(gameDate.getMonth() + 1).padStart(2, '0');
    const day = String(gameDate.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    const homeTeamName = mlbData.gameData?.teams?.home?.name;
    console.log('Date:', dateStr, 'Home Team:', homeTeamName);
    
    if (homeTeamName) {
      const espnRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateStr}`);
      if (espnRes.ok) {
        const espnData = await espnRes.json();
        const espnGame = espnData.events?.find(e => 
          e.competitions?.[0]?.competitors?.some(c => 
            c.homeAway === 'home' && 
            (c.team.displayName === homeTeamName || c.team.name === homeTeamName || homeTeamName.includes(c.team.name))
          )
        );
        if (espnGame) {
          finalEventId = espnGame.id;
        }
      }
    }
  }
  console.log('Final Event ID:', finalEventId);
}

test();
