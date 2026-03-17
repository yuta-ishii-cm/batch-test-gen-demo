import { Hono } from "hono";
import { getComments } from "../handlers/comments/getComments";
import { createComment } from "../handlers/comments/createComment";
import { deleteComment } from "../handlers/comments/deleteComment";

export const commentRoutes = new Hono();

commentRoutes.get("/", getComments);
commentRoutes.post("/", createComment);
commentRoutes.delete("/:commentId", deleteComment);
