// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { commentStore } from "../../src/store/commentStore";
import { taskStore } from "../../src/store/taskStore";
import { userStore } from "../../src/store/userStore";

const NULL_UUID = "00000000-0000-0000-0000-000000000000";

beforeEach(async () => {
  await commentStore.reset();
  await taskStore.reset();
  await userStore.reset();
});

/** タスクを作成してIDを返すヘルパー */
const createTask = async (title = "マグロ"): Promise<string> => {
  const res = await app.request("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const json = await res.json();
  return json.task.id;
};

describe("GET /api/tasks/:taskId/comments", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks/:taskId/comments");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks/:taskId/comments");
  });

  it("コメントが存在しない場合は空配列を返す", async () => {
    const taskId = await createTask();

    const res = await app.request(`/api/tasks/${taskId}/comments`);

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.comments).toEqual([]);
  });

  it("タスクのコメント一覧を取得できる", async () => {
    const taskId = await createTask("サーモン");

    await commentStore.create(taskId, { content: "コメント1" });
    await commentStore.create(taskId, { content: "コメント2" });

    const res = await app.request(`/api/tasks/${taskId}/comments`);

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.comments.length).toEqual(2);
  });

  it("コメントのフィールドが正しく返される", async () => {
    const taskId = await createTask("エビ");

    await commentStore.create(taskId, { content: "テストコメント" });

    const res = await app.request(`/api/tasks/${taskId}/comments`);

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.comments[0].content).toEqual("テストコメント");
    expect(json.comments[0].taskId).toEqual(taskId);
    expect(json.comments[0].id).toBeTruthy();
    expect(json.comments[0].createdAt).toBeTruthy();
  });

  it("他のタスクのコメントは含まれない", async () => {
    const taskId1 = await createTask("イカ");
    const taskId2 = await createTask("タマゴ");

    await commentStore.create(taskId1, { content: "タスク1のコメント" });
    await commentStore.create(taskId2, { content: "タスク2のコメント" });

    const res = await app.request(`/api/tasks/${taskId1}/comments`);

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.comments.length).toEqual(1);
    expect(json.comments[0].content).toEqual("タスク1のコメント");
  });

  it("存在しないタスクIDの場合は404を返す", async () => {
    const res = await app.request(`/api/tasks/${NULL_UUID}/comments`);

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Task not found");
  });
});

describe("POST /api/tasks/:taskId/comments", () => {
  beforeAll(() => {
    console.log("[START] POST /api/tasks/:taskId/comments");
  });

  afterAll(() => {
    console.log("[END] POST /api/tasks/:taskId/comments");
  });

  it("コメントを作成できる", async () => {
    const taskId = await createTask("ウニ");

    const res = await app.request(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "テストコメント" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.comment.content).toEqual("テストコメント");
  });

  it("authorIdを指定してコメントを作成できる", async () => {
    const taskId = await createTask("イクラ");
    const user = await userStore.create({ name: "テストユーザー", email: "test@example.com" });

    const res = await app.request(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "作者付きコメント", authorId: user.id }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.comment.content).toEqual("作者付きコメント");
    expect(json.comment.authorId).toEqual(user.id);
  });

  it("authorIdを省略してもコメントを作成できる", async () => {
    const taskId = await createTask("アナゴ");

    const res = await app.request(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "匿名コメント" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.comment.authorId).toBeNull();
  });

  it("作成されたコメントのフィールドが正しく返される", async () => {
    const taskId = await createTask("ホタテ");

    const res = await app.request(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "フィールド確認コメント" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.comment.taskId).toEqual(taskId);
    expect(json.comment.id).toBeTruthy();
    expect(json.comment.createdAt).toBeTruthy();
    expect(json.comment.updatedAt).toBeTruthy();
  });

  it("contentなしの場合は400を返す", async () => {
    const taskId = await createTask("カンパチ");

    const res = await app.request(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toEqual(400);
    const json = await res.json();
    expect(json.error).toEqual("Content is required");
  });

  it("存在しないタスクIDの場合は404を返す", async () => {
    const res = await app.request(`/api/tasks/${NULL_UUID}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "テストコメント" }),
    });

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Task not found");
  });

  it("サロゲートペアを含むcontentでコメントを作成できる（森鷗外）", async () => {
    const taskId = await createTask();

    const res = await app.request(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "森鷗外についてのコメント" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.comment.content).toEqual("森鷗外についてのコメント");
  });
});

describe("DELETE /api/tasks/:taskId/comments/:commentId", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/tasks/:taskId/comments/:commentId");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/tasks/:taskId/comments/:commentId");
  });

  it("コメントを削除できる", async () => {
    const taskId = await createTask("サーモン");
    const comment = await commentStore.create(taskId, { content: "削除対象コメント" });

    const res = await app.request(`/api/tasks/${taskId}/comments/${comment.id}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.message).toEqual("Comment deleted");
  });

  it("削除後にコメント一覧から消える", async () => {
    const taskId = await createTask("エビ");
    const comment = await commentStore.create(taskId, { content: "削除されるコメント" });

    await app.request(`/api/tasks/${taskId}/comments/${comment.id}`, {
      method: "DELETE",
    });

    const res = await app.request(`/api/tasks/${taskId}/comments`);
    const json = await res.json();
    expect(json.comments.length).toEqual(0);
  });

  it("存在しないコメントIDの場合は404を返す", async () => {
    const taskId = await createTask("イカ");

    const res = await app.request(`/api/tasks/${taskId}/comments/${NULL_UUID}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Comment not found");
  });
});
