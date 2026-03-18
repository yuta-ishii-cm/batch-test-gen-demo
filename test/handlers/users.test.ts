// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { userStore } from "../../src/store/userStore";
import { taskStore } from "../../src/store/taskStore";
import { randomUUID } from "crypto";

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000";

/** テストごとにユニークなメールアドレスを生成する */
const uniqueEmail = (prefix = "user") => `${prefix}-${randomUUID()}@example.com`;

describe("Users API", () => {
  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  describe("GET /api/users", () => {
    it("ユーザー一覧が空のとき空配列を返すんやで", async () => {
      const res = await app.request("/api/users");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json).toEqual({ users: [] });
    });

    it("ユーザーが複数おったら全部返すねん", async () => {
      await userStore.create({ name: "太郎", email: uniqueEmail("taro") });
      await userStore.create({ name: "花子", email: uniqueEmail("hanako") });

      const res = await app.request("/api/users");
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.users.length).toEqual(2);
    });
  });

  describe("GET /api/users/:id", () => {
    it("IDで指定したユーザーが取得できるんやで", async () => {
      const email = uniqueEmail("taro");
      const created = await userStore.create({ name: "太郎", email });

      const res = await app.request(`/api/users/${created.id}`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.user.name).toEqual("太郎");
      expect(json.user.email).toEqual(email);
    });

    it("存在せえへんIDやったら404返すねん", async () => {
      const res = await app.request(`/api/users/${NON_EXISTENT_ID}`);
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "User not found" });
    });
  });

  describe("POST /api/users", () => {
    it("ユーザーが正しく作成されるんやで", async () => {
      const email = uniqueEmail("taro");
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "太郎", email }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.user.name).toEqual("太郎");
      expect(json.user.email).toEqual(email);
      expect(json.user.id).toBeDefined();
      expect(json.user.createdAt).toBeDefined();
      expect(json.user.updatedAt).toBeDefined();
    });

    it("名前がなかったら400返すねん", async () => {
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: uniqueEmail("noname") }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "Name is required" });
    });

    it("メールがなかったら400返すねん", async () => {
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "太郎" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "Email is required" });
    });

    it("名前もメールも両方なかったら名前の方のエラーが先に返るんやで", async () => {
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      expect(res.status).toEqual(400);
      expect(json).toEqual({ error: "Name is required" });
    });
  });

  describe("PUT /api/users/:id", () => {
    it("ユーザーの名前を更新できるんやで", async () => {
      const email = uniqueEmail("taro");
      const created = await userStore.create({ name: "太郎", email });

      const res = await app.request(`/api/users/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "次郎" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.user.name).toEqual("次郎");
      expect(json.user.email).toEqual(email);
    });

    it("ユーザーのメールを更新できるんやで", async () => {
      const created = await userStore.create({ name: "太郎", email: uniqueEmail("taro") });
      const newEmail = uniqueEmail("jiro");

      const res = await app.request(`/api/users/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json.user.email).toEqual(newEmail);
    });

    it("存在せえへんユーザーを更新しようとしたら404返すねん", async () => {
      const res = await app.request(`/api/users/${NON_EXISTENT_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "次郎" }),
      });
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "User not found" });
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("ユーザーを削除できるんやで", async () => {
      const created = await userStore.create({ name: "太郎", email: uniqueEmail("taro") });

      const res = await app.request(`/api/users/${created.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json).toEqual({ message: "User deleted" });

      const afterDelete = await userStore.getById(created.id);
      expect(afterDelete).toEqual(null);
    });

    it("存在せえへんユーザーを削除しようとしたら404返すねん", async () => {
      const res = await app.request(`/api/users/${NON_EXISTENT_ID}`, {
        method: "DELETE",
      });
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "User not found" });
    });
  });

  describe("GET /api/users/:id/tasks", () => {
    it("ユーザーに割り当てられたタスクを取得できるんやで", async () => {
      const user = await userStore.create({ name: "太郎", email: uniqueEmail("taro") });
      await taskStore.create({ title: "タスク1", assigneeId: user.id });

      const res = await app.request(`/api/users/${user.id}/tasks`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(Array.isArray(json.tasks)).toEqual(true);
      expect(json.tasks.every((t: { assigneeId: string }) => t.assigneeId === user.id)).toEqual(true);
    });

    it("タスクがなかったら空配列を返すんやで", async () => {
      const user = await userStore.create({ name: "太郎", email: uniqueEmail("taro") });

      const res = await app.request(`/api/users/${user.id}/tasks`);
      const json = await res.json();

      expect(res.status).toEqual(200);
      expect(json).toEqual({ tasks: [] });
    });

    it("存在せえへんユーザーのタスクを取ろうとしたら404返すねん", async () => {
      const res = await app.request(`/api/users/${NON_EXISTENT_ID}/tasks`);
      const json = await res.json();

      expect(res.status).toEqual(404);
      expect(json).toEqual({ error: "User not found" });
    });
  });

  describe("境界値テスト", () => {
    it("森鷗外みたいな旧字体の名前でもユーザー作れるんやで", async () => {
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外", email: uniqueEmail("ogai") }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.user.name).toEqual("森鷗外");
    });

    it("特殊文字入りのメールアドレスでもユーザー作れるんやで", async () => {
      const email = `ogai+test-${randomUUID()}@example.com`;
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外", email }),
      });
      const json = await res.json();

      expect(res.status).toEqual(201);
      expect(json.user.email).toEqual(email);
    });
  });
});
