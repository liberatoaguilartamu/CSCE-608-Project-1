import { query } from '../db';

export default defineEventHandler(async (event) => {
  // Only allow GET requests
  if (getMethod(event) !== 'GET') {
    return createError({
      statusCode: 405,
      statusMessage: 'Method not allowed',
    });
  }

  // Get query parameters
  const { user_id, city_id } = getQuery(event);

  // Validate user_id
  if (!user_id) {
    return createError({
      statusCode: 400,
      statusMessage: 'user_id is required',
    });
  }

  try {
    // Build query to get user's groups with additional flag for admin status
    let groupsQuery = `
      SELECT g.group_id, g.group_name, g.city_id, c.city_name,
             CASE WHEN g.admin_id = $1 THEN true ELSE false END as is_admin
      FROM UserGroup g
      -- For group info
      JOIN GroupMembership gm ON g.group_id = gm.group_id
      -- For city name
      JOIN City c ON g.city_id = c.city_id
      WHERE gm.user_id = $1 AND gm.status = 'accepted'
    `;
    
    const params = [user_id];
    
    // Add city filter if given
    if (city_id) {
      groupsQuery += ' AND g.city_id = $2';
      params.push(city_id);
    }
    
    // Order by group name (must go after city filter if given)
    groupsQuery += ' ORDER BY g.group_name';

    const groupsResult = await query(groupsQuery, params);

    // Format the response
    return {
      groups: groupsResult.rows.map(group => ({
        id: group.group_id,
        name: group.group_name,
        city_id: group.city_id,
        city_name: group.city_name,
        is_admin: group.is_admin
      }))
    };
  } catch (error) {
    console.error('Error getting user groups:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while getting user groups',
    });
  }
}); 