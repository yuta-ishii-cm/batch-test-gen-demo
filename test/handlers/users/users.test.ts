import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";
import { commentStore } from "../../../src/store/commentStore";
import { tagStore } from "../../../src/store/tagStore";
import { milestoneStore } from "../../../src/store/milestoneStore";
import { projectStore } from "../../../src/store/projectStore";
import type { User } from "../../../src/types/user";
import type { Task } from "../../../src/types/task";

const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

const resetAllStores = async () => {
  await commentStore.reset();
  await tagStore.reset();
  await milestoneStore.reset();
  await taskStore.reset();
  await projectStore.reset();
  await userStore.reset();
};

const createTestUser = async (name = "テストユーザー", email = "test@example.com") => {
  const res = await app.request("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  const json = (await res.json()) as { user: User };
  return json.user;
};

describe("POST /api/users", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: ユーザーを作成できる", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "テストユーザー", email: "test@example.com" }),
    });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { user: User };
    expect(json.user.name).toEqual("テストユーザー");
    expect(json.user.email).toEqual("test@example.com");
    expect(json.user.id).toBeDefined();
    expect(json.user.createdAt).toBeDefined();
    expect(json.user.updatedAt).toBeDefined();
  });

  it("異常系: nameが未指定の場合400エラー", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Name is required");
  });

  it("異常系: emailが未指定の場合400エラー", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "テストユーザー" }),
    });

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Email is required");
  });
});

describe("GET /api/users", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: ユーザーが0件の場合は空配列を返す", async () => {
    const res = await app.request("/api/users");

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { users: User[] };
    expect(json.users).toEqual([]);
  });

  it("正常系: 登録済みユーザー一覧を返す", async () => {
    await createTestUser("ユーザー1", "user1@example.com");
    await createTestUser("ユーザー2", "user2@example.com");

    const res = await app.request("/api/users");

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { users: User[] };
    expect(json.users.length).toEqual(2);
    const names = json.users.map((u) => u.name).sort();
    expect(names).toEqual(["ユーザー1", "ユーザー2"]);
  });
});

describe("GET /api/users/:id", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: 指定IDのユーザーを返す", async () => {
    const created = await createTestUser();

    const res = await app.request(`/api/users/${created.id}`);

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { user: User };
    expect(json.user.id).toEqual(created.id);
    expect(json.user.name).toEqual("テストユーザー");
    expect(json.user.email).toEqual("test@example.com");
  });

  it("異常系: 存在しないIDの場合404エラー", async () => {
    const res = await app.request(`/api/users/${NON_EXISTENT_UUID}`);

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("User not found");
  });
});

describe("PUT /api/users/:id", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: ユーザーを更新できる", async () => {
    const created = await createTestUser();

    const res = await app.request(`/api/users/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "更新ユーザー", email: "updated@example.com" }),
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { user: User };
    expect(json.user.id).toEqual(created.id);
    expect(json.user.name).toEqual("更新ユーザー");
    expect(json.user.email).toEqual("updated@example.com");
  });

  it("異常系: 存在しないIDの場合404エラー", async () => {
    const res = await app.request(`/api/users/${NON_EXISTENT_UUID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "更新ユーザー" }),
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("User not found");
  });
});

describe("DELETE /api/users/:id", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: ユーザーを削除できる", async () => {
    const created = await createTestUser();

    const res = await app.request(`/api/users/${created.id}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { message: string };
    expect(json.message).toEqual("User deleted");

    const getRes = await app.request(`/api/users/${created.id}`);
    expect(getRes.status).toEqual(404);
  });

  it("異常系: 存在しないIDの場合404エラー", async () => {
    const res = await app.request(`/api/users/${NON_EXISTENT_UUID}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("User not found");
  });
});

describe("GET /api/users/:id/tasks", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: ユーザーに割り当てられたタスク一覧を返す", async () => {
    const user = await createTestUser();
    await taskStore.create({ title: "タスク1", assigneeId: user.id });
    await taskStore.create({ title: "タスク2", assigneeId: user.id });
    await taskStore.create({ title: "他のタスク" });

    const res = await app.request(`/api/users/${user.id}/tasks`);

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: Task[] };
    expect(json.tasks.length).toEqual(2);
    const titles = json.tasks.map((t) => t.title).sort();
    expect(titles).toEqual(["タスク1", "タスク2"]);
  });

  it("正常系: タスクが0件の場合は空配列を返す", async () => {
    const user = await createTestUser();

    const res = await app.request(`/api/users/${user.id}/tasks`);

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: Task[] };
    expect(json.tasks).toEqual([]);
  });

  it("異常系: 存在しないユーザーIDの場合404エラー", async () => {
    const res = await app.request(`/api/users/${NON_EXISTENT_UUID}/tasks`);

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("User not found");
  });
});
