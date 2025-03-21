import { query } from '../db';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // GET request to fetch user profile
  if (method === 'GET') {
    try {
      const { user_id } = getQuery(event);

      // Validate required parameters
      if (!user_id) {
        return createError({
          statusCode: 400,
          statusMessage: 'Missing required parameter: user_id',
        });
      }

      // Query to get user profile with anonymous status changeability
      const result = await query(`
        SELECT 
          u.user_id, 
          u.name, 
          u.phone_number, 
          u.city_id, 
          c.city_name,
          u.anonymous_flag,
          u.last_anonymous_change,
          -- Check if last change was more than 7 days ago
          CASE 
            WHEN u.last_anonymous_change + INTERVAL '7 days' <= CURRENT_TIMESTAMP THEN true
            ELSE false
          END as can_change_anonymous
        FROM 
          AppUser u
        JOIN 
          -- For city name
          City c ON u.city_id = c.city_id
        WHERE 
          u.user_id = $1
      `, [user_id]);

      if (result.rowCount === 0) {
        return createError({
          statusCode: 404,
          statusMessage: 'User not found',
        });
      }

      // Calculate when user can change anonymous flag again
      let nextChangeDate = null;
      let hoursRemaining = null;
      
      if (!result.rows[0].can_change_anonymous) {
        const lastChangeDate = new Date(result.rows[0].last_anonymous_change);
        nextChangeDate = new Date(lastChangeDate);
        nextChangeDate.setDate(nextChangeDate.getDate() + 7);
        
        const now = new Date();
        const diffMs = nextChangeDate - now;
        hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
      }

      // Return user profile data
      return {
        user: {
          id: result.rows[0].user_id,
          name: result.rows[0].name,
          phone_number: result.rows[0].phone_number,
          city_id: result.rows[0].city_id,
          city_name: result.rows[0].city_name,
          anonymous: result.rows[0].anonymous_flag,
          can_change_anonymous: result.rows[0].can_change_anonymous,
          next_change_date: nextChangeDate,
          hours_remaining: hoursRemaining
        }
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return createError({
        statusCode: 500,
        statusMessage: 'An error occurred while fetching user profile',
      });
    }
  }

  // PUT request to update user profile
  if (method === 'PUT') {
    try {
      const body = await readBody(event);
      const { user_id, name, city_id, anonymous } = body;

      // Validate required parameters
      if (!user_id) {
        return createError({
          statusCode: 400,
          statusMessage: 'Missing required parameter: user_id',
        });
      }

      // Get the current user data
      const currentUserData = await query(`
        SELECT 
          anonymous_flag,
          last_anonymous_change,
          -- Check if last change was more than 7 days ago
          CASE 
            WHEN last_anonymous_change + INTERVAL '7 days' <= CURRENT_TIMESTAMP THEN true
            ELSE false
          END as can_change_anonymous
        FROM 
          AppUser
        WHERE 
          user_id = $1
      `, [user_id]);

      if (currentUserData.rowCount === 0) {
        return createError({
          statusCode: 404,
          statusMessage: 'User not found',
        });
      }

      const currentUser = currentUserData.rows[0];
      
      // Check if the user is trying to change the anonymous flag
      const anonymousChanged = anonymous !== undefined && anonymous !== currentUser.anonymous_flag;
      
      // If trying to change anonymous flag, check if allowed
      if (anonymousChanged && !currentUser.can_change_anonymous) {
        const lastChangeDate = new Date(currentUser.last_anonymous_change);
        const nextChangeDate = new Date(lastChangeDate);
        nextChangeDate.setDate(nextChangeDate.getDate() + 7);
        
        const now = new Date();
        const diffMs = nextChangeDate - now;
        const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
        
        return createError({
          statusCode: 403,
          statusMessage: `You can only change your anonymous status once per week. You can change it again in ${hoursRemaining} hours.`,
        });
      }

      // Modularly build update query based on provided fields
      let updateFields = [];
      let queryParams = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        queryParams.push(name);
      }

      if (city_id !== undefined) {
        updateFields.push(`city_id = $${paramIndex++}`);
        queryParams.push(city_id);
      }

      if (anonymousChanged) {
        updateFields.push(`anonymous_flag = $${paramIndex++}`);
        queryParams.push(anonymous);
        
        // Update the last_anonymous_change timestamp
        updateFields.push(`last_anonymous_change = CURRENT_TIMESTAMP`);
      }

      // If no fields to update, return current user data
      if (updateFields.length === 0) {
        const result = await query(`
          SELECT 
            u.user_id, 
            u.name, 
            u.phone_number, 
            u.city_id, 
            c.city_name,
            u.anonymous_flag
          FROM 
            AppUser u
          JOIN 
            -- For city name
            City c ON u.city_id = c.city_id
          WHERE 
            u.user_id = $1
        `, [user_id]);

        return {
          user: {
            id: result.rows[0].user_id,
            name: result.rows[0].name,
            phone_number: result.rows[0].phone_number,
            city_id: result.rows[0].city_id,
            city_name: result.rows[0].city_name,
            anonymous: result.rows[0].anonymous_flag
          },
          message: 'No changes made to profile'
        };
      }

      // Build and execute update
      queryParams.push(user_id);
      const updateQuery = `
        UPDATE AppUser 
        SET ${updateFields.join(', ')} 
        WHERE user_id = $${paramIndex} 
        RETURNING user_id
      `;

      await query(updateQuery, queryParams);

      // Fetch updated user data
      const updatedUserResult = await query(`
        SELECT 
          u.user_id, 
          u.name, 
          u.phone_number, 
          u.city_id, 
          c.city_name,
          u.anonymous_flag,
          u.last_anonymous_change
        FROM 
          AppUser u
        JOIN 
          -- For city name
          City c ON u.city_id = c.city_id
        WHERE 
          u.user_id = $1
      `, [user_id]);

      // Calculate the next possible change date if anonymous flag was changed
      let nextChangeDate = null;
      if (anonymousChanged) {
        const lastChangeDate = new Date(updatedUserResult.rows[0].last_anonymous_change);
        nextChangeDate = new Date(lastChangeDate);
        nextChangeDate.setDate(nextChangeDate.getDate() + 7);
      }

      // Return updated user data
      return {
        user: {
          id: updatedUserResult.rows[0].user_id,
          name: updatedUserResult.rows[0].name,
          phone_number: updatedUserResult.rows[0].phone_number,
          city_id: updatedUserResult.rows[0].city_id,
          city_name: updatedUserResult.rows[0].city_name,
          anonymous: updatedUserResult.rows[0].anonymous_flag,
          next_anonymous_change: nextChangeDate
        },
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return createError({
        statusCode: 500,
        statusMessage: 'An error occurred while updating user profile',
      });
    }
  }

  // Return method not allowed for other HTTP methods
  return createError({
    statusCode: 405,
    statusMessage: 'Method not allowed',
  });
}); 