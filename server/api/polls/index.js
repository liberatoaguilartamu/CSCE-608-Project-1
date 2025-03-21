import { query } from '../db';

export default defineEventHandler(async (event) => {
  // Only allow GET requests
  if (getMethod(event) !== 'GET') {
    return createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  // Get query parameters
  const { city_id, poll_type, group_id } = getQuery(event);

  // Basic validation
  if (!city_id) {
    return createError({
      statusCode: 400,
      statusMessage: 'city_id is required',
    });
  }

  if (!poll_type || !['city', 'group'].includes(poll_type)) {
    return createError({
      statusCode: 400,
      statusMessage: 'poll_type must be either "city" or "group"',
    });
  }

  if (poll_type === 'group' && !group_id) {
    return createError({
      statusCode: 400,
      statusMessage: 'group_id is required for group polls',
    });
  }

  try {
    // Find the poll for today
    let pollQuery = `
      SELECT poll_id, city_id
      FROM Poll
      WHERE poll_date = CURRENT_DATE AND city_id = $1
    `;
    
    const pollParams = [city_id];
    
    if (poll_type === 'city') {
      // City poll, make sure group_id is null
      pollQuery += ' AND poll_type = $2 AND group_id IS NULL';
      pollParams.push('city');
    } else {
      // Group poll, make sure group_id is not null
      pollQuery += ' AND poll_type = $2 AND group_id = $3';
      pollParams.push('group', group_id);
    }
    
    const pollResult = await query(pollQuery, pollParams);
    
    if (pollResult.rowCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'No poll found for today',
      });
    }
    
    const poll = pollResult.rows[0];

    // Get all bars for the city with their votes
    // For each bar, count votes from any poll in this city today
    const barsQuery = `
      WITH CityVotes AS (
        -- All votes cast in this city today
        SELECT v.bar_id, v.user_id
        FROM Vote v
        -- For poll info
        JOIN Poll p ON v.poll_id = p.poll_id
        WHERE p.poll_date = CURRENT_DATE
        AND p.city_id = $1
        -- Count each user's vote only once per city
        GROUP BY v.bar_id, v.user_id
      )
      SELECT 
        b.bar_id, 
        b.bar_name,
        -- Aggregate votes
        COUNT(cv.user_id) as vote_count
      FROM Bar b
      -- For bar info
      LEFT JOIN CityVotes cv ON b.bar_id = cv.bar_id
      WHERE b.city_id = $1
      GROUP BY b.bar_id, b.bar_name
      ORDER BY vote_count DESC, b.bar_name
    `;
    
    const barsResult = await query(barsQuery, [city_id]);
    
    // Calculate percentages
    const bars = barsResult.rows;
    const totalVotes = bars.reduce((sum, bar) => sum + parseInt(bar.vote_count), 0);
    
    // For each bar, get the non-anonymous voters
    const barsWithDetails = await Promise.all(bars.map(async (bar) => {
      const votePercentage = totalVotes > 0 
        ? Math.round((parseInt(bar.vote_count) / totalVotes) * 100) 
        : 0;
      
      // Get non-anonymous voters for this bar
      const votersQuery = `
        SELECT DISTINCT au.name, au.user_id
        FROM AppUser au
        -- For user info
        JOIN Vote v ON au.user_id = v.user_id
        -- For poll info
        JOIN Poll p ON v.poll_id = p.poll_id
        WHERE v.bar_id = $1
        AND p.city_id = $2
        AND p.poll_date = CURRENT_DATE
        -- Non-anonymous users only
        AND au.anonymous_flag = FALSE
        ORDER BY au.name
      `;
      
      const votersResult = await query(votersQuery, [bar.bar_id, city_id]);
      
      return {
        id: bar.bar_id,
        name: bar.bar_name,
        votes: parseInt(bar.vote_count),
        votePercentage,
        voters: votersResult.rows.map(voter => ({
          id: voter.user_id,
          name: voter.name
        }))
      };
    }));
    
    // Return the results
    return {
      poll_id: poll.poll_id,
      bars: barsWithDetails,
      total_votes: totalVotes
    };
  } catch (error) {
    console.error('Error fetching poll results:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching poll results',
    });
  }
}); 