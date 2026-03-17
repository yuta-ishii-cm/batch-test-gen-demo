import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { tagStore } from "../../../src/store/tagStore";
import { milestoneStore } from "../../../src/store/milestoneStore";
import { taskStore } from "../../../src/store/taskStore";
import { projectStore } from "../../../src/store/projectStore";
import { userStore } from "../../../src/store/userStore";

const resetAllStores = async () => {
  await commentStore.reset();
  await tagStore.reset();
  await milestoneStore.reset();
  await taskStore.reset();
  await projectStore.reset();
  await userStore.reset();
};

const createTaskRequest = (body: Record<string, unknown>) =>
  app.request("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const createTaskViaApi = async (title: string) => {
  const res = await createTaskRequest({ title });
  const json = (await res.json()) as { task: { id: string } };
  return json.task;
};

const createTagViaStore = async (name: string) =>
  tagStore.create({ name, color: "#ff0000" });

describe("POST /api/tasks", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: タスクを作成できる", async () => {
    const res = await createTaskRequest({ title: "テストタスク" });
    expect(res.status).toEqual(201);
    const json = (await res.json()) as { task: { title: string; status: string; description: string } };
    expect(json.task.title).toEqual("テストタスク");
    expect(json.task.status).toEqual("todo");
    expect(json.task.description).toEqual("");
  });

  it("正常系: ステータスを指定してタスクを作成できる", async () => {
    const res = await createTaskRequest({ title: "進行中タスク", status: "in_progress" });
    expect(res.status).toEqual(201);
    const json = (await res.json()) as { task: { status: string } };
    expect(json.task.status).toEqual("in_progress");
  });

  it("正常系: descriptionを指定してタスクを作成できる", async () => {
    const res = await createTaskRequest({ title: "詳細付きタスク", description: "タスクの説明" });
    expect(res.status).toEqual(201);
    const json = (await res.json()) as { task: { description: string } };
    expect(json.task.description).toEqual("タスクの説明");
  });

  it("異常系: titleが未指定の場合400を返す", async () => {
    const res = await createTaskRequest({});
    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Title is required");
  });

  it("異常系: 不正なstatusの場合400を返す", async () => {
    const res = await createTaskRequest({ title: "タスク", status: "invalid" });
    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Invalid status");
  });
});

describe("GET /api/tasks", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: タスクが無い場合は空配列を返す", async () => {
    const res = await app.request("/api/tasks");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: unknown[] };
    expect(json.tasks).toEqual([]);
  });

  it("正常系: タスク一覧を取得できる", async () => {
    await createTaskRequest({ title: "タスク1" });
    await createTaskRequest({ title: "タスク2" });

    const res = await app.request("/api/tasks");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: unknown[] };
    expect(json.tasks.length).toEqual(2);
  });

  it("正常系: statusでフィルタリングできる", async () => {
    await createTaskRequest({ title: "TODOタスク", status: "todo" });
    await createTaskRequest({ title: "進行中タスク", status: "in_progress" });
    await createTaskRequest({ title: "完了タスク", status: "done" });

    const res = await app.request("/api/tasks?status=in_progress");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: { title: string }[] };
    expect(json.tasks.length).toEqual(1);
    expect(json.tasks[0].title).toEqual("進行中タスク");
  });
});

describe("GET /api/tasks/:id", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: IDでタスクを取得できる", async () => {
    const createRes = await createTaskRequest({ title: "取得テスト" });
    const created = (await createRes.json()) as { task: { id: string; title: string } };

    const res = await app.request(`/api/tasks/${created.task.id}`);
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { task: { id: string; title: string } };
    expect(json.task.id).toEqual(created.task.id);
    expect(json.task.title).toEqual("取得テスト");
  });

  it("異常系: 存在しないIDの場合404を返す", async () => {
    const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000");
    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Task not found");
  });
});

describe("PUT /api/tasks/:id", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: タスクのtitleを更新できる", async () => {
    const createRes = await createTaskRequest({ title: "更新前" });
    const created = (await createRes.json()) as { task: { id: string } };

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "更新後" }),
    });
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { task: { title: string } };
    expect(json.task.title).toEqual("更新後");
  });

  it("正常系: タスクのstatusを更新できる", async () => {
    const createRes = await createTaskRequest({ title: "ステータス更新" });
    const created = (await createRes.json()) as { task: { id: string } };

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { task: { status: string } };
    expect(json.task.status).toEqual("done");
  });

  it("異常系: 存在しないIDの場合404を返す", async () => {
    const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "更新" }),
    });
    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Task not found");
  });

  it("異常系: 不正なstatusの場合400を返す", async () => {
    const createRes = await createTaskRequest({ title: "ステータス不正" });
    const created = (await createRes.json()) as { task: { id: string } };

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid" }),
    });
    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Invalid status");
  });
});

describe("DELETE /api/tasks/:id", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: タスクを削除できる", async () => {
    const createRes = await createTaskRequest({ title: "削除対象" });
    const created = (await createRes.json()) as { task: { id: string } };

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "DELETE",
    });
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { message: string };
    expect(json.message).toEqual("Task deleted");

    const getRes = await app.request(`/api/tasks/${created.task.id}`);
    expect(getRes.status).toEqual(404);
  });

  it("異常系: 存在しないIDの場合404を返す", async () => {
    const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
    });
    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Task not found");
  });
});

describe("GET /api/tasks/search", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: titleでタスクを検索できる", async () => {
    await createTaskRequest({ title: "検索対象タスク", description: "説明" });
    await createTaskRequest({ title: "別のタスク", description: "他の説明" });

    const res = await app.request("/api/tasks/search?q=検索対象");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: { title: string }[] };
    expect(json.tasks.length).toEqual(1);
    expect(json.tasks[0].title).toEqual("検索対象タスク");
  });

  it("正常系: descriptionでタスクを検索できる", async () => {
    await createTaskRequest({ title: "タスクA", description: "重要な説明文" });
    await createTaskRequest({ title: "タスクB", description: "普通の説明" });

    const res = await app.request("/api/tasks/search?q=重要");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: { title: string }[] };
    expect(json.tasks.length).toEqual(1);
    expect(json.tasks[0].title).toEqual("タスクA");
  });

  it("正常系: 大文字小文字を区別しない検索ができる", async () => {
    await createTaskRequest({ title: "Hello World Task" });

    const res = await app.request("/api/tasks/search?q=hello");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: { title: string }[] };
    expect(json.tasks.length).toEqual(1);
  });

  it("正常系: 一致するタスクが無い場合は空配列を返す", async () => {
    await createTaskRequest({ title: "タスク" });

    const res = await app.request("/api/tasks/search?q=存在しない");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: unknown[] };
    expect(json.tasks).toEqual([]);
  });

  it("異常系: クエリパラメータqが無い場合400を返す", async () => {
    const res = await app.request("/api/tasks/search");
    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Query parameter 'q' is required");
  });
});

describe("GET /api/tasks/stats", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: タスクが無い場合の統計を返す", async () => {
    const res = await app.request("/api/tasks/stats");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { total: number; byStatus: { todo: number; in_progress: number; done: number } };
    expect(json.total).toEqual(0);
    expect(json.byStatus).toEqual({ todo: 0, in_progress: 0, done: 0 });
  });

  it("正常系: 各ステータスのタスク数を正しく集計する", async () => {
    await createTaskRequest({ title: "TODO1", status: "todo" });
    await createTaskRequest({ title: "TODO2", status: "todo" });
    await createTaskRequest({ title: "進行中", status: "in_progress" });
    await createTaskRequest({ title: "完了", status: "done" });

    const res = await app.request("/api/tasks/stats");
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { total: number; byStatus: { todo: number; in_progress: number; done: number } };
    expect(json.total).toEqual(4);
    expect(json.byStatus).toEqual({ todo: 2, in_progress: 1, done: 1 });
  });
});

describe("GET /api/tasks/:id/tags", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: タスクに紐づくタグ一覧を取得できる（空）", async () => {
    const task = await createTaskViaApi("タグテスト");

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tags: unknown[] };
    expect(json.tags).toEqual([]);
  });

  it("正常系: タスクに紐づくタグ一覧を取得できる", async () => {
    const task = await createTaskViaApi("タグ付きタスク");
    const tag = await createTagViaStore("重要");
    await tagStore.addToTask(task.id, tag.id);

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tags: { id: string; name: string }[] };
    expect(json.tags.length).toEqual(1);
    expect(json.tags[0].name).toEqual("重要");
  });

  it("異常系: 存在しないタスクIDの場合404を返す", async () => {
    const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000/tags");
    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Task not found");
  });
});

describe("POST /api/tasks/:id/tags", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: タスクにタグを追加できる", async () => {
    const task = await createTaskViaApi("タグ追加テスト");
    const tag = await createTagViaStore("バグ");

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag.id }),
    });
    expect(res.status).toEqual(201);
    const json = (await res.json()) as { tags: { id: string; name: string }[] };
    expect(json.tags.length).toEqual(1);
    expect(json.tags[0].name).toEqual("バグ");
  });

  it("正常系: 複数タグを追加できる", async () => {
    const task = await createTaskViaApi("複数タグ");
    const tag1 = await createTagViaStore("タグ1");
    const tag2 = await createTagViaStore("タグ2");

    await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag1.id }),
    });

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag2.id }),
    });
    expect(res.status).toEqual(201);
    const json = (await res.json()) as { tags: unknown[] };
    expect(json.tags.length).toEqual(2);
  });

  it("異常系: tagIdが未指定の場合400を返す", async () => {
    const task = await createTaskViaApi("タグID未指定");

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("tagId is required");
  });

  it("異常系: 存在しないタスクIDの場合404を返す", async () => {
    const tag = await createTagViaStore("テスト");

    const res = await app.request("/api/tasks/00000000-0000-0000-0000-000000000000/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag.id }),
    });
    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Task not found");
  });

  it("異常系: 存在しないタグIDの場合404を返す", async () => {
    const task = await createTaskViaApi("タグ不明");

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Tag not found");
  });
});

describe("DELETE /api/tasks/:id/tags/:tagId", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: タスクからタグを削除できる", async () => {
    const task = await createTaskViaApi("タグ削除テスト");
    const tag = await createTagViaStore("削除対象タグ");
    await tagStore.addToTask(task.id, tag.id);

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: "DELETE",
    });
    expect(res.status).toEqual(200);
    const json = (await res.json()) as { message: string };
    expect(json.message).toEqual("Tag removed from task");

    const getRes = await app.request(`/api/tasks/${task.id}/tags`);
    const getTags = (await getRes.json()) as { tags: unknown[] };
    expect(getTags.tags).toEqual([]);
  });

  it("異常系: 存在しないタスクIDの場合404を返す", async () => {
    const tag = await createTagViaStore("テスト");

    const res = await app.request(`/api/tasks/00000000-0000-0000-0000-000000000000/tags/${tag.id}`, {
      method: "DELETE",
    });
    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Task not found");
  });

  it("異常系: タスクに紐づいていないタグIDの場合404を返す", async () => {
    const task = await createTaskViaApi("タグ未紐付け");
    const tag = await createTagViaStore("未紐付けタグ");

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: "DELETE",
    });
    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Tag not found on this task");
  });
});
