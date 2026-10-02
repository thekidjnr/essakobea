import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/supabase/admin'
import { initializePayment, generateReference } from '@/lib/paystack'
import type { OrderItem } from '@/lib/supabase/types'

const DELIVERY_FEE_GHS = 50

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientName, clientEmail, clientPhone, items, deliveryMethod, deliveryAddress, notes } = body

    if (!clientName || !clientEmail || !clientPhone || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prices come from the products table, never from the client.
    const requested = (items as { productId?: string; quantity?: number }[])
    const slugs = requested.map((i) => i.productId).filter((s): s is string => typeof s === 'string')
    const { data: products } = await adminDb.from('products').select('slug, name, price_raw, in_stock').in('slug', slugs)
    const bySlug = new Map((products ?? []).map((p) => [p.slug, p]))

    const pricedItems: OrderItem[] = []
    for (const item of requested) {
      const product = item.productId ? bySlug.get(item.productId) : undefined
      const quantity = Math.floor(Number(item.quantity))
      if (!product || !product.in_stock || !(product.price_raw > 0)) {
        return NextResponse.json({ error: 'An item in your bag is no longer available. Please review your bag.' }, { status: 409 })
      }
      if (!(quantity >= 1 && quantity <= 20)) {
        return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
      }
      pricedItems.push({ productId: product.slug, name: product.name, price: product.price_raw * 100, quantity })
    }

    const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0) // in pesewas
    const deliveryFee = deliveryMethod === 'delivery' ? DELIVERY_FEE_GHS * 100 : 0
    const total = subtotal + deliveryFee

    const { data: order, error } = await adminDb.from('orders').insert({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      items: pricedItems,
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
