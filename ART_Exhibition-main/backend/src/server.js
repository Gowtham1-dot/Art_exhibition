import dotenv from "dotenv";

// IMPORTANT (ESM): load env vars before importing app/routes/services.
// Use an explicit path so it works even if process.cwd() isn't `backend/`.
dotenv.config({ path: new URL("../.env", import.meta.url), override: false });
// Also support repo-root .env for teams that keep a single env file.
dotenv.config({
  path: new URL("../../.env", import.meta.url),
  override: false,
});

const [{ default: app }, { connectDB }] = await Promise.all([
  import("./app.js"),
  import("./config/db.js"),
]);

const port = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(port, () => console.log(`Server running on port ${port}`));
} catch (error) {
  console.error("\nFatal: cannot start server without MongoDB.");
  process.exit(1);
}
