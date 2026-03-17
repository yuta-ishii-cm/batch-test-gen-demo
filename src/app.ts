import { Hono } from "hono";
import { taskRoutes } from "./routes/tasks";
import { statsRoutes } from "./routes/stats";
import { userRoutes } from "./routes/users";
import { tagRoutes } from "./routes/tags";
import { commentRoutes } from "./routes/comments";
import { projectRoutes } from "./routes/projects";
import { milestoneRoutes } from "./routes/milestones";

const app = new Hono();

app.route("/api/tasks/stats", statsRoutes);
app.route("/api/tasks", taskRoutes);
app.route("/api/users", userRoutes);
app.route("/api/tags", tagRoutes);
app.route("/api/tasks/:taskId/comments", commentRoutes);
app.route("/api/projects", projectRoutes);
app.route("/api/projects/:projectId/milestones", milestoneRoutes);

export default app;
