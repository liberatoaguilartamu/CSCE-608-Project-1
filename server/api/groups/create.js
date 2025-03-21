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
    const { name, city_id, admin_id } = body;

    // Basic validation
    if (!name || !city_id || !admin_id) {
      return createError({
        statusCode: 400,
        statusMessage: 'name, city_id, and admin_id are required',
      });
    }

    // Check if user exists
    const userCheckResult = await query(
      'SELECT user_id FROM AppUser WHERE user_id = $1',
      [admin_id]
    );

    if (userCheckResult.rowCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    // Check if city exists
    const cityCheckResult = await query(
      'SELECT city_id FROM City WHERE city_id = $1',
      [city_id]
    );

    if (cityCheckResult.rowCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'City not found',
      });
    }

    // Check if group with same name exists in the city
    const groupCheckResult = await query(
      'SELECT group_id FROM UserGroup WHERE group_name = $1 AND city_id = $2',
      [name, city_id]
    );

    if (groupCheckResult.rowCount > 0) {
      return createError({
        statusCode: 409,
        statusMessage: 'A group with this name already exists in this city',
      });
    }

    // Create the group, add the admin as a member, and create a poll for today in a transaction
    // Do all in separate queries, but one transaction so if any fail, all are rolled back
    await query('BEGIN');

    try {
      // Create group
      const insertGroupResult = await query(
        'INSERT INTO UserGroup (group_name, admin_id, city_id) VALUES ($1, $2, $3) RETURNING group_id, group_name',
        [name, admin_id, city_id]
      );

      const group = insertGroupResult.rows[0];

      // Add admin as a member (auto accepted status)
      await query(
        'INSERT INTO GroupMembership (group_id, user_id, status) VALUES ($1, $2, $3)',
        [group.group_id, admin_id, 'accepted']
      );
      
      // Create a poll for today (so voting shows up)
      await query(
        'INSERT INTO Poll (poll_date, poll_type, city_id, group_id) VALUES (CURRENT_DATE, $1, $2, $3)',
        ['group', city_id, group.group_id]
      );

      // End transaction
      await query('COMMIT');

      // Return success with the created group
      return {
        group: {
          id: group.group_id,
          name: group.group_name,
          city_id: city_id,
          is_admin: true
        },
        message: 'Group created successfully with a poll for today'
      };
    } catch (error) {
      // If any queries fail, rollback
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating group:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while creating the group',
    });
  }
}); 