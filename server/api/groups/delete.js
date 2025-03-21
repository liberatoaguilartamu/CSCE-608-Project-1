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

    // Check if the group exists and the user is the admin
    const groupResult = await query(
      'SELECT admin_id, group_name FROM UserGroup WHERE group_id = $1',
      [group_id]
    );

    if (groupResult.rowCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'Group not found',
      });
    }

    if (groupResult.rows[0].admin_id != user_id) {
      return createError({
        statusCode: 403,
        statusMessage: 'Only the group admin can delete the group',
      });
    }

    // Delete all related data and then the group itself
    // Do all in separate queries, but one transaction so if any fail, all are rolled back
    await query('BEGIN');

    try {
      // First find all polls associated with this group
      const pollsResult = await query(
        'SELECT poll_id FROM Poll WHERE group_id = $1',
        [group_id]
      );
      
      // Delete votes associated with these polls
      if (pollsResult.rowCount > 0) {
        // Get all poll ids
        const pollIds = pollsResult.rows.map(row => row.poll_id);
        await query(
          'DELETE FROM Vote WHERE poll_id = ANY($1)',
          [pollIds]
        );
        
        // Delete the polls
        await query(
          'DELETE FROM Poll WHERE group_id = $1',
          [group_id]
        );
      }

      // Delete all group memberships
      await query(
        'DELETE FROM GroupMembership WHERE group_id = $1',
        [group_id]
      );

      // Delete the group
      await query(
        'DELETE FROM UserGroup WHERE group_id = $1',
        [group_id]
      );

      // End transaction
      await query('COMMIT');

      // Return success with the name of the deleted group
      return {
        message: `Group "${groupResult.rows[0].group_name}" has been deleted successfully`
      };
    } catch (error) {
      // If any queries fail, rollback
      await query('ROLLBACK');
      console.error('Transaction error during group deletion:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while deleting the group',
    });
  }
}); 