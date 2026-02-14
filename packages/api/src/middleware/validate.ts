import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";

export function jsonValidator<T extends ZodSchema>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          data: null,
          error: {
            message: "Validation failed",
            details: result.error.flatten(),
          },
        },
        400,
      );
    }
  });
}

export function queryValidator<T extends ZodSchema>(schema: T) {
  return zValidator("query", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          data: null,
          error: {
            message: "Invalid query parameters",
            details: result.error.flatten(),
          },
        },
        400,
      );
    }
  });
}

export function paramValidator<T extends ZodSchema>(schema: T) {
  return zValidator("param", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          data: null,
          error: {
            message: "Invalid parameters",
            details: result.error.flatten(),
          },
        },
        400,
      );
    }
  });
}
