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
    const { phone_number, name, password, city_id } = body;

    // Basic validation
    if (!phone_number || !name || !password || !city_id) {
      return createError({
        statusCode: 400,
        statusMessage: 'All fields are required',
      });
    }

    // Validate phone number format
    // Only 10 digit check
    if (!/^\d{10}$/.test(phone_number)) {
      return createError({
        statusCode: 400,
        statusMessage: 'Please enter a valid 10-digit phone number',
      });
    }

    // Check if user with this phone number already exists
    const existingUser = await query(
      'SELECT user_id FROM AppUser WHERE phone_number = $1',
      [phone_number]
    );

    if (existingUser.rowCount > 0) {
      return createError({
        statusCode: 409,
        statusMessage: 'A user with this phone number already exists',
      });
    }

    // Insert new user
    const result = await query(
      'INSERT INTO AppUser (phone_number, name, password, city_id, anonymous_flag) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
      [phone_number, name, password, city_id, false]
    );

    // Return success resp
    return {
      user_id: result.rows[0].user_id,
      message: 'Account created successfully',
    };
  } catch (error) {
    console.error('Signup error:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred during signup',
    });
  }
}); 