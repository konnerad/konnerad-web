import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'about').single()
  return NextResponse.json({ about: data?.value ?? '' })
}
