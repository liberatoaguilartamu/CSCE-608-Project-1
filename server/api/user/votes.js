import { query } from '../db';

export default defineEventHandler(async (event) => {
  try {
    const { user_id, limit } = getQuery(event);
    const votesLimit = limit ? parseInt(limit) : 10; // Default to 10 votes

    // Validate required parameters
    if (!user_id) {
      return createError({
        statusCode: 400,
        statusMessage: 'user_id is required',
      });
    }

    // Get vote history
    const votesQuery = `
      SELECT 
        v.vote_id as id,
        v.time_voted,
        b.bar_name,
        p.poll_type,
        p.poll_date as date,
        c.city_name,
        ug.group_name,
        ug.group_id
      FROM 
        Vote v
      JOIN 
        -- For poll info
        Poll p ON v.poll_id = p.poll_id
      JOIN 
        -- For bar info
        Bar b ON v.bar_id = b.bar_id
      JOIN 
        -- For city name
        City c ON p.city_id = c.city_id
      LEFT JOIN 
        -- For group info
        UserGroup ug ON p.group_id = ug.group_id
      WHERE 
        v.user_id = $1
      ORDER BY 
        v.time_voted DESC
      LIMIT $2
    `;

    const votesResult = await query(votesQuery, [user_id, votesLimit]);

    // Return the vote history
    return {
      votes: votesResult.rows
    };
  } catch (error) {
    console.error('Error fetching vote history:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching vote history',
    });
  }
}); 