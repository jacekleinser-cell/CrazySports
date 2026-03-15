
import { getMlbScores, getMlbStandings } from './mlbStats';

const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports";
const CORE_URL = "https://site.web.api.espn.com/apis/common/v3/search";

export interface Score {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };
  competitions: {
    id: string;
    date: string;
    situation?: {
      balls: number;
      strikes: number;
      outs: number;
      onFirst: boolean;
      onSecond: boolean;
      onThird: boolean;
      batter?: {
        id: string;
        fullName: string;
        playerId: string;
      };
      pitcher?: {
        id: string;
        fullName: string;
        playerId: string;
      };
    };
    competitors: {
      id: string;
      uid: string;
      type: string;
      order: number;
      homeAway: string;
      score: string;
      team: {
        id: string;
        uid: string;
        location: string;
        name: string;
        abbreviation: string;
        displayName: string;
        shortDisplayName: string;
        color: string;
        alternateColor: string;
        logo: string;
      };
      records?: {
        name: string;
        abbreviation?: string;
        type: string;
        summary: string;
      }[];
      linescores?: {
        value: number;
      }[];
    }[];
  }[];
}

export interface NewsArticle {
  headline: string;
  description: string;
  images: {
    url: string;
    width: number;
    height: number;
    alt?: string;
    caption?: string;
  }[];
  links: {
    web: {
      href: string;
    };
  };
  published: string;
  byline?: string;
}

export interface Standing {
  team: {
    id: string;
    uid: string;
    location: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    logos: {
      href: string;
      width: number;
      height: number;
      alt: string;
      rel: string[];
      lastUpdated: string;
    }[];
  };
  stats: {
    name: string;
    displayName: string;
    shortDisplayName: string;
    description: string;
    abbreviation: string;
    type: string;
    value: number;
    displayValue: string;
  }[];
}

export const getScores = async (sport: string, league: string, date?: string): Promise<Score[]> => {
  if (league === 'mlb') {
    return getMlbScores(date);
  }
  try {
    const dateParam = date ? `?dates=${date}` : '';
    const response = await fetch(`${BASE_URL}/${sport}/${league}/scoreboard${dateParam}`);
    if (!response.ok) throw new Error("Failed to fetch scores");
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("Error fetching scores:", error);
    return [];
  }
};

export const getNews = async (sport: string, league: string): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(`${BASE_URL}/${sport}/${league}/news`);
    if (!response.ok) throw new Error("Failed to fetch news");
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

export interface StandingsGroup {
  name: string;
  entries: Standing[];
}

export const getStandings = async (sport: string, league: string): Promise<StandingsGroup[]> => {
  if (league === 'mlb') {
    return getMlbStandings();
  }
  try {
    const response = await fetch(`https://site.api.espn.com/apis/v2/sports/${sport}/${league}/standings`); 
    if (!response.ok) throw new Error("Failed to fetch standings");
    const data = await response.json();
    
    const groups: StandingsGroup[] = [];
    
    const processNode = (node: any, parentName?: string) => {
      // If this node has standings entries, it's a leaf group (like a Division)
      if (node.standings && node.standings.entries && node.standings.entries.length > 0) {
        groups.push({
          name: node.name || parentName || "Standings",
          entries: node.standings.entries
        });
      }
      
      // If it has children, traverse them
      if (node.children) {
        node.children.forEach((child: any) => processNode(child, node.name));
      }
    };
    
    if (data.children) {
      data.children.forEach((child: any) => processNode(child));
    } else if (data.standings && data.standings.entries) {
      // Handle case where there are no children (e.g. some small leagues)
      groups.push({
        name: "Standings",
        entries: data.standings.entries
      });
    }
    
    return groups;
  } catch (error) {
    console.error("Error fetching standings:", error);
    return [];
  }
};

