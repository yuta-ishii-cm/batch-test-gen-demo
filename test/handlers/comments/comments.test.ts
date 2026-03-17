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

describe("POST /api/tasks/:taskId/comments", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: コメントを作成できる", async () => {
    const task = await taskStore.create({ title: "テストタスク" });

    const res = await app.request(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "テストコメント" }),
    });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { comment: { content: string; taskId: string; authorId: string | null } };
    expect(json.comment.content).toEqual("テストコメント");
    expect(json.comment.taskId).toEqual(task.id);
    expect(json.comment.authorId).toEqual(null);
  });

  it("正常系: authorId付きでコメントを作成できる", async () => {
    const user = await userStore.create({ name: "テストユーザー", email: "test@example.com" });
    const task = await taskStore.create({ title: "テストタスク" });

    const res = await app.request(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "著者付きコメント", authorId: user.id }),
    });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { comment: { content: string; authorId: string } };
    expect(json.comment.content).toEqual("著者付きコメント");
    expect(json.comment.authorId).toEqual(user.id);
  });

  it("異常系: contentが未指定の場合400エラー", async () => {
    const task = await taskStore.create({ title: "テストタスク" });

    const res = await app.request(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Content is required");
  });

  it("異常系: 存在しないタスクIDの場合404エラー", async () => {
    const fakeTaskId = "00000000-0000-0000-0000-000000000000";

    const res = await app.request(`/api/tasks/${fakeTaskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "コメント" }),
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Task not found");
  });
});

describe("GET /api/tasks/:taskId/comments", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: コメントが0件の場合、空配列を返す", async () => {
    const task = await taskStore.create({ title: "テストタスク" });

    const res = await app.request(`/api/tasks/${task.id}/comments`);

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { comments: unknown[] };
    expect(json.comments).toEqual([]);
  });

  it("正常系: タスクに紐づくコメント一覧を取得できる", async () => {
    const task = await taskStore.create({ title: "テストタスク" });
    await commentStore.create(task.id, { content: "コメント1" });
    await commentStore.create(task.id, { content: "コメント2" });

    const res = await app.request(`/api/tasks/${task.id}/comments`);

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { comments: { content: string }[] };
    expect(json.comments.length).toEqual(2);
    const contents = json.comments.map((c) => c.content).sort();
    expect(contents).toEqual(["コメント1", "コメント2"]);
  });

  it("異常系: 存在しないタスクIDの場合404エラー", async () => {
    const fakeTaskId = "00000000-0000-0000-0000-000000000000";

    const res = await app.request(`/api/tasks/${fakeTaskId}/comments`);

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Task not found");
  });
});

describe("DELETE /api/tasks/:taskId/comments/:commentId", () => {
  beforeEach(async () => {
    await resetAllStores();
  });

  it("正常系: コメントを削除できる", async () => {
    const task = await taskStore.create({ title: "テストタスク" });
    const comment = await commentStore.create(task.id, { content: "削除対象" });

    const res = await app.request(`/api/tasks/${task.id}/comments/${comment.id}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { message: string };
    expect(json.message).toEqual("Comment deleted");

    const remaining = await commentStore.getByTaskId(task.id);
    expect(remaining.length).toEqual(0);
  });

  it("異常系: 存在しないコメントIDの場合404エラー", async () => {
    const task = await taskStore.create({ title: "テストタスク" });
    const fakeCommentId = "00000000-0000-0000-0000-000000000000";

    const res = await app.request(`/api/tasks/${task.id}/comments/${fakeCommentId}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Comment not found");
  });
});
