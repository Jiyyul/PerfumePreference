import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';

export function ok<T>(data: T, init?: ResponseInit) {
  const body: ApiResponse<T> = { data };
  return NextResponse.json(body, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  const body: ApiResponse<T> = { data };
  return NextResponse.json(body, { status: 201, ...init });
}

export function badRequest(message: string, init?: ResponseInit) {
  const body: ApiResponse<never> = { error: message };
  return NextResponse.json(body, { status: 400, ...init });
}

export function unauthorized(message = 'Unauthorized', init?: ResponseInit) {
  const body: ApiResponse<never> = { error: message };
  return NextResponse.json(body, { status: 401, ...init });
}

export function notFound(message = 'Not found', init?: ResponseInit) {
  const body: ApiResponse<never> = { error: message };
  return NextResponse.json(body, { status: 404, ...init });
}

export function serverError(message = 'Server error', init?: ResponseInit) {
  const body: ApiResponse<never> = { error: message };
  return NextResponse.json(body, { status: 500, ...init });
}

