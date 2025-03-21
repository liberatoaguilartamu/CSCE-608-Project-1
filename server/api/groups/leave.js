import { query } from '../db';

export default defineEventHandler(async (event) => {
  // Only allow DELETE requests
  if (getMethod(event) !== 'DELETE') {
    return createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  try {
    const body = await readBody(event);
    const { group_id, user_id } = body;

    // Basic validation
    if (!group_id || !user_id) {
      return createError({
        statusCode: 400,
        statusMessage: 'group_id and user_id are required',
      });
    }

    // Check if user is in the group
    const membershipResult = await query(
      'SELECT status FROM GroupMembership WHERE group_id = $1 AND user_id = $2',
      [group_id, user_id]
    );

    if (membershipResult.rowCount === 0 || membershipResult.rows[0].status !== 'accepted') {
      return createError({
        statusCode: 404,
        statusMessage: 'You are not a member of this group',
      });
    }

    // Check if user is the admin
    const groupResult = await query(
      'SELECT admin_id FROM UserGroup WHERE group_id = $1',
      [group_id]
    );

    if (groupResult.rows[0].admin_id == user_id) {
      return createError({
        statusCode: 403,
        statusMessage: 'Group admins cannot leave their group.',
      });
    }

    // Remove the user from the group
    await query(
      'DELETE FROM GroupMembership WHERE group_id = $1 AND user_id = $2',
      [group_id, user_id]
    );

    // Return success
    return {
      message: 'You have left the group successfully'
    };
  } catch (error) {
    console.error('Error leaving group:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while leaving the group',
    });
  }
}); 