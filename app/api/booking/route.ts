import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, eventDate, eventType, venue, message } = body

  if (!name || !email || !eventDate || !eventType || !venue) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const booking = await prisma.bookingRequest.create({
      data: { name, email, eventDate, eventType, venue, message: message || null },
    })
    return NextResponse.json({ id: booking.id }, { status: 201 })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
