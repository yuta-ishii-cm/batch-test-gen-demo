// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { taskStore } from "../../../src/store/taskStore";
import { userStore } from "../../../src/store/userStore";
import type { Task } from "../../../src/types/task";
import type { Comment } from "../../../src/types/comment";
import type { User } from "../../../src/types/user";

const JSON_HEADERS = { "Content-Type": "application/json" };
const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * タスクを作成するヘルパー
 * @param title - タスク名（寿司ネタ）
 * @returns 作成されたタスクのレスポンス
 */
const createTask = async (title: string): Promise<Task> => {
  const res = await app.request("/api/tasks", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ title }),
  });
  const json = (await res.json()) as { task: Task };
  return json.task;
};

/**
 * コメントを作成するヘルパー
 * @param taskId - タスクID
 * @param content - コメント本文
 * @param authorId - 投稿者ID（省略可）
 * @returns 作成されたコメントのレスポンス
 */
const createComment = async (
  taskId: string,
  content: string,
  authorId?: string
): Promise<Comment> => {
  const body: Record<string, string> = { content };
  if (authorId) {
    body.authorId = authorId;
  }
  const res = await app.request(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { comment: Comment };
  return json.comment;
};

describe("Comments API", () => {
  beforeAll(() => {
    console.log("[START] Comments API");
  });

  afterAll(() => {
    console.log("[END] Comments API");
  });

  beforeEach(async () => {
    await commentStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  describe("GET /api/tasks/:taskId/comments", () => {
    beforeAll(() => {
      console.log("[START] GET /api/tasks/:taskId/comments");
    });

    afterAll(() => {
      console.log("[END] GET /api/tasks/:taskId/comments");
    });

    it("コメントが空の状態でも空配列が返ってくるんやで", async () => {
      const task = await createTask("マグロ");

      const res = await app.request(`/api/tasks/${task.id}/comments`);

      expect(res.status).toEqual(200);
      const json = (await res.json()) as { comments: Comment[] };
      expect(json.comments).toEqual([]);
    });

    it("コメントがちゃんと一覧で取得できるんやで", async () => {
      const task = await createTask("サーモン");
      await createComment(task.id, "美味しそうやな");
      await createComment(task.id, "めっちゃ新鮮やん");

      const res = await app.request(`/api/tasks/${task.id}/comments`);

      expect(res.status).toEqual(200);
      const json = (await res.json()) as { comments: Comment[] };
      expect(json.comments.length).toEqual(2);
    });

    it("存在しないタスクIDやったら404返すねん", async () => {
      const res = await app.request(`/api/tasks/${NON_EXISTENT_UUID}/comments`);

      expect(res.status).toEqual(404);
      const json = (await res.json()) as { error: string };
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

    it("コメントが正しく作成されるんやで", async () => {
      const task = await createTask("エビ");

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ content: "プリプリやな" }),
      });

      expect(res.status).toEqual(201);
      const json = (await res.json()) as { comment: Comment };
      expect(json.comment.content).toEqual("プリプリやな");
      expect(json.comment.taskId).toEqual(task.id);
      expect(json.comment.authorId).toEqual(null);
    });

    it("authorId付きでもコメント作成できるんやで", async () => {
      const task = await createTask("イカ");
      const userRes = await app.request("/api/users", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: "板前さん", email: "itamae@sushi.jp" }),
      });
      const userJson = (await userRes.json()) as { user: User };
      const authorId = userJson.user.id;

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ content: "コリコリや", authorId }),
      });

      expect(res.status).toEqual(201);
      const json = (await res.json()) as { comment: Comment };
      expect(json.comment.content).toEqual("コリコリや");
      expect(json.comment.authorId).toEqual(authorId);
    });

    it("contentが無かったら400でバリデーションエラーになるっちゅうねん", async () => {
      const task = await createTask("タマゴ");

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({}),
      });

      expect(res.status).toEqual(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toEqual("Content is required");
    });

    it("存在しないタスクにコメントしようとしたら404やねん", async () => {

      const res = await app.request(`/api/tasks/${NON_EXISTENT_UUID}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ content: "これは届かへんで" }),
      });

      expect(res.status).toEqual(404);
      const json = (await res.json()) as { error: string };
      expect(json.error).toEqual("Task not found");
    });
  });

  describe("DELETE /api/tasks/:taskId/comments/:commentId", () => {
    beforeAll(() => {
      console.log("[START] DELETE /api/tasks/:taskId/comments/:commentId");
    });

    afterAll(() => {
      console.log("[END] DELETE /api/tasks/:taskId/comments/:commentId");
    });

    it("コメントがちゃんと削除できるんやで", async () => {
      const task = await createTask("ウニ");
      const comment = await createComment(task.id, "濃厚やな");

      const res = await app.request(
        `/api/tasks/${task.id}/comments/${comment.id}`,
        { method: "DELETE" }
      );

      expect(res.status).toEqual(200);
      const json = (await res.json()) as { message: string };
      expect(json.message).toEqual("Comment deleted");

      const listRes = await app.request(`/api/tasks/${task.id}/comments`);
      const listJson = (await listRes.json()) as { comments: Comment[] };
      expect(listJson.comments).toEqual([]);
    });

    it("存在しないコメントID指定したら404返すねん", async () => {
      const task = await createTask("イクラ");
      const res = await app.request(
        `/api/tasks/${task.id}/comments/${NON_EXISTENT_UUID}`,
        { method: "DELETE" }
      );

      expect(res.status).toEqual(404);
      const json = (await res.json()) as { error: string };
      expect(json.error).toEqual("Comment not found");
    });
  });

  describe("境界値テスト", () => {
    beforeAll(() => {
      console.log("[START] 境界値テスト");
    });

    afterAll(() => {
      console.log("[END] 境界値テスト");
    });

    it("空文字のcontentやったら400になるんやで", async () => {
      const task = await createTask("アナゴ");

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ content: "" }),
      });

      expect(res.status).toEqual(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toEqual("Content is required");
    });

    it("サロゲートペア文字（森鷗外）を含むコメントも正しく処理できるんやで", async () => {
      const task = await createTask("ホタテ");

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ content: "森鷗外が注文したホタテ" }),
      });

      expect(res.status).toEqual(201);
      const json = (await res.json()) as { comment: Comment };
      expect(json.comment.content).toEqual("森鷗外が注文したホタテ");
    });

    it("特殊文字を含むコメントも正しく処理できるんやで", async () => {
      const task = await createTask("カンパチ");
      const specialContent = "改行\nタブ\tダブルクォート\"シングルクォート'バックスラッシュ\\";

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ content: specialContent }),
      });

      expect(res.status).toEqual(201);
      const json = (await res.json()) as { comment: Comment };
      expect(json.comment.content).toEqual(specialContent);
    });
  });
});
