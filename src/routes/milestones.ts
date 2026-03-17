import { Hono } from "hono";
import { getMilestones } from "../handlers/milestones/getMilestones";
import { getMilestoneById } from "../handlers/milestones/getMilestoneById";
import { createMilestone } from "../handlers/milestones/createMilestone";
import { updateMilestone } from "../handlers/milestones/updateMilestone";
import { deleteMilestone } from "../handlers/milestones/deleteMilestone";

export const milestoneRoutes = new Hono();

milestoneRoutes.get("/", getMilestones);
milestoneRoutes.post("/", createMilestone);
milestoneRoutes.get("/:milestoneId", getMilestoneById);
milestoneRoutes.put("/:milestoneId", updateMilestone);
milestoneRoutes.delete("/:milestoneId", deleteMilestone);
