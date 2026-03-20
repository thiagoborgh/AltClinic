import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const EXPRESS_API = process.env.EXPRESS_API_URL || 'http://localhost:3000'

async function proxyToExpress(
  request: NextRequest,
  context: { params: Promise<{ proxy: string[] }> }
): Promise<NextResponse> {
  const params = await context.params
  const path = params.proxy.join('/')
  const queryString = request.nextUrl.search
  const url = `${EXPRESS_API}/api/${path}${queryString}`

  const cookieStore = await cookies()
  const token = cookieStore.get('altclinic_token')?.value

  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('Content-Type') || 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const body = hasBody ? await request.text() : undefined

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    })

    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('[BFF Proxy] Erro ao chamar Express:', error)
    return NextResponse.json(
      { error: 'Serviço indisponível' },
      { status: 503 }
    )
  }
}

type RouteContext = { params: Promise<{ proxy: string[] }> }

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
export async function POST(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToExpress(request, context)
}
