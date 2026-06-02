export const setupGracefulShutdown = () => {
  process.on("SIGTERM", () => {
    console.log("Graceful shutdown");
    process.exit(0);
  });

  process.on("uncaughtException", (err) => {
    console.error("CRITICAL ERROR", err);
    process.exit(1);
  });
};
