// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { taskStore } from "../../../src/store/taskStore";
import { tagStore } from "../../../src/store/tagStore";
import { userStore } from "../../../src/store/userStore";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/**
 * タスクAPIのレスポンスからタスクを作成するヘルパー
 * @param title - タスク名（寿司ネタ）
 * @param options - 追加オプション
 * @returns 作成されたタスクのレスポンス
 */
const createTaskViaApi = async (
  title: string,
  options: Record<string, unknown> = {}
) => {
  const res = await app.request("/api/tasks", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ title, ...options }),
  });
  return res;
};

/**
 * タグをAPIで作成するヘルパー
 * @param name - タグ名
 * @returns 作成されたタグのレスポンス
 */
const createTagViaApi = async (name: string) => {
  const res = await app.request("/api/tags", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name }),
  });
  return res;
};

describe("GET /api/tasks", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks");
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タスクが空の時は空配列を返すんやで", async () => {
    const res = await app.request("/api/tasks");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json).toEqual({ tasks: [] });
  });

  it("全タスクをちゃんと取得できるんやで", async () => {
    await createTaskViaApi("マグロ");
    await createTaskViaApi("サーモン");

    const res = await app.request("/api/tasks");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(2);
  });

  it("statusフィルターで絞り込めるねん", async () => {
    await createTaskViaApi("マグロ", { status: "todo" });
    await createTaskViaApi("サーモン", { status: "in_progress" });
    await createTaskViaApi("エビ", { status: "done" });

    const res = await app.request("/api/tasks?status=todo");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("マグロ");
  });

  it("存在しないstatusで絞ったら空配列になるんやで", async () => {
    await createTaskViaApi("マグロ");

    const res = await app.request("/api/tasks?status=unknown");
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

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("IDを指定してタスクを取得できるんやで", async () => {
    const createRes = await createTaskViaApi("イカ");
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.task.title).toEqual("イカ");
    expect(json.task.id).toEqual(created.task.id);
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000"
    );
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });
});

describe("POST /api/tasks", () => {
  beforeAll(() => {
    console.log("[START] POST /api/tasks");
  });

  afterAll(() => {
    console.log("[END] POST /api/tasks");
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タスクが正しく作成されるんやで", async () => {
    const res = await createTaskViaApi("タマゴ");
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.task.title).toEqual("タマゴ");
    expect(json.task.status).toEqual("todo");
    expect(json.task.description).toEqual("");
    expect(json.task.id).toBeDefined();
    expect(json.task.createdAt).toBeDefined();
    expect(json.task.updatedAt).toBeDefined();
  });

  it("descriptionとstatus付きで作成できるんやで", async () => {
    const res = await createTaskViaApi("ウニ", {
      description: "極上のウニや",
      status: "in_progress",
    });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.task.title).toEqual("ウニ");
    expect(json.task.description).toEqual("極上のウニや");
    expect(json.task.status).toEqual("in_progress");
  });

  it("titleがないと400返すっちゅうねん", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Title is required");
  });

  it("不正なstatusやったら400になるんやで", async () => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title: "イクラ", status: "invalid_status" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Invalid status");
  });

  it("サロゲートペア文字を含むタイトルで作成できるんやで", async () => {
    const res = await createTaskViaApi("森鷗外");
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.task.title).toEqual("森鷗外");
  });
});

describe("PUT /api/tasks/:id", () => {
  beforeAll(() => {
    console.log("[START] PUT /api/tasks/:id");
  });

  afterAll(() => {
    console.log("[END] PUT /api/tasks/:id");
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タスクのtitleを更新できるんやで", async () => {
    const createRes = await createTaskViaApi("アナゴ");
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title: "ホタテ" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.task.title).toEqual("ホタテ");
  });

  it("タスクのstatusを更新できるんやで", async () => {
    const createRes = await createTaskViaApi("カンパチ");
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: "done" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.task.status).toEqual("done");
  });

  it("不正なstatusやったら400になるんやで", async () => {
    const createRes = await createTaskViaApi("マグロ");
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: "invalid" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Invalid status");
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000",
      {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title: "サーモン" }),
      }
    );
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });

  it("サロゲートペア文字を含むタイトルに更新できるんやで", async () => {
    const createRes = await createTaskViaApi("エビ");
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title: "森鷗外" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.task.title).toEqual("森鷗外");
  });
});

