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
    const { group_id, user_id, status } = body;

    // Basic validation
    if (!group_id || !user_id || !status) {
      return createError({
        statusCode: 400,
        statusMessage: 'group_id, user_id, and status are required',
      });
    }

    // Validate status
    if (status !== 'accepted' && status !== 'denied') {
      return createError({
        statusCode: 400,
        statusMessage: 'Status must be "accepted" or "denied"',
      });
    }

    // Check if invitation exists and is pending
    const invitationResult = await query(
      'SELECT status FROM GroupMembership WHERE group_id = $1 AND user_id = $2',
      [group_id, user_id]
    );

    if (invitationResult.rowCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'Invitation not found',
      });
    }

    if (invitationResult.rows[0].status !== 'pending') {
      return createError({
        statusCode: 409,
        statusMessage: 'This invitation has already been responded to',
      });
    }

    // Update the invitation status
    await query(
      'UPDATE GroupMembership SET status = $1 WHERE group_id = $2 AND user_id = $3',
      [status, group_id, user_id]
    );

    // If accepted, get group details to return
    let group = null;
    if (status === 'accepted') {
      const groupResult = await query(
        `SELECT 
          ug.group_id as id, 
          ug.group_name as name, 
          ug.city_id, 
          c.city_name,
          CASE WHEN ug.admin_id = $1 THEN true ELSE false END as is_admin
        FROM 
          UserGroup ug
        JOIN
          -- For city name
          City c ON ug.city_id = c.city_id
        WHERE 
          ug.group_id = $2`,
        [user_id, group_id]
      );

      if (groupResult.rowCount > 0) {
        group = groupResult.rows[0];
      }
    }

    // Return success with the group if accepted
    return {
      status: status,
      message: status === 'accepted' ? 'You have joined the group' : 'Invitation declined',
      group: group
    };
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while responding to the invitation',
    });
  }
}); 