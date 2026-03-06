import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { initializePayment, generateReference } from '@/lib/paystack'

const DELIVERY_FEE_GHS = 50

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientName, clientEmail, clientPhone, items, deliveryMethod, deliveryAddress, notes } = body

    if (!clientName || !clientEmail || !clientPhone || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) =>
      sum + item.price * item.quantity, 0) // in pesewas
    const deliveryFee = deliveryMethod === 'delivery' ? DELIVERY_FEE_GHS * 100 : 0
    const total = subtotal + deliveryFee

    const { data: order, error } = await adminDb.from('orders').insert({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      items,
      subtotal,
      total,
      status: 'pending',
      payment_status: 'unpaid',
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress || null,
      notes: notes || null,
    }).select().single()

    if (error || !order) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const reference = generateReference('ord')
    const { url } = await initializePayment({
      email: clientEmail,
      amountGHS: total / 100,
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      metadata: { orderId: order.id, type: 'order' },
    })

    await adminDb.from('orders').update({ payment_reference: reference }).eq('id', order.id)

    return NextResponse.json({ orderId: order.id, paystackUrl: url })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
