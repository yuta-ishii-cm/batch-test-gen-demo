import { Hono } from "hono";
import { getProjects } from "../handlers/projects/getProjects";
import { getProjectById } from "../handlers/projects/getProjectById";
import { createProject } from "../handlers/projects/createProject";
import { updateProject } from "../handlers/projects/updateProject";
import { deleteProject } from "../handlers/projects/deleteProject";
import { getProjectTasks } from "../handlers/projects/getProjectTasks";

export const projectRoutes = new Hono();

projectRoutes.get("/", getProjects);
projectRoutes.post("/", createProject);
projectRoutes.get("/:id", getProjectById);
projectRoutes.put("/:id", updateProject);
projectRoutes.delete("/:id", deleteProject);
projectRoutes.get("/:id/tasks", getProjectTasks);
