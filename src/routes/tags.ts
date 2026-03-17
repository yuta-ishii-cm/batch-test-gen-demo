import { Hono } from "hono";
import { getTags } from "../handlers/tags/getTags";
import { createTag } from "../handlers/tags/createTag";
import { deleteTag } from "../handlers/tags/deleteTag";

export const tagRoutes = new Hono();

tagRoutes.get("/", getTags);
tagRoutes.post("/", createTag);
tagRoutes.delete("/:id", deleteTag);
