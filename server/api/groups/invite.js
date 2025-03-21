import { query } from '../db';

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (getMethod(event) !== 'POST') {
    return createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  try {
    const body = await readBody(event);
    const { group_id, phone_number, inviter_id } = body;

    // Basic validation
    if (!group_id || !phone_number || !inviter_id) {
      return createError({
        statusCode: 400,
        statusMessage: 'group_id, phone_number, and inviter_id are required',
      });
    }

    // Check if group exists
    const groupCheckResult = await query(
      'SELECT group_id, admin_id FROM UserGroup WHERE group_id = $1',
      [group_id]
    );

    if (groupCheckResult.rowCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'Group not found',
      });
    }

    // Check if inviter is a member of the group
    const memberCheckResult = await query(
      'SELECT user_id FROM GroupMembership WHERE group_id = $1 AND user_id = $2 AND status = $3',
      [group_id, inviter_id, 'accepted']
    );

    if (memberCheckResult.rowCount === 0) {
      return createError({
        statusCode: 403,
        statusMessage: 'You must be a member of the group to invite others',
      });
    }

    // Find the user by phone number
    const userResult = await query(
      'SELECT user_id FROM AppUser WHERE phone_number = $1',
      [phone_number]
    );

    if (userResult.rowCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'No user found with this phone number',
      });
    }

    const invitee_id = userResult.rows[0].user_id;

    // Check if user is already a member
    const existingMembershipResult = await query(
      'SELECT status FROM GroupMembership WHERE group_id = $1 AND user_id = $2',
      [group_id, invitee_id]
    );

    if (existingMembershipResult.rowCount > 0) {
      const status = existingMembershipResult.rows[0].status;
      if (status === 'accepted') {
        return createError({
          statusCode: 409,
          statusMessage: 'User is already a member of this group',
        });
      } else if (status === 'pending') {
        return createError({
          statusCode: 409,
          statusMessage: 'User has already been invited to this group',
        });
      } else if (status === 'denied') {
        // Re-invite the user
        await query(
          'UPDATE GroupMembership SET status = $1 WHERE group_id = $2 AND user_id = $3',
          ['pending', group_id, invitee_id]
        );
      }
    } else {
      // Create new invitation
      await query(
        'INSERT INTO GroupMembership (group_id, user_id, status) VALUES ($1, $2, $3)',
        [group_id, invitee_id, 'pending']
      );
    }

    // Return success
    return {
      message: 'Invitation sent successfully'
    };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while sending the invitation',
    });
  }
}); 