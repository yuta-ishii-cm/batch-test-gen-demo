// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { commentStore } from "../../src/store/commentStore";
import { taskStore } from "../../src/store/taskStore";

describe("Comments Handlers", () => {
  beforeAll(() => {
    console.log("[START] Comments Handlers");
  });

  afterAll(() => {
    console.log("[END] Comments Handlers");
  });

  beforeEach(async () => {
    await commentStore.reset();
    await taskStore.reset();
  });

  /**
   * テスト用のタスクを作成するヘルパー
   * @param title - タスク名（寿司ネタ）
   * @returns 作成されたタスクのレスポンス
   */
  const createTask = async (title = "マグロ") => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    return data.task;
  };

  /**
   * テスト用のコメントを作成するヘルパー
   * @param taskId - タスクID
   * @param content - コメント内容
   * @param authorId - 作成者ID（任意）
   * @returns 作成されたコメントのレスポンス
   */
  const createComment = async (
    taskId: string,
    content = "テストコメント",
    authorId?: string
  ) => {
    const body: Record<string, string> = { content };
    if (authorId) {
      body.authorId = authorId;
    }
    const res = await app.request(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  };

  describe("GET /api/tasks/:taskId/comments", () => {
    it("タスクのコメント一覧が取得できるんやで", async () => {
      const task = await createTask();
      await createComment(task.id, "サーモンについてのコメント");
      await createComment(task.id, "エビについてのコメント");

      const res = await app.request(`/api/tasks/${task.id}/comments`);
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.comments.length).toEqual(2);
    });

    it("コメントがないタスクやったら空配列返すねん", async () => {
      const task = await createTask("サーモン");

      const res = await app.request(`/api/tasks/${task.id}/comments`);
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.comments).toEqual([]);
    });

    it("タスクが存在せんかったら404返すねん", async () => {
      const res = await app.request(
        "/api/tasks/00000000-0000-0000-0000-000000000000/comments"
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Task not found");
    });
  });

  describe("POST /api/tasks/:taskId/comments", () => {
    it("コメントが正しく作成されるんやで", async () => {
      const task = await createTask("エビ");

      const res = await createComment(task.id, "ナイスなタスクやな");
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.comment.content).toEqual("ナイスなタスクやな");
      expect(data.comment.taskId).toEqual(task.id);
    });

    it("authorIdつけてコメント作れるんやで", async () => {
      const task = await createTask("イカ");
      const authorId = "user-123";

      const res = await createComment(task.id, "イカしたコメント", authorId);
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.comment.content).toEqual("イカしたコメント");
      expect(data.comment.authorId).toEqual(authorId);
    });

    it("contentが空やったら400返すねん", async () => {
      const task = await createTask("タマゴ");

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Content is required");
    });

    it("タスクが存在せんかったら404返すねん", async () => {
      const res = await app.request(
        "/api/tasks/00000000-0000-0000-0000-000000000000/comments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "存在せんタスクへのコメント" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Task not found");
    });
  });

  describe("DELETE /api/tasks/:taskId/comments/:commentId", () => {
    it("コメントが正しく削除されるんやで", async () => {
      const task = await createTask("ウニ");
      const createRes = await createComment(task.id, "消されるコメント");
      const createData = await createRes.json();
      const commentId = createData.comment.id;

      const res = await app.request(
        `/api/tasks/${task.id}/comments/${commentId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.message).toEqual("Comment deleted");
    });

    it("コメントが見つからんかったら404返すねん", async () => {
      const task = await createTask("イクラ");

      const res = await app.request(
        `/api/tasks/${task.id}/comments/00000000-0000-0000-0000-000000000000`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Comment not found");
    });
  });

  describe("境界値テスト", () => {
    it("森鷗外の名前がコメントに含まれても正しく処理されるんやで", async () => {
      const task = await createTask("ホタテ");

      const res = await createComment(task.id, "森鷗外の舞姫を読んだ感想");
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.comment.content).toEqual("森鷗外の舞姫を読んだ感想");
    });

    it("空文字のcontentやったら400返すねん", async () => {
      const task = await createTask("カンパチ");

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Content is required");
    });
  });
});
