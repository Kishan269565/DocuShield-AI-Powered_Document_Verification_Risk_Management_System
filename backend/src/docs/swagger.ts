import swaggerUi from "swagger-ui-express";
import { swaggerOptions } from "./swagger.options";

export const swaggerServe = swaggerUi.serve;
export const swaggerSetup = swaggerUi.setup(swaggerOptions, {
  explorer: true,
  customSiteTitle: "Block ID Guard API Docs",
});
