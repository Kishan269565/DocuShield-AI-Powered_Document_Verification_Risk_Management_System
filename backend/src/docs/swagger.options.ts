import { OpenAPIV3 } from "openapi-types";

export const swaggerOptions: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Block ID Guard API",
    description: "Secure identity & document verification backend",
    version: "1.0.0",
  },

  servers: [
    {
      url: "http://localhost:5000",
      description: "Local",
    },
  ],

  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },

  security: [
    {
      BearerAuth: [],
    },
  ],

  tags: [
    { name: "Auth", description: "Authentication & authorization" },
    { name: "Users", description: "User operations" },
    { name: "Documents", description: "Document management" },
    { name: "Admin", description: "Admin-only routes" },
  ],

  paths: {},
};
