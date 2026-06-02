import http from "http";
import app from "./app";
import prisma from "./lib/prisma";
import { setupGracefulShutdown } from "./security/bootstrap.security";

setupGracefulShutdown();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    console.log("✅ HTTP server closed");

    try {
      await prisma.$disconnect();
      console.log("✅ Prisma disconnected");
    } catch (err) {
      console.error("❌ Prisma disconnect error", err);
    } finally {
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.error("⏱️ Force shutdown");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("uncaughtException", shutdown);
process.on("unhandledRejection", shutdown);
