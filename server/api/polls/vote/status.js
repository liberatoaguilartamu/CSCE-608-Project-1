import { query } from '../../db';

export default defineEventHandler(async (event) => {
  // Only allow GET requests
  if (getMethod(event) !== 'GET') {
    return createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  const { user_id } = getQuery(event);

  // Validate parameters
  if (!user_id) {
    return createError({
      statusCode: 400,
      statusMessage: 'user_id is required',
    });
  }

  try {
    // Check if the user has voted in any poll today
    const result = await query(
      `SELECT COUNT(*) as vote_count 
      FROM Vote v
      -- For vote info
      JOIN Poll p ON v.poll_id = p.poll_id
      WHERE v.user_id = $1 AND p.poll_date = CURRENT_DATE`,
      [user_id]
    );

    // Return whether the user has voted
    return {
      hasVoted: result.rows[0].vote_count > 0,
    };
  } catch (error) {
    console.error('Error checking global vote status:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Error checking vote status',
    });
  }
}); 