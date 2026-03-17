import { Hono } from "hono";
import { getUsers } from "../handlers/users/getUsers";
import { getUserById } from "../handlers/users/getUserById";
import { createUser } from "../handlers/users/createUser";
import { updateUser } from "../handlers/users/updateUser";
import { deleteUser } from "../handlers/users/deleteUser";
import { getUserTasks } from "../handlers/users/getUserTasks";

export const userRoutes = new Hono();

userRoutes.get("/", getUsers);
userRoutes.post("/", createUser);
userRoutes.get("/:id", getUserById);
userRoutes.put("/:id", updateUser);
userRoutes.delete("/:id", deleteUser);
userRoutes.get("/:id/tasks", getUserTasks);
