import { Hono } from "hono";
import { getTaskStats } from "../handlers/tasks/getTaskStats";

export const statsRoutes = new Hono();

statsRoutes.get("/", getTaskStats);
