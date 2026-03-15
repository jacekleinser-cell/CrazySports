import { Score, StandingsGroup, Standing } from './espn';

const MLB_STATS_API_BASE = 'https://statsapi.mlb.com/api/v1';

export const getMlbScores = async (date?: string): Promise<Score[]> => {
  try {
    let dateParam = '';
    if (date) {
      // Convert yyyyMMdd to YYYY-MM-DD
      const year = date.substring(0, 4);
      const month = date.substring(4, 6);
      const day = date.substring(6, 8);
      dateParam = `&date=${year}-${month}-${day}`;
    }

    const response = await fetch(`${MLB_STATS_API_BASE}/schedule?sportId=1&hydrate=team,linescore${dateParam}`);
    if (!response.ok) throw new Error("Failed to fetch MLB scores");
    const data = await response.json();

    if (!data.dates || data.dates.length === 0) return [];

    const games = data.dates[0].games;

    return games.map((game: any): Score => {
      const homeTeam = game.teams.home;
      const awayTeam = game.teams.away;
      const linescore = game.linescore || {};

      const mapTeam = (teamData: any, homeAway: string, order: number) => {
        const team = teamData.team;
        const runs = linescore.teams?.[homeAway]?.runs ?? teamData.score ?? 0;
        
        const linescores = linescore.innings?.map((inning: any) => ({
          value: inning[homeAway]?.runs ?? 0
        })) || [];

        return {
          id: team.id.toString(),
          uid: `s:1~l:10~t:${team.id}`,
          type: 'team',
          order,
          homeAway,
          score: runs.toString(),
          team: {
            id: team.id.toString(),
            uid: `s:1~l:10~t:${team.id}`,
            location: team.locationName || team.name,
            name: team.teamName || team.name,
            abbreviation: team.abbreviation || '',
            displayName: team.name,
            shortDisplayName: team.shortName || team.name,
            color: '000000', // MLB Stats API doesn't provide colors in this endpoint
            alternateColor: 'ffffff',
            logo: `https://www.mlbstatic.com/team-logos/${team.id}.svg`
          },
          records: [
            {
              name: 'overall',
              type: 'total',
              summary: teamData.leagueRecord ? `${teamData.leagueRecord.wins}-${teamData.leagueRecord.losses}` : '0-0'
            }
          ],
          linescores
        };
      };

      let gameState = 'pre';
      let completed = false;
      let shortDetail = new Date(game.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (game.status.statusCode === 'F' || game.status.statusCode === 'O') {
        gameState = 'post';
        completed = true;
        shortDetail = 'Final';
      } else if (game.status.statusCode === 'I') {
        gameState = 'in';
        shortDetail = `${linescore.inningState === 'Top' ? 'Top' : 'Bot'} ${linescore.currentInningOrdinal || linescore.currentInning}`;
      }

      return {
        id: game.gamePk.toString(),
        date: game.gameDate,
        name: `${awayTeam.team.name} at ${homeTeam.team.name}`,
        shortName: `${awayTeam.team.abbreviation} @ ${homeTeam.team.abbreviation}`,
        status: {
          type: {
            id: game.status.statusCode,
            name: game.status.detailedState,
            state: gameState,
            completed,
            description: game.status.detailedState,
            detail: shortDetail,
            shortDetail
          }
        },
        competitions: [
          {
            id: game.gamePk.toString(),
            date: game.gameDate,
            situation: linescore.balls !== undefined ? {
              balls: linescore.balls,
              strikes: linescore.strikes,
              outs: linescore.outs,
              onFirst: !!linescore.offense?.first,
              onSecond: !!linescore.offense?.second,
              onThird: !!linescore.offense?.third,
              batter: linescore.offense?.batter ? {
                id: linescore.offense.batter.id.toString(),
                fullName: linescore.offense.batter.fullName,
                playerId: linescore.offense.batter.id.toString()
              } : undefined,
              pitcher: linescore.defense?.pitcher ? {
                id: linescore.defense.pitcher.id.toString(),
                fullName: linescore.defense.pitcher.fullName,
                playerId: linescore.defense.pitcher.id.toString()
              } : undefined
            } : undefined,
            competitors: [
              mapTeam(homeTeam, 'home', 0),
              mapTeam(awayTeam, 'away', 1)
            ]
          }
        ]
      };
    });
  } catch (error) {
    console.error("Error fetching MLB scores:", error);
    return [];
  }
};

export const getMlbStandings = async (): Promise<StandingsGroup[]> => {
  try {
    const response = await fetch(`${MLB_STATS_API_BASE}/standings?leagueId=103,104`);
    if (!response.ok) throw new Error("Failed to fetch MLB standings");
    const data = await response.json();

    const groups: StandingsGroup[] = [];

    data.records.forEach((record: any) => {
      const leagueName = record.league.id === 103 ? 'American League' : 'National League';
      const divisionName = record.division?.link?.includes('201') ? 'East' :
                           record.division?.link?.includes('202') ? 'Central' :
                           record.division?.link?.includes('200') ? 'West' :
                           record.division?.link?.includes('204') ? 'East' :
                           record.division?.link?.includes('205') ? 'Central' :
                           record.division?.link?.includes('203') ? 'West' : '';
                           
      const groupName = `${leagueName} ${divisionName}`.trim();

      const entries: Standing[] = record.teamRecords.map((teamRecord: any): Standing => {
        const team = teamRecord.team;
        return {
          team: {
            id: team.id.toString(),
            uid: `s:1~l:10~t:${team.id}`,
            location: team.name,
            name: team.name,
            abbreviation: '',
            displayName: team.name,
            shortDisplayName: team.name,
            logos: [
              {
                href: `https://www.mlbstatic.com/team-logos/${team.id}.svg`,
                width: 500,
                height: 500,
                alt: team.name,
                rel: ['full', 'default'],
                lastUpdated: ''
              }
            ]
          },
          stats: [
            {
              name: 'wins',
              displayName: 'Wins',
              shortDisplayName: 'W',
              description: 'Wins',
              abbreviation: 'W',
              type: 'wins',
              value: teamRecord.leagueRecord.wins,
              displayValue: teamRecord.leagueRecord.wins.toString()
            },
            {
              name: 'losses',
              displayName: 'Losses',
              shortDisplayName: 'L',
              description: 'Losses',
              abbreviation: 'L',
              type: 'losses',
              value: teamRecord.leagueRecord.losses,
              displayValue: teamRecord.leagueRecord.losses.toString()
            },
            {
              name: 'winPercent',
              displayName: 'Win Percentage',
              shortDisplayName: 'PCT',
              description: 'Win Percentage',
              abbreviation: 'PCT',
              type: 'winpercent',
              value: parseFloat(teamRecord.leagueRecord.pct),
              displayValue: teamRecord.leagueRecord.pct
            },
            {
              name: 'gamesBehind',
              displayName: 'Games Behind',
              shortDisplayName: 'GB',
              description: 'Games Behind',
              abbreviation: 'GB',
              type: 'gamesbehind',
              value: teamRecord.gamesBack === '-' ? 0 : parseFloat(teamRecord.gamesBack),
              displayValue: teamRecord.gamesBack
            },
            {
              name: 'streak',
              displayName: 'Streak',
              shortDisplayName: 'STRK',
              description: 'Streak',
              abbreviation: 'STRK',
              type: 'streak',
              value: 0,
              displayValue: teamRecord.streak?.streakCode || '-'
            },
            {
              name: 'L10',
              displayName: 'Last 10',
              shortDisplayName: 'L10',
              description: 'Last 10',
              abbreviation: 'L10',
              type: 'L10',
              value: 0,
              displayValue: '-'
            }
          ]
        };
      });

      groups.push({
        name: groupName,
        entries
      });
    });

    return groups;
  } catch (error) {
    console.error("Error fetching MLB standings:", error);
    return [];
  }
};
