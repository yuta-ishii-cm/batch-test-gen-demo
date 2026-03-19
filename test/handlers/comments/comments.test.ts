// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { taskStore } from "../../../src/store/taskStore";
import { userStore } from "../../../src/store/userStore";

const JSON_HEADERS = { "Content-Type": "application/json" };
const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

describe("comments handlers", () => {
  beforeAll(() => {
    console.log("[START] comments handlers");
  });

  afterAll(() => {
    console.log("[END] comments handlers");
  });

  beforeEach(async () => {
    await commentStore.reset();
    await taskStore.reset();
    await userStore.reset();
  });

  /**
   * テスト用のタスクを作成するヘルパー
   * @param title - タスク名
   * @returns 作成されたタスク
   */
  const createTask = async (title: string) => {
    const res = await app.request("/api/tasks", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    return data.task;
  };

  /**
   * テスト用のユーザーを作成するヘルパー
   * @param name - ユーザー名
   * @param email - メールアドレス
   * @returns 作成されたユーザー
   */
  const createUser = async (name: string, email: string) => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    return data.user;
  };

  /**
   * テスト用のコメントを作成するヘルパー
   * @param taskId - タスクID
   * @param content - コメント本文
   * @param authorId - 投稿者ID（省略可）
   * @returns Responseオブジェクト
   */
  const postComment = async (
    taskId: string,
    content: string,
    authorId?: string
  ) => {
    return app.request(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ content, authorId }),
    });
  };

  describe("GET /api/tasks/:taskId/comments", () => {
    it("タスクのコメント一覧が取得できるんやで", async () => {
      const task = await createTask("マグロ");
      const user = await createUser("サーモン職人", "salmon@sushi.com");

      await postComment(task.id, "マグロ最高やな", user.id);
      await postComment(task.id, "サーモンも捨てがたい");

      const res = await app.request(`/api/tasks/${task.id}/comments`);
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.comments.length).toEqual(2);
      expect(data.comments[0].content).toEqual("マグロ最高やな");
      expect(data.comments[0].authorId).toEqual(user.id);
      expect(data.comments[1].content).toEqual("サーモンも捨てがたい");
      expect(data.comments[1].authorId).toEqual(null);
    });

    it("コメントが無いタスクやったら空配列返すねん", async () => {
      const task = await createTask("エビ");

      const res = await app.request(`/api/tasks/${task.id}/comments`);
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.comments).toEqual([]);
    });

    it("存在しないタスクやったら404返すねん", async () => {
      const res = await app.request(
        `/api/tasks/${NON_EXISTENT_UUID}/comments`
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Task not found");
    });
  });

  describe("POST /api/tasks/:taskId/comments", () => {
    it("コメントが正しく作成されるんやで", async () => {
      const task = await createTask("イカ");
      const user = await createUser("ウニ職人", "uni@sushi.com");

      const res = await postComment(
        task.id,
        "イカは新鮮なんが一番やで",
        user.id
      );
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.comment.content).toEqual("イカは新鮮なんが一番やで");
      expect(data.comment.taskId).toEqual(task.id);
      expect(data.comment.authorId).toEqual(user.id);
      expect(data.comment.id).toBeDefined();
      expect(data.comment.createdAt).toBeDefined();
      expect(data.comment.updatedAt).toBeDefined();
    });

    it("authorId無しでも匿名コメントが作成できるんやで", async () => {
      const task = await createTask("タマゴ");

      const res = await postComment(task.id, "タマゴは優しい味やね");
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.comment.content).toEqual("タマゴは優しい味やね");
      expect(data.comment.authorId).toEqual(null);
    });

    it("contentが無かったら400返すっちゅうねん", async () => {
      const task = await createTask("ホタテ");

      const res = await app.request(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ authorId: null }),
      });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Content is required");
    });

    it("存在しないタスクにコメントしようとしたら404やで", async () => {
      const res = await postComment(NON_EXISTENT_UUID, "これはあかんやつや");
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Task not found");
    });

    it("空文字のcontentやったら400返すねん", async () => {
      const task = await createTask("カンパチ");

      const res = await postComment(task.id, "");
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Content is required");
    });

    it("サロゲートペア文字を含むコメントも正しく処理できるんやで", async () => {
      const task = await createTask("アナゴ");

      const res = await postComment(
        task.id,
        "森鷗外も寿司が好きやったらしいで"
      );
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.comment.content).toEqual(
        "森鷗外も寿司が好きやったらしいで"
      );
    });

    it("特殊文字を含むコメントも正しく保存されるんやで", async () => {
      const task = await createTask("イクラ");
      const specialContent =
        "寿司🍣は最高！<script>alert('xss')</script>&amp;";

      const res = await postComment(task.id, specialContent);
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.comment.content).toEqual(specialContent);
    });
  });

  describe("DELETE /api/tasks/:taskId/comments/:commentId", () => {
    it("コメントが正しく削除されるんやで", async () => {
      const task = await createTask("ウニ");

      const createRes = await postComment(
        task.id,
        "ウニは高いけど美味いんや"
      );
      const createData = await createRes.json();
      const commentId = createData.comment.id;

      const res = await app.request(
        `/api/tasks/${task.id}/comments/${commentId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.message).toEqual("Comment deleted");

      const listRes = await app.request(`/api/tasks/${task.id}/comments`);
      const listData = await listRes.json();
      expect(listData.comments).toEqual([]);
    });

    it("存在しないコメントを削除しようとしたら404やで", async () => {
      const task = await createTask("サーモン");

      const res = await app.request(
        `/api/tasks/${task.id}/comments/${NON_EXISTENT_UUID}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Comment not found");
    });
  });
});
