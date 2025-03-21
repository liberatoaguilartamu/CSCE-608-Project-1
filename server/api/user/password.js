import { query } from '../db';

export default defineEventHandler(async (event) => {
  // Only allow PUT requests
  if (getMethod(event) !== 'PUT') {
    return createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  try {
    const body = await readBody(event);
    const { user_id, current_password, new_password } = body;

    // Basic validation
    if (!user_id || !current_password || !new_password) {
      return createError({
        statusCode: 400,
        statusMessage: 'user_id, current_password, and new_password are required',
      });
    }

    // Check if the current password is correct
    const passwordCheckResult = await query(
      'SELECT user_id FROM AppUser WHERE user_id = $1 AND password = $2',
      [user_id, current_password]
    );

    if (passwordCheckResult.rowCount === 0) {
      return createError({
        statusCode: 401,
        statusMessage: 'Current password is incorrect',
      });
    }

    // Update the password
    await query(
      'UPDATE AppUser SET password = $1 WHERE user_id = $2',
      [new_password, user_id]
    );

    // Return success
    return {
      message: 'Password updated successfully'
    };
  } catch (error) {
    console.error('Error updating password:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while updating the password',
    });
  }
}); 