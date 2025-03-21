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
    const { phone_number, password } = body;

    // Basic validation
    if (!phone_number || !password) {
      return createError({
        statusCode: 400,
        statusMessage: 'Phone number and password are required',
      });
    }

    // Check if user exists with those credentials
    const result = await query(
      'SELECT user_id, phone_number, name, city_id, anonymous_flag FROM AppUser WHERE phone_number = $1 AND password = $2',
      [phone_number, password]
    );

    if (result.rowCount === 0) {
      return createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      });
    }

    // Return user data (excluding password)
    const user = result.rows[0];
    
    // No auth for demo purposes
    return {
      user,
      message: 'Login successful',
    };
  } catch (error) {
    console.error('Login error:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred during login',
    });
  }
}); 