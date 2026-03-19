// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { taskStore } from "../../../src/store/taskStore";
import { userStore } from "../../../src/store/userStore";

describe("DELETE /api/tasks/:taskId/comments/:commentId", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/tasks/:taskId/comments/:commentId");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/tasks/:taskId/comments/:commentId");
  });

  beforeEach(async () => {
    await commentStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  describe("正常系", () => {
    it("コメントが正しく削除されるんやで", async () => {
      const task = await taskStore.create({ title: "マグロの仕入れ" });
      const createRes = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "サーモンについてのコメント" }),
      });
      const createBody = await createRes.json();
      const commentId = createBody.comment.id;

      const res = await app.request(`/api/tasks/${task.id}/comments/${commentId}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.message).toEqual("Comment deleted");

      const listRes = await app.request(`/api/tasks/${task.id}/comments`);
      const listBody = await listRes.json();
      expect(listBody.comments).toEqual([]);
    });
  });

  describe("異常系", () => {
    it("存在しないコメントやったら404返すねん", async () => {
      const task = await taskStore.create({ title: "エビの仕入れ" });
      const fakeCommentId = "00000000-0000-0000-0000-000000000000";

      const res = await app.request(`/api/tasks/${task.id}/comments/${fakeCommentId}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Comment not found");
    });
  });

  describe("境界値", () => {
    it("森鷗外を含むコメントが正しく削除できるんやで", async () => {
      const task = await taskStore.create({ title: "イカの仕入れ" });
      const createRes = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "森鷗外の特選ウニ" }),
      });
      const createBody = await createRes.json();
      const commentId = createBody.comment.id;

      const res = await app.request(`/api/tasks/${task.id}/comments/${commentId}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.message).toEqual("Comment deleted");
    });
  });
});
