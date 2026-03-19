// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { commentStore } from "../../src/store/commentStore";
import { tagStore } from "../../src/store/tagStore";
import { taskStore } from "../../src/store/taskStore";
import { userStore } from "../../src/store/userStore";

const NONEXISTENT_ID = "00000000-0000-0000-0000-000000000000";

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
  await userStore.reset();
});

describe("POST /api/users", () => {
  beforeAll(() => {
    console.log("[START] POST /api/users");
  });

  afterAll(() => {
    console.log("[END] POST /api/users");
  });

  it("nameとemailを渡すと201でユーザーが作成される", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "田中太郎", email: "tanaka@example.com" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(201);
    expect(json.user.name).toEqual("田中太郎");
    expect(json.user.email).toEqual("tanaka@example.com");
    expect(json.user.id).toBeDefined();
  });

  it("サロゲートペアを含む名前でユーザーが作成される", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外", email: "mori-ogai@example.com" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(201);
    expect(json.user.name).toEqual("森鷗外");
  });

  it("nameがない場合は400エラーが返る", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Name is required");
  });

  it("emailがない場合は400エラーが返る", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "田中太郎" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Email is required");
  });

  it("nameもemailもない場合は400エラーが返る", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toEqual(400);
  });
});

describe("GET /api/users", () => {
  beforeAll(() => {
    console.log("[START] GET /api/users");
  });

  afterAll(() => {
    console.log("[END] GET /api/users");
  });

  it("ユーザーが存在しない場合は空配列が返る", async () => {
    const res = await app.request("/api/users");
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.users).toEqual([]);
  });

  it("作成したユーザーが一覧に含まれる", async () => {
    await userStore.create({ name: "鈴木一郎", email: "suzuki@example.com" });
    await userStore.create({ name: "佐藤花子", email: "sato@example.com" });

    const res = await app.request("/api/users");
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.users).toHaveLength(2);
    const names = json.users.map((u: { name: string }) => u.name);
    expect(names).toContain("鈴木一郎");
    expect(names).toContain("佐藤花子");
  });
});

describe("GET /api/users/:id", () => {
  beforeAll(() => {
    console.log("[START] GET /api/users/:id");
  });

  afterAll(() => {
    console.log("[END] GET /api/users/:id");
  });

  it("存在するIDを渡すとユーザーが返る", async () => {
    const user = await userStore.create({
      name: "山田次郎",
      email: "yamada@example.com",
    });

    const res = await app.request(`/api/users/${user.id}`);
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.user.id).toEqual(user.id);
    expect(json.user.name).toEqual("山田次郎");
    expect(json.user.email).toEqual("yamada@example.com");
  });

  it("存在しないIDを渡すと404エラーが返る", async () => {
    const res = await app.request(`/api/users/${NONEXISTENT_ID}`);
    const json = await res.json();
    expect(res.status).toEqual(404);
    expect(json.error).toEqual("User not found");
  });
});

describe("PUT /api/users/:id", () => {
  beforeAll(() => {
    console.log("[START] PUT /api/users/:id");
  });

  afterAll(() => {
    console.log("[END] PUT /api/users/:id");
  });

  it("nameを更新するとユーザー情報が更新される", async () => {
    const user = await userStore.create({
      name: "旧名前",
      email: "update@example.com",
    });

    const res = await app.request(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "新名前" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.user.name).toEqual("新名前");
    expect(json.user.email).toEqual("update@example.com");
  });

  it("emailを更新するとユーザー情報が更新される", async () => {
    const user = await userStore.create({
      name: "田中三郎",
      email: "old@example.com",
    });

    const res = await app.request(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@example.com" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.user.email).toEqual("new@example.com");
    expect(json.user.name).toEqual("田中三郎");
  });

  it("nameとemailを同時に更新できる", async () => {
    const user = await userStore.create({
      name: "旧名前",
      email: "old@example.com",
    });

    const res = await app.request(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "新名前", email: "new@example.com" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.user.name).toEqual("新名前");
    expect(json.user.email).toEqual("new@example.com");
  });

  it("存在しないIDを渡すと404エラーが返る", async () => {
    const res = await app.request(`/api/users/${NONEXISTENT_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "新名前" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(404);
    expect(json.error).toEqual("User not found");
  });

  it("サロゲートペアを含む名前に更新できる", async () => {
    const user = await userStore.create({
      name: "田中太郎",
      email: "tanaka2@example.com",
    });

    const res = await app.request(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外" }),
    });
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.user.name).toEqual("森鷗外");
  });
});

describe("DELETE /api/users/:id", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/users/:id");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/users/:id");
  });

  it("存在するIDを渡すとユーザーが削除される", async () => {
    const user = await userStore.create({
      name: "削除対象",
      email: "delete@example.com",
    });

    const res = await app.request(`/api/users/${user.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.message).toEqual("User deleted");
  });

  it("削除後にユーザーが取得できなくなる", async () => {
    const user = await userStore.create({
      name: "削除確認用",
      email: "delete-check@example.com",
    });

    await app.request(`/api/users/${user.id}`, { method: "DELETE" });

    const res = await app.request(`/api/users/${user.id}`);
    expect(res.status).toEqual(404);
  });

  it("存在しないIDを渡すと404エラーが返る", async () => {
    const res = await app.request(`/api/users/${NONEXISTENT_ID}`, {
      method: "DELETE",
    });
    const json = await res.json();
    expect(res.status).toEqual(404);
    expect(json.error).toEqual("User not found");
  });
});

describe("GET /api/users/:id/tasks", () => {
  beforeAll(() => {
    console.log("[START] GET /api/users/:id/tasks");
  });

  afterAll(() => {
    console.log("[END] GET /api/users/:id/tasks");
  });

  it("ユーザーに割り当てられたタスクが返る", async () => {
    const user = await userStore.create({
      name: "担当者",
      email: "assignee@example.com",
    });
    await taskStore.create({
      title: "マグロ",
      assigneeId: user.id,
    });
    await taskStore.create({
      title: "サーモン",
    });

    const res = await app.request(`/api/users/${user.id}/tasks`);
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("マグロ");
    expect(json.tasks[0].assigneeId).toEqual(user.id);
  });

  it("タスクが割り当てられていない場合は空配列が返る", async () => {
    const user = await userStore.create({
      name: "タスクなし",
      email: "notask@example.com",
    });

    const res = await app.request(`/api/users/${user.id}/tasks`);
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.tasks).toEqual([]);
  });

  it("複数のタスクが割り当てられている場合は全件返る", async () => {
    const user = await userStore.create({
      name: "多タスク担当者",
      email: "multitask@example.com",
    });
    await taskStore.create({ title: "エビ", assigneeId: user.id });
    await taskStore.create({ title: "イカ", assigneeId: user.id });
    await taskStore.create({ title: "タマゴ", assigneeId: user.id });

    const res = await app.request(`/api/users/${user.id}/tasks`);
    const json = await res.json();
    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(3);
  });

  it("存在しないユーザーIDを渡すと404エラーが返る", async () => {
    const res = await app.request(`/api/users/${NONEXISTENT_ID}/tasks`);
    const json = await res.json();
    expect(res.status).toEqual(404);
    expect(json.error).toEqual("User not found");
  });
});