describe("DELETE /api/tasks/:id", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/tasks/:id");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/tasks/:id");
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タスクを削除できるんやで", async () => {
    const createRes = await createTaskViaApi("マグロ");
    const created = await createRes.json();

    const res = await app.request(`/api/tasks/${created.task.id}`, {
      method: "DELETE",
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.message).toEqual("Task deleted");

    const getRes = await app.request(`/api/tasks/${created.task.id}`);
    expect(getRes.status).toEqual(404);
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000",
      {
        method: "DELETE",
      }
    );
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

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タイトルでタスクを検索できるんやで", async () => {
    await createTaskViaApi("マグロ");
    await createTaskViaApi("サーモン");

    const res = await app.request("/api/tasks/search?q=マグロ");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("マグロ");
  });

  it("descriptionでも検索できるんやで", async () => {
    await createTaskViaApi("イカ", { description: "新鮮なイカの刺身" });
    await createTaskViaApi("タマゴ", { description: "ふわふわのタマゴ" });

    const res = await app.request("/api/tasks/search?q=刺身");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("イカ");
  });

  it("大文字小文字を区別せず検索できるんやで", async () => {
    await createTaskViaApi("TestTask", { description: "testing" });

    const res = await app.request("/api/tasks/search?q=testtask");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
  });

  it("qパラメータがないと400返すっちゅうねん", async () => {
    const res = await app.request("/api/tasks/search");
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("Query parameter 'q' is required");
  });

  it("該当なしやったら空配列返すんやで", async () => {
    await createTaskViaApi("マグロ");

    const res = await app.request("/api/tasks/search?q=存在しない");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toEqual([]);
  });

  it("サロゲートペア文字で検索できるんやで", async () => {
    await createTaskViaApi("森鷗外");

    const res = await app.request("/api/tasks/search?q=森鷗外");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("森鷗外");
  });
});

describe("GET /api/tasks/stats", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks/stats");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks/stats");
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タスクがない時の統計情報を返すんやで", async () => {
    const res = await app.request("/api/tasks/stats");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json).toEqual({
      total: 0,
      byStatus: {
        todo: 0,
        in_progress: 0,
        done: 0,
      },
    });
  });

  it("ステータス別にカウントできるんやで", async () => {
    await createTaskViaApi("マグロ", { status: "todo" });
    await createTaskViaApi("サーモン", { status: "todo" });
    await createTaskViaApi("エビ", { status: "in_progress" });
    await createTaskViaApi("イカ", { status: "done" });

    const res = await app.request("/api/tasks/stats");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json).toEqual({
      total: 4,
      byStatus: {
        todo: 2,
        in_progress: 1,
        done: 1,
      },
    });
  });
});

describe("GET /api/tasks/:id/tags", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks/:id/tags");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks/:id/tags");
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タスクに紐づくタグ一覧を取得できるんやで", async () => {
    const taskRes = await createTaskViaApi("マグロ");
    const task = (await taskRes.json()).task;

    const tagRes = await createTagViaApi("重要");
    const tag = (await tagRes.json()).tag;

    await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ tagId: tag.id }),
    });

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tags).toHaveLength(1);
    expect(json.tags[0].name).toEqual("重要");
  });

  it("タグがない時は空配列を返すんやで", async () => {
    const taskRes = await createTaskViaApi("サーモン");
    const task = (await taskRes.json()).task;

    const res = await app.request(`/api/tasks/${task.id}/tags`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tags).toEqual([]);
  });

  it("存在しないタスクIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000/tags"
    );
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

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タスクにタグを追加できるんやで", async () => {
    const taskRes = await createTaskViaApi("エビ");
    const task = (await taskRes.json()).task;

    const tagRes = await createTagViaApi("緊急");
    const tag = (await tagRes.json()).tag;

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ tagId: tag.id }),
    });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.tags).toHaveLength(1);
    expect(json.tags[0].name).toEqual("緊急");
  });

  it("tagIdがないと400返すっちゅうねん", async () => {
    const taskRes = await createTaskViaApi("イカ");
    const task = (await taskRes.json()).task;

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toEqual("tagId is required");
  });

  it("存在しないタスクIDやったら404返すねん", async () => {
    const tagRes = await createTagViaApi("バグ");
    const tag = (await tagRes.json()).tag;

    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000/tags",
      {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ tagId: tag.id }),
      }
    );
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });

  it("存在しないタグIDやったら404返すねん", async () => {
    const taskRes = await createTaskViaApi("タマゴ");
    const task = (await taskRes.json()).task;

    const res = await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ tagId: "00000000-0000-0000-0000-000000000000" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Tag not found");
  });
});

describe("DELETE /api/tasks/:id/tags/:tagId", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/tasks/:id/tags/:tagId");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/tasks/:id/tags/:tagId");
  });

  beforeEach(async () => {
    await tagStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  it("タスクからタグを削除できるんやで", async () => {
    const taskRes = await createTaskViaApi("ウニ");
    const task = (await taskRes.json()).task;

    const tagRes = await createTagViaApi("完了");
    const tag = (await tagRes.json()).tag;

    await app.request(`/api/tasks/${task.id}/tags`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ tagId: tag.id }),
    });

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: "DELETE",
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.message).toEqual("Tag removed from task");
  });

  it("存在しないタスクIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tasks/00000000-0000-0000-0000-000000000000/tags/00000000-0000-0000-0000-000000000000",
      {
        method: "DELETE",
      }
    );
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Task not found");
  });

  it("タスクに紐づいてないタグやったら404返すねん", async () => {
    const taskRes = await createTaskViaApi("イクラ");
    const task = (await taskRes.json()).task;

    const tagRes = await createTagViaApi("未使用タグ");
    const tag = (await tagRes.json()).tag;

    const res = await app.request(`/api/tasks/${task.id}/tags/${tag.id}`, {
      method: "DELETE",
    });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toEqual("Tag not found on this task");
  });
});
