// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { taskStore } from "../../../src/store/taskStore";
import { userStore } from "../../../src/store/userStore";

describe("GET /api/tasks/:taskId/comments", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tasks/:taskId/comments");
  });

  afterAll(() => {
    console.log("[END] GET /api/tasks/:taskId/comments");
  });

  beforeEach(async () => {
    await commentStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  describe("正常系", () => {
    it("タスクのコメント一覧が取得できるんやで", async () => {
      const user = await userStore.create({ name: "マグロ職人", email: "maguro@sushi.com" });
      const task = await taskStore.create({ title: "マグロの仕入れ" });
      await commentStore.create(task.id, { content: "マグロについてのコメント", authorId: user.id });
      await commentStore.create(task.id, { content: "サーモンについてのコメント", authorId: user.id });

      const res = await app.request(`/api/tasks/${task.id}/comments`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.comments).toHaveLength(2);
    });

    it("コメントがないタスクやったら空配列返すんやで", async () => {
      const task = await taskStore.create({ title: "エビの仕入れ" });

      const res = await app.request(`/api/tasks/${task.id}/comments`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.comments).toEqual([]);
    });
  });

  describe("異常系", () => {
    it("存在しないタスクやったら404返すねん", async () => {
      const fakeTaskId = "00000000-0000-0000-0000-000000000000";

      const res = await app.request(`/api/tasks/${fakeTaskId}/comments`);
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Task not found");
    });
  });

  describe("境界値", () => {
    it("森鷗外を含むコメントが正しく取得できるんやで", async () => {
      const user = await userStore.create({ name: "森鷗外", email: "ogai@sushi.com" });
      const task = await taskStore.create({ title: "イカの仕入れ" });

      const createRes = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "森鷗外が注文したウニ", authorId: user.id }),
      });
      expect(createRes.status).toEqual(201);

      const res = await app.request(`/api/tasks/${task.id}/comments`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.comments).toHaveLength(1);
      expect(body.comments[0].content).toEqual("森鷗外が注文したウニ");
    });
  });
});
