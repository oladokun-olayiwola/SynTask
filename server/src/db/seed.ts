import { db } from "./index";
import { users, tasks } from "./schema";

async function seed() {
  // 1. Create a seed user (or get existing)
  const [demoUser] = await db
    .insert(users)
    .values({
      email: "demo@syntask.app",
      username: "demo_user",
      passwordHash: "$2a$10$e8N8...dummyhash...", // standard bcrypt hash
      avatarColor: "#3b82f6",
    })
    .onConflictDoNothing()
    .returning();

  // Fallback to ID 1 if already exists
  const userId = demoUser ? demoUser.id : 1;

  // 2. Clear existing tasks
  await db.delete(tasks);

  // 3. Insert seed tasks with required userId
  await db.insert(tasks).values([
    {
      userId,
      title: "Set up CI/CD pipeline",
      description: "Automate testing and linting via GitHub Actions",
      status: "done",
      position: 0,
    },
    {
      userId,
      title: "Integrate JWT Authentication",
      description: "Implement registration and login modals with local storage persistence",
      status: "in-progress",
      position: 0,
    },
    {
      userId,
      title: "Add Calendar Alerts",
      description: "Configure Web Notifications API for projected task deadlines",
      status: "todo",
      position: 0,
    },
    {
      userId,
      title: "Driver.js Onboarding Tour",
      description: "Walk new users through board features on first visit",
      status: "todo",
      position: 1,
    },
  ]);

  console.log("Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});