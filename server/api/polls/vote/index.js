import { query } from '../../db';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // POST request to submit a vote
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      const { user_id, poll_id, bar_id } = body;

      // Basic validation
      if (!user_id || !poll_id || !bar_id) {
        return createError({
          statusCode: 400,
          statusMessage: 'user_id, poll_id, and bar_id are required',
        });
      }

      // Check if the poll exists and is for today
      const pollCheckResult = await query(
        'SELECT poll_id, city_id FROM Poll WHERE poll_id = $1 AND poll_date = CURRENT_DATE',
        [poll_id]
      );

      if (pollCheckResult.rowCount === 0) {
        return createError({
          statusCode: 404,
          statusMessage: 'Poll not found or not active today',
        });
      }

      const city_id = pollCheckResult.rows[0].city_id;

      // Check if the user has already voted in any poll today
      const globalVoteCheck = await query(
        `SELECT COUNT(*) as vote_count 
        FROM Vote v
        -- For vote info
        JOIN Poll p ON v.poll_id = p.poll_id
        WHERE v.user_id = $1 
        AND p.poll_date = CURRENT_DATE`,
        [user_id]
      );

      if (parseInt(globalVoteCheck.rows[0].vote_count) > 0) {
        return createError({
          statusCode: 409,
          statusMessage: 'You have already voted today',
        });
      }

      // Check if the bar exists and belongs to the same city as the poll
      const barCheckResult = await query(
        'SELECT bar_id FROM Bar WHERE bar_id = $1 AND city_id = $2',
        [bar_id, city_id]
      );

      if (barCheckResult.rowCount === 0) {
        return createError({
          statusCode: 404,
          statusMessage: 'Bar not found or not in the same city as the poll',
        });
      }

      // Insert the vote
      const insertResult = await query(
        'INSERT INTO Vote (user_id, poll_id, bar_id, time_voted) VALUES ($1, $2, $3, NOW()) RETURNING vote_id',
        [user_id, poll_id, bar_id]
      );

      // Return success
      return {
        vote_id: insertResult.rows[0].vote_id,
        message: 'Vote recorded successfully',
      };
    } catch (error) {
      console.error('Error recording vote:', error);
      return createError({
        statusCode: 500,
        statusMessage: 'An error occurred while recording your vote',
      });
    }
  }

  // Return method not allowed for other HTTP methods
  return createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
}); 