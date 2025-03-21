import { query } from '../db';

export default defineEventHandler(async (event) => {
  try {
    const { user_id, group_id } = getQuery(event);

    // If group_id is provided, get members of that group
    if (group_id) {
      // Check if the user is a member of the group
      const memberCheckResult = await query(
        'SELECT user_id FROM GroupMembership WHERE group_id = $1 AND user_id = $2 AND status = $3',
        [group_id, user_id, 'accepted']
      );

      if (memberCheckResult.rowCount === 0) {
        return createError({
          statusCode: 403,
          statusMessage: 'You must be a member of the group to view its members',
        });
      }

      // Get group information
      const groupResult = await query(
        `SELECT 
          ug.group_id as id, 
          ug.group_name as name, 
          ug.city_id, 
          ug.admin_id,
          c.city_name
        FROM 
          UserGroup ug
        JOIN
          -- For city name
          City c ON ug.city_id = c.city_id
        WHERE 
          ug.group_id = $1`,
        [group_id]
      );

      if (groupResult.rowCount === 0) {
        return createError({
          statusCode: 404,
          statusMessage: 'Group not found',
        });
      }

      // Get members of the group
      const membersResult = await query(
        `SELECT 
          u.user_id as id, 
          u.name, 
          u.phone_number,
          -- Check if user is admin of the group
          CASE WHEN ug.admin_id = u.user_id THEN true ELSE false END as is_admin
        FROM 
          GroupMembership gm
        JOIN 
          -- For user info
          AppUser u ON gm.user_id = u.user_id
        JOIN 
          -- For group info
          UserGroup ug ON gm.group_id = ug.group_id
        WHERE 
          gm.group_id = $1 AND gm.status = 'accepted'
        ORDER BY 
          u.name`,
        [group_id]
      );

      // Return group with members
      return {
        group: {
          ...groupResult.rows[0],
          is_admin: groupResult.rows[0].admin_id == user_id,
          members: membersResult.rows
        }
      };
    }

    // If no group_id, get user's groups and invitations
    if (!user_id) {
      return createError({
        statusCode: 400,
        statusMessage: 'user_id is required',
      });
    }

    // Get groups where user is a member
    const groupsResult = await query(
      `SELECT 
        ug.group_id as id, 
        ug.group_name as name, 
        ug.city_id, 
        c.city_name,
        CASE WHEN ug.admin_id = $1 THEN true ELSE false END as is_admin
      FROM 
        UserGroup ug
      JOIN 
        -- For group info
        GroupMembership gm ON ug.group_id = gm.group_id
      JOIN
        -- For city name
        City c ON ug.city_id = c.city_id
      WHERE 
        gm.user_id = $1 AND gm.status = 'accepted'
      ORDER BY 
        ug.group_name`,
      [user_id]
    );

    // Get pending invitations
    const invitationsResult = await query(
      `SELECT 
        gm.group_id, 
        ug.group_name,
        c.city_name,
        admin.name as admin_name,
        admin.user_id as admin_id
      FROM 
        GroupMembership gm
      JOIN 
        -- For group info
        UserGroup ug ON gm.group_id = ug.group_id
      JOIN 
        -- For admin info
        AppUser admin ON ug.admin_id = admin.user_id
      JOIN
        -- For city name
        City c ON ug.city_id = c.city_id
      WHERE 
        gm.user_id = $1 AND gm.status = 'pending'
      ORDER BY 
        ug.group_name`,
      [user_id]
    );

    // Return the data
    return {
      groups: groupsResult.rows,
      invitations: invitationsResult.rows.map(inv => ({
        id: inv.group_id,
        group_name: inv.group_name,
        city_name: inv.city_name,
        from_name: inv.admin_name,
        from_id: inv.admin_id
      }))
    };
  } catch (error) {
    console.error('Error fetching groups data:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching groups data',
    });
  }
}); 