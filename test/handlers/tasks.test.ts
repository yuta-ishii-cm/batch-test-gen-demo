// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { taskStore } from "../../src/store/taskStore";
import { tagStore } from "../../src/store/tagStore";
import { commentStore } from "../../src/store/commentStore";

const postJson = (path: string, body: unknown) =>
  app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const putJson = (path: string, body: unknown) =>
  app.request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
});

describe("POST /api/tasks", () => {
  beforeAll(() => {
    console.log("[START] POST /api/tasks");
  });

  afterAll(() => {
    console.log("[END] POST /api/tasks");
  });

  it("タイトルを指定してタスクを作成できる", async () => {
    const res = await postJson("/api/tasks", { title: "マグロ" });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.task.title).toEqual("マグロ");
    expect(json.task.status).toEqual("todo");
    expect(json.task.id).toBeDefined();
  });

  it("ステータスを指定してタスクを作成できる", async () => {
    const res = await postJson("/api/tasks", { title: "サーモン", status: "in_progress" });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.task.status).toEqual("in_progress");
  });

  it("説明を含めてタスクを作成できる", async () => {
    const res = await postJson("/api/tasks", { title: "エビ", description: "詳細説明" });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.task.description).toEqual("詳細説明");
  });

  it("タイトルが未指定のとき400を返す", async () => {
    const res = await postJson("/api/tasks", { description: "説明のみ" });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Title is required");
  });

  it("無効なステータスのとき400を返す", async () => {
    const res = await postJson("/api/tasks", { title: "イカ", status: "invalid_status" });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Invalid status");
  });

  it("サロゲートペア文字（森鷗外）をタイトルに使用できる", async () => {
    const res = await postJson("/api/tasks", { title: "森鷗外の作品を読む" });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.task.title).toEqual("森鷗外の作品を読む");
  });
});

describe("GET /api/tasks", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks");
  });

  it("タスク一覧を取得できる", async () => {
    await taskStore.create({ title: "マグロ" });
    await taskStore.create({ title: "サーモン" });

    const res = await app.request("/api/tasks");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(2);
  });

  it("タスクが0件のとき空配列を返す", async () => {
    const res = await app.request("/api/tasks");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toEqual([]);
  });

  it("statusでフィルタリングできる", async () => {
    await taskStore.create({ title: "マグロ", status: "todo" });
    await taskStore.create({ title: "サーモン", status: "in_progress" });
    await taskStore.create({ title: "エビ", status: "done" });

    const res = await app.request("/api/tasks?status=in_progress");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("サーモン");
  });

  it("存在しないstatusでフィルタリングすると空配列を返す", async () => {
    await taskStore.create({ title: "マグロ" });

    const res = await app.request("/api/tasks?status=nonexistent");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toEqual([]);
  });
});

describe("GET /api/tasks/:id", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks/:id");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks/:id");
  });

  it("IDを指定してタスクを取得できる", async () => {
    const task = await taskStore.create({ title: "マグロ" });

    const res = await app.request(`/api/tasks/${task.id}`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.task.id).toEqual(task.id);
    expect(json.task.title).toEqual("マグロ");
  });

  it("存在しないIDのとき404を返す", async () => {
    const res = await app.request("/api/tasks/nonexistent-id");
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });
});

describe("PUT /api/tasks/:id", () => {
  beforeAll(() => {
    console.log("[START] PUT /api/tasks/:id");
  });

  afterAll(() => {
    console.log("[END] PUT /api/tasks/:id");
  });

  it("タスクのタイトルを更新できる", async () => {
    const task = await taskStore.create({ title: "マグロ" });

    const res = await putJson(`/api/tasks/${task.id}`, { title: "サーモン" });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.task.title).toEqual("サーモン");
  });

  it("タスクのステータスを更新できる", async () => {
    const task = await taskStore.create({ title: "エビ", status: "todo" });

    const res = await putJson(`/api/tasks/${task.id}`, { status: "done" });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.task.status).toEqual("done");
  });

  it("無効なステータスで更新しようとすると400を返す", async () => {
    const task = await taskStore.create({ title: "イカ" });

    const res = await putJson(`/api/tasks/${task.id}`, { status: "invalid" });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Invalid status");
  });

  it("存在しないIDのとき404を返す", async () => {
    const res = await putJson("/api/tasks/nonexistent-id", { title: "ウニ" });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });
});

describe("DELETE /api/tasks/:id", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/tasks/:id");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/tasks/:id");
  });

  it("タスクを削除できる", async () => {
    const task = await taskStore.create({ title: "マグロ" });

    const res = await app.request(`/api/tasks/${task.id}`, { method: "DELETE" });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.message).toEqual("Task deleted");
  });

  it("削除後にタスクが取得できなくなる", async () => {
    const task = await taskStore.create({ title: "サーモン" });
    await app.request(`/api/tasks/${task.id}`, { method: "DELETE" });

    const res = await app.request(`/api/tasks/${task.id}`);
    expect(res.status).toEqual(404);
  });

  it("存在しないIDのとき404を返す", async () => {
    const res = await app.request("/api/tasks/nonexistent-id", { method: "DELETE" });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });
});

