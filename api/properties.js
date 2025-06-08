import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      // Get all active properties
      const result = await sql`
        SELECT id, name, slug, description, max_guests,
               sunday_price, monday_price, tuesday_price, wednesday_price,
               thursday_price, friday_price, saturday_price,
               unavailable_dates, active
        FROM properties 
        WHERE active = true
        ORDER BY name;
      `;

      return response.status(200).json({ 
        success: true, 
        properties: result.rows 
      });

    } catch (error) {
      console.error('Properties fetch error:', error);
      return response.status(500).json({ error: 'Failed to fetch properties' });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
