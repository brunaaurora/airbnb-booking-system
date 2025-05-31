import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all confirmed bookings from database
    const result = await sql`
      SELECT checkin_date, checkout_date, guest_name, id
      FROM bookings 
      WHERE status = 'confirmed'
      ORDER BY checkin_date;
    `;

    const bookings = result.rows;

    // Generate iCal content
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Your Property//Booking System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    bookings.forEach(booking => {
      const checkinDate = new Date(booking.checkin_date);
      const checkoutDate = new Date(booking.checkout_date);
      
      // Format dates for iCal (YYYYMMDD)
      const startDate = checkinDate.toISOString().slice(0, 10).replace(/-/g, '');
      const endDate = checkoutDate.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Create unique ID for this booking
      const uid = `booking-${booking.id}@yourproperty.com`;
      
      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:Booked - ${booking.guest_name}`,
        `DESCRIPTION:Property booked via website`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    });

    icalContent.push('END:VCALENDAR');

    // Set proper headers for iCal
    response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    
    return response.status(200).send(icalContent.join('\r\n'));

  } catch (error) {
    console.error('Calendar generation error:', error);
    return response.status(500).json({ error: 'Failed to generate calendar' });
  }
}
