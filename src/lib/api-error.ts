import { NextResponse } from "next/server";

type ErrorPayload = {
  error: string;
};

export function apiError(
  message: string,
  status: number,
  headers?: HeadersInit
) {
  return NextResponse.json<ErrorPayload>({ error: message }, { status, headers });
}

export function apiServerError(
  error: unknown,
  context: string,
  fallbackMessage: string
) {
  console.error(`${context}:`, error);
  return NextResponse.json<ErrorPayload>(
    { error: fallbackMessage },
    { status: 500 }
  );
}
