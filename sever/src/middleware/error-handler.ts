import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../errors/http-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    response.status(400).json({
      message: firstIssue?.message || "Dữ liệu gửi lên không hợp lệ.",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
      ...(error.redirectToLogin ? { redirectToLogin: true } : {}),
    });
    return;
  }

  console.error("Lỗi xử lý request:", error);
  response.status(500).json({
    message: "Đã xảy ra lỗi máy chủ.",
    ...(env.NODE_ENV === "development" && error instanceof Error
      ? { detail: error.message }
      : {}),
  });
};