describe("GET /api/tasks/search", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks/search");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks/search");
  });

  it("タイトルでタスクを検索できる", async () => {
    await taskStore.create({ title: "マグロの解体" });
    await taskStore.create({ title: "サーモンの仕入れ" });

    const res = await app.request("/api/tasks/search?q=マグロ");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("マグロの解体");
  });

  it("説明でタスクを検索できる", async () => {
    await taskStore.create({ title: "エビ", description: "重要な修正" });
    await taskStore.create({ title: "イカ", description: "機能追加" });

    const res = await app.request("/api/tasks/search?q=重要");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("エビ");
  });

  it("大文字・小文字を区別せず検索できる", async () => {
    await taskStore.create({ title: "Fix Bug" });

    const res = await app.request("/api/tasks/search?q=fix");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
  });

  it("qパラメータが未指定のとき400を返す", async () => {
    const res = await app.request("/api/tasks/search");
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Query parameter 'q' is required");
  });

  it("検索結果が0件のとき空配列を返す", async () => {
    await taskStore.create({ title: "マグロ" });

    const res = await app.request("/api/tasks/search?q=存在しないキーワード");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toEqual([]);
  });

  it("サロゲートペア文字（森鷗外）で検索できる", async () => {
    await taskStore.create({ title: "森鷗外の舞姫を読む" });
    await taskStore.create({ title: "夏目漱石を読む" });

    const res = await app.request("/api/tasks/search?q=森鷗外");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("森鷗外の舞姫を読む");
  });
});

describe("GET /api/tasks/stats", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks/stats");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks/stats");
  });

  it("タスクの統計情報を取得できる", async () => {
    await taskStore.create({ title: "マグロ", status: "todo" });
    await taskStore.create({ title: "サーモン", status: "todo" });
    await taskStore.create({ title: "エビ", status: "in_progress" });
    await taskStore.create({ title: "イカ", status: "done" });

    const res = await app.request("/api/tasks/stats");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.total).toEqual(4);
    expect(json.byStatus.todo).toEqual(2);
    expect(json.byStatus.in_progress).toEqual(1);
    expect(json.byStatus.done).toEqual(1);
  });

  it("タスクが0件のとき全てが0の統計を返す", async () => {
    const res = await app.request("/api/tasks/stats");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.total).toEqual(0);
    expect(json.byStatus.todo).toEqual(0);
    expect(json.byStatus.in_progress).toEqual(0);
    expect(json.byStatus.done).toEqual(0);
  });
});

describe("GET /api/tasks/:id/tags", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks/:id/tags");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks/:id/tags");
  });

  it("タスクに紐づくタグ一覧を取得できる", async () => {
    const task = await taskStore.create({ title: "マグロ" });
    const tag = await tagStore.create({ name: "バグ" });
    await tagStore.addToTask(task.id, tag.id);

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tags).toHaveLength(1);
    expect(json.tags[0].name).toEqual("バグ");
  });

  it("タグが紐づいていないときは空配列を返す", async () => {
    const task = await taskStore.create({ title: "サーモン" });

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tags).toEqual([]);
  });

  it("存在しないタスクIDのとき404を返す", async () => {
    const res = await app.request("/api/tasks/nonexistent-id/tags");
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });
});

describe("POST /api/tasks/:id/tags", () => {
  beforeAll(() => {
    console.log("[START] POST /api/tasks/:id/tags");
  });

  afterAll(() => {
    console.log("[END] POST /api/tasks/:id/tags");
  });

  it("タスクにタグを追加できる", async () => {
    const task = await taskStore.create({ title: "マグロ" });
    const tag = await tagStore.create({ name: "重要" });

    const res = await postJson(`/api/tasks/${task.id}/tags`, { tagId: tag.id });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.tags).toHaveLength(1);
    expect(json.tags[0].name).toEqual("重要");
  });

  it("tagIdが未指定のとき400を返す", async () => {
    const task = await taskStore.create({ title: "サーモン" });

    const res = await postJson(`/api/tasks/${task.id}/tags`, {});
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("tagId is required");
  });

  it("存在しないタスクIDのとき404を返す", async () => {
    const tag = await tagStore.create({ name: "タグ" });

    const res = await postJson("/api/tasks/nonexistent-id/tags", { tagId: tag.id });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });

  it("存在しないタグIDのとき404を返す", async () => {
    const task = await taskStore.create({ title: "エビ" });

    const res = await postJson(`/api/tasks/${task.id}/tags`, { tagId: "nonexistent-tag-id" });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Tag not found");
  });

  it("同じタグを2回追加しても重複しない", async () => {
    const task = await taskStore.create({ title: "イカ" });
    const tag = await tagStore.create({ name: "タグ" });

    await postJson(`/api/tasks/${task.id}/tags`, { tagId: tag.id });

    const res = await postJson(`/api/tasks/${task.id}/tags`, { tagId: tag.id });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.tags).toHaveLength(1);
  });
});

describe("DELETE /api/tasks/:id/tags/:tagId", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/tasks/:id/tags/:tagId");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/tasks/:id/tags/:tagId");
  });

  it("タスクからタグを削除できる", async () => {
    const task = await taskStore.create({ title: "マグロ" });
    const tag = await tagStore.create({ name: "削除対象タグ" });
    await tagStore.addToTask(task.id, tag.id);

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: "DELETE",
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.message).toEqual("Tag removed from task");
  });

  it("削除後にタグが一覧から消える", async () => {
    const task = await taskStore.create({ title: "サーモン" });
    const tag = await tagStore.create({ name: "タグ" });
    await tagStore.addToTask(task.id, tag.id);

    await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, { method: "DELETE" });

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const json = await res.json();

    expect(json.tags).toEqual([]);
  });

  it("存在しないタスクIDのとき404を返す", async () => {
    const tag = await tagStore.create({ name: "タグ" });

    const res = await app.request(`/api/tasks/nonexistent-id/tags/${tag.id}`, {
      method: "DELETE",
    });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });

  it("タスクに紐づいていないタグを削除しようとすると404を返す", async () => {
    const task = await taskStore.create({ title: "エビ" });
    const tag = await tagStore.create({ name: "タグ" });

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: "DELETE",
    });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Tag not found on this task");
  });
});
