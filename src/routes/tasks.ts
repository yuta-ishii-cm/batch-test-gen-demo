import { Hono } from "hono";
import { getTasks } from "../handlers/tasks/getTasks";
import { getTaskById } from "../handlers/tasks/getTaskById";
import { createTask } from "../handlers/tasks/createTask";
import { updateTask } from "../handlers/tasks/updateTask";
import { deleteTask } from "../handlers/tasks/deleteTask";
import { getTaskTags } from "../handlers/tasks/getTaskTags";
import { addTaskTag } from "../handlers/tasks/addTaskTag";
import { removeTaskTag } from "../handlers/tasks/removeTaskTag";
import { searchTasks } from "../handlers/tasks/searchTasks";

export const taskRoutes = new Hono();

taskRoutes.get("/search", searchTasks);
taskRoutes.get("/", getTasks);
taskRoutes.post("/", createTask);
taskRoutes.get("/:id", getTaskById);
taskRoutes.put("/:id", updateTask);
taskRoutes.delete("/:id", deleteTask);
taskRoutes.get("/:id/tags", getTaskTags);
taskRoutes.post("/:id/tags", addTaskTag);
taskRoutes.delete("/:id/tags/:tagId", removeTaskTag);
