import { NextResponse } from "next/server";
import type { ApiError, ApiResponse } from "@/lib/types";

export function ok<T>(data: T, nextActions: string[] = []) {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    nextActions,
  });
}

export function fail(error: ApiError, status = 400, nextActions: string[] = []) {
  return NextResponse.json<ApiResponse<never>>(
    {
      success: false,
      error,
      nextActions,
    },
    { status },
  );
}

export function parseError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: error.message,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Unknown server error",
    details: error,
  };
}
