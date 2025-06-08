import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      checkin_date,
      checkout_date,
      nights,
      guests,
      total_price,
      name,
      email,
      phone,
      address,
      property_id
    } = request.body;

    // Validate required fields
    if (!checkin_date || !checkout_date || !name || !email || !property_id) {
      return response.status(400).json({ error: 'Missing required fields' });
    }

    // Convert total_price from "$123" to 123
    const priceNumber = parseInt(total_price.replace('$', '').replace(',', ''));

    // Verify property exists and is active
    const propertyCheck = await sql`
      SELECT id, name FROM properties 
      WHERE id = ${property_id} AND active = true;
    `;

    if (propertyCheck.rows.length === 0) {
      return response.status(400).json({ error: 'Invalid or inactive property' });
    }

    // Save to database
    const result = await sql`
      INSERT INTO bookings (
        checkin_date, 
        checkout_date, 
        nights, 
        guests, 
        total_price, 
        guest_name, 
        guest_email, 
        guest_phone, 
        guest_address,
        property_id
      )
      VALUES (
        ${checkin_date},
        ${checkout_date}, 
        ${nights},
        ${guests},
        ${priceNumber},
        ${name},
        ${email},
        ${phone},
        ${address},
        ${property_id}
      )
      RETURNING id;
    `;

    const bookingId = result.rows[0].id;
    const propertyName = propertyCheck.rows[0].name;

    return response.status(200).json({ 
      success: true, 
      bookingId: bookingId,
      propertyName: propertyName,
      message: 'Booking saved successfully' 
    });

  } catch (error) {
    console.error('Database error:', error);
    return response.status(500).json({ error: 'Failed to save booking' });
  }
}
