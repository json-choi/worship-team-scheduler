import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { getDb } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
  }),
  trustedOrigins: [
    "wts://",
    "wts://*",
    ...(process.env.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
      : []),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [expo()],
  user: {
    modelName: "users",
    fields: {
      image: "avatar_url",
    },
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      googleCalendarToken: {
        type: "string",
        required: false,
        fieldName: "google_calendar_token",
        input: false,
      },
      pushToken: {
        type: "string",
        required: false,
        fieldName: "push_token",
        input: true,
      },
    },
  },
});
