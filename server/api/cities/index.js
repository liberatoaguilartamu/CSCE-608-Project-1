import { query } from '../db';

export default defineEventHandler(async (event) => {
  // Get query parameters
  const { city_id } = getQuery(event);

  try {
    // If city_id is provided, return specific city
    if (city_id) {
      const cityResult = await query(
        'SELECT city_id, city_name FROM City WHERE city_id = $1',
        [city_id]
      );

      if (cityResult.rowCount === 0) {
        return createError({
          statusCode: 404,
          statusMessage: 'City not found',
        });
      }

      return {
        city: cityResult.rows[0],
      };
    }

    // Else, return all cities
    const citiesResult = await query('SELECT city_id, city_name FROM City ORDER BY city_name');
    
    return {
      cities: citiesResult.rows,
    };
  } catch (error) {
    console.error('Error fetching cities:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching cities',
    });
  }
}); 