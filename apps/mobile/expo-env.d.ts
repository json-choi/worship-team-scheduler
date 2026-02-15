/// <reference types="expo/types" />

// Ensure process.env types are available
declare var process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
};