export const getGameSummary = async (sport: string, league: string, eventId: string) => {
  try {
    let finalEventId = eventId;
    
    // If it's MLB and eventId looks like an MLB Stats API gamePk (usually 6-7 digits)
    if (league === 'mlb' && eventId.length < 8) {
      try {
        const mlbRes = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${eventId}/feed/live`);
        if (mlbRes.ok) {
          const mlbData = await mlbRes.json();
          const dateTimeStr = mlbData.gameData?.datetime?.dateTime;
          
          if (dateTimeStr) {
            const gameDate = new Date(dateTimeStr);
            // Approximate EST by subtracting 4 hours from UTC
            gameDate.setHours(gameDate.getHours() - 4);
            const year = gameDate.getFullYear();
            const month = String(gameDate.getMonth() + 1).padStart(2, '0');
            const day = String(gameDate.getDate()).padStart(2, '0');
            const dateStr = `${year}${month}${day}`;
            
            const homeTeamName = mlbData.gameData?.teams?.home?.name;
            
            if (homeTeamName) {
              const espnRes = await fetch(`${BASE_URL}/${sport}/${league}/scoreboard?dates=${dateStr}`);
              if (espnRes.ok) {
                const espnData = await espnRes.json();
                const espnGame = espnData.events?.find((e: any) => 
                  e.competitions?.[0]?.competitors?.some((c: any) => 
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
        }
      } catch (err) {
        console.warn("Failed to map MLB gamePk to ESPN eventId:", err);
      }
    }

    const response = await fetch(`${BASE_URL}/${sport}/${league}/summary?event=${finalEventId}`);
    if (!response.ok) throw new Error("Failed to fetch game summary");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching game summary:", error);
    return null;
  }
};

export const search = async (query: string, type?: 'player' | 'team') => {
  try {
    let url = `${CORE_URL}?limit=10&q=${encodeURIComponent(query)}`;
    if (type) {
      url += `&type=${type}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to search");
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error searching:", error);
    return [];
  }
};

export const getLeaders = async (sport: string, league: string, type: 'offense' | 'defense' = 'offense', seasonType: number = 2): Promise<any[]> => {
  try {
    // Preseason/Spring Training (seasonType=1) is notoriously unreliable on this endpoint for some leagues.
    // We'll try to fetch, but if it fails with 500, we'll just return empty array gracefully.
    const response = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/${sport}/${league}/statistics/byathlete?limit=50&active=true&seasontype=${seasonType}`);
    
    if (!response.ok) {
        // If it's a 500 error and we asked for preseason, it's likely just not available.
        if (response.status >= 500 && seasonType === 1) {
            console.warn(`Preseason stats not available for ${league} (API returned ${response.status})`);
            return [];
        }
        throw new Error(`Failed to fetch leaders: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const rootCategories = data.categories || [];
    const athletes = data.athletes || [];
    
    let categoryName = 'offensive';
    let targetStatName = '';
    let statLabel = 'Stats';

    if (league === 'nba') {
       if (type === 'defense') {
         categoryName = 'defensive';
         targetStatName = 'avgSteals';
         statLabel = 'Steals Per Game';
       } else {
         categoryName = 'offensive';
         targetStatName = 'avgPoints';
         statLabel = 'Points Per Game';
       }
    } else if (league === 'nfl') {
       if (type === 'defense') {
         categoryName = 'defensive';
         targetStatName = 'sacks';
         statLabel = 'Sacks';
       } else {
         categoryName = 'passing'; // Default to passing for offense
         targetStatName = 'passingYards';
         statLabel = 'Passing Yards';
       }
    } else if (league === 'mlb') {
       if (type === 'defense') {
         categoryName = 'pitching';
         targetStatName = 'strikeouts';
         statLabel = 'Strikeouts';
       } else {
         categoryName = 'offensive';
         targetStatName = 'avg';
         statLabel = 'Batting Average';
       }
    } else if (league === 'nhl') {
       if (type === 'defense') {
          // The 'defensive' category in this API is for Goalies (Saves, GAA, etc.)
          categoryName = 'defensive';
          targetStatName = 'saves';
          statLabel = 'Saves';
       } else {
          categoryName = 'offensive';
          targetStatName = 'points';
          statLabel = 'Points Per Game';
       }
    }

    // Find the index of the target stat
    let statIndex = 0;
    const targetCategory = rootCategories.find((c: any) => c.name === categoryName);
    
    if (targetCategory && targetCategory.names) {
      const idx = targetCategory.names.indexOf(targetStatName);
      if (idx !== -1) {
        statIndex = idx;
        // Use the API's display name if available, otherwise fallback to our default
        if (targetCategory.displayNames && targetCategory.displayNames[idx] && league !== 'nhl') {
           statLabel = targetCategory.displayNames[idx];
        }
      } else {
        // Fallback: if specific stat not found, use the first one
        statLabel = targetCategory.displayNames?.[0] || statLabel;
      }
    }

    // Special handling for NHL PPG calculation
    let gamesIndex = -1;
    if (league === 'nhl' && type === 'offense') {
        const generalCat = rootCategories.find((c: any) => c.name === 'general');
        if (generalCat && generalCat.names) {
            gamesIndex = generalCat.names.indexOf('games');
        }
    }

    const leaders = athletes.map((entry: any) => {
      if (!entry || !entry.athlete) return null;
      
      const category = entry.categories?.find((c: any) => c.name === categoryName);
      if (!category) return null;

      let value = category.values?.[statIndex] || 0;
      let displayValue = category.totals?.[statIndex] || '0';
      
      // Filter out 0 values if we are looking for specific stats to avoid clutter
      if (value === 0 && (targetStatName === 'points' || targetStatName === 'saves')) return null;

      // Calculate PPG for NHL Offense
      if (league === 'nhl' && type === 'offense' && gamesIndex !== -1) {
          const generalCategory = entry.categories?.find((c: any) => c.name === 'general');
          const games = generalCategory?.values?.[gamesIndex] || 0;
          
          if (games > 0) {
              value = value / games;
              displayValue = value.toFixed(1);
          } else {
              value = 0;
              displayValue = '0.0';
          }
      }

      return {
        athlete: entry.athlete,
        team: entry.athlete.teamName || entry.athlete.teams?.[0]?.name || 'Unknown Team',
        value,
        displayValue,
        statLabel,
        rank: 0
      };
    }).filter((l: any) => l !== null);

    // Sort by value descending
    leaders.sort((a: any, b: any) => b.value - a.value);

    // Assign rank
    leaders.forEach((l: any, i: number) => l.rank = i + 1);

    return leaders.slice(0, 50);
  } catch (error) {
    console.error("Error fetching leaders:", error);
    return [];
  }
};
