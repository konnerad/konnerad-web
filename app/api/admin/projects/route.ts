import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'

async function guard() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  const denied = await guard(); if (denied) return denied
  const body = await req.json()
  const supabase = createServiceClient()

  // Set order_index to end of list
  const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true })
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...body, order_index: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const denied = await guard(); if (denied) return denied
  const { id, ...updates } = await req.json()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const denied = await guard(); if (denied) return denied
  const { order } = await req.json() as { order: { id: string; order_index: number }[] }
  const supabase = createServiceClient()

  const results = await Promise.all(
    order.map(({ id, order_index }) =>
      supabase.from('projects').update({ order_index }).eq('id', id)
    )
  )
  const failed = results.find(r => r.error)
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const denied = await guard(); if (denied) return denied
  const { id } = await req.json()
  const supabase = createServiceClient()

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
