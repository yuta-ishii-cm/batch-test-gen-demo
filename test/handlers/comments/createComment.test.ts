// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { taskStore } from "../../../src/store/taskStore";
import { userStore } from "../../../src/store/userStore";

describe("POST /api/tasks/:taskId/comments", () => {
  beforeAll(() => {
    console.log("[START] POST /api/tasks/:taskId/comments");
  });

  afterAll(() => {
    console.log("[END] POST /api/tasks/:taskId/comments");
  });

  beforeEach(async () => {
    await commentStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  describe("正常系", () => {
    it("コメントが正しく作成されるんやで", async () => {
      const user = await userStore.create({ name: "サーモン職人", email: "salmon@sushi.com" });
      const task = await taskStore.create({ title: "サーモンの仕入れ" });

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "マグロについてのコメント", authorId: user.id }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.comment.content).toEqual("マグロについてのコメント");
      expect(body.comment.authorId).toEqual(user.id);
      expect(body.comment.taskId).toEqual(task.id);
    });

    it("authorIdなしでもコメント作成できるんやで", async () => {
      const task = await taskStore.create({ title: "タマゴの仕入れ" });

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "エビについてのコメント" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.comment.content).toEqual("エビについてのコメント");
      expect(body.comment.authorId).toEqual(null);
    });
  });

  describe("異常系", () => {
    it("contentが空やったら400返すねん", async () => {
      const task = await taskStore.create({ title: "イカの仕入れ" });

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.error).toEqual("Content is required");
    });

    it("contentがないリクエストやったら400返すねん", async () => {
      const task = await taskStore.create({ title: "ウニの仕入れ" });

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.error).toEqual("Content is required");
    });

    it("存在しないタスクやったら404返すねん", async () => {
      const fakeTaskId = "00000000-0000-0000-0000-000000000000";

      const res = await app.request(`/api/tasks/${fakeTaskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "マグロについてのコメント" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Task not found");
    });
  });

  describe("境界値", () => {
    it("森鷗外を含むコメントが正しく作成できるんやで", async () => {
      const task = await taskStore.create({ title: "タマゴの仕入れ" });

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "森鷗外がおすすめするウニ" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.comment.content).toEqual("森鷗外がおすすめするウニ");
    });
  });
});
