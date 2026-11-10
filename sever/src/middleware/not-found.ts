import type { RequestHandler } from "express";

export const notFound: RequestHandler = (request, response) => {
  response.status(404).json({
    message: `Không tìm thấy API ${request.method} ${request.originalUrl}.`,
  });
};
