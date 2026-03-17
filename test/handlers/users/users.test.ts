// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";

const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * ユーザーを作成するヘルパー関数
 * @param name - ユーザー名
 * @param email - メールアドレス
 * @returns 作成されたユーザーのレスポンス
 */
const createUser = async (name: string, email: string) => {
  const res = await app.request("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  return res;
};

describe("Users API", () => {
  beforeAll(() => {
    console.log("[START] Users API");
  });

  afterAll(() => {
    console.log("[END] Users API");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  describe("GET /api/users", () => {
    beforeAll(() => {
      console.log("[START] GET /api/users");
    });

    afterAll(() => {
      console.log("[END] GET /api/users");
    });

    it("ユーザー一覧が空で返ってくるんやで", async () => {
      const res = await app.request("/api/users");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body).toEqual({ users: [] });
    });

    it("作成したユーザーが一覧に含まれてるんやで", async () => {
      await createUser("田中太郎", "tanaka@example.com");
      await createUser("佐藤花子", "sato@example.com");

      const res = await app.request("/api/users");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.users).toHaveLength(2);
    });
  });

  describe("GET /api/users/:id", () => {
    beforeAll(() => {
      console.log("[START] GET /api/users/:id");
    });

    afterAll(() => {
      console.log("[END] GET /api/users/:id");
    });

    it("IDを指定してユーザーを取得できるんやで", async () => {
      const createRes = await createUser("山田次郎", "yamada@example.com");
      const created = await createRes.json();

      const res = await app.request(`/api/users/${created.user.id}`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.user.name).toEqual("山田次郎");
      expect(body.user.email).toEqual("yamada@example.com");
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request(
        "/api/users/00000000-0000-0000-0000-000000000000"
      );
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body).toEqual({ error: "User not found" });
    });
  });

  describe("POST /api/users", () => {
    beforeAll(() => {
      console.log("[START] POST /api/users");
    });

    afterAll(() => {
      console.log("[END] POST /api/users");
    });

    it("ユーザーが正しく作成されるんやで", async () => {
      const res = await createUser("鈴木三郎", "suzuki@example.com");
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.user.name).toEqual("鈴木三郎");
      expect(body.user.email).toEqual("suzuki@example.com");
      expect(body.user.id).toBeDefined();
      expect(body.user.createdAt).toBeDefined();
      expect(body.user.updatedAt).toBeDefined();
    });

    it("名前がないとバリデーションエラーで400になるっちゅうねん", async () => {
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "noname@example.com" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body).toEqual({ error: "Name is required" });
    });

    it("メールがないとバリデーションエラーで400になるっちゅうねん", async () => {
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "高橋四郎" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body).toEqual({ error: "Email is required" });
    });

    it("空文字の名前やとバリデーションエラーになるんやで", async () => {
      const res = await createUser("", "empty@example.com");
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body).toEqual({ error: "Name is required" });
    });

    it("空文字のメールやとバリデーションエラーになるんやで", async () => {
      const res = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "伊藤五郎", email: "" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body).toEqual({ error: "Email is required" });
    });

    it("サロゲートペア文字を含む名前で正しく作成できるんやで", async () => {
      const res = await createUser("森鷗外", "mori.ogai@example.com");
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.user.name).toEqual("森鷗外");
    });

    it("サロゲートペア文字を含むメールアドレスでも作成できるんやで", async () => {
      const res = await createUser("渡辺六郎", "鷗@example.com");
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.user.email).toEqual("鷗@example.com");
    });
  });

  describe("PUT /api/users/:id", () => {
    beforeAll(() => {
      console.log("[START] PUT /api/users/:id");
    });

    afterAll(() => {
      console.log("[END] PUT /api/users/:id");
    });

    it("ユーザー名を更新できるんやで", async () => {
      const createRes = await createUser("中村七郎", "nakamura@example.com");
      const created = await createRes.json();

      const res = await app.request(`/api/users/${created.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "中村七郎改" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.user.name).toEqual("中村七郎改");
      expect(body.user.email).toEqual("nakamura@example.com");
    });

    it("メールアドレスを更新できるんやで", async () => {
      const createRes = await createUser("小林八郎", "kobayashi@example.com");
      const created = await createRes.json();

      const res = await app.request(`/api/users/${created.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "kobayashi-new@example.com" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.user.email).toEqual("kobayashi-new@example.com");
    });

    it("存在しないIDの更新は404返すねん", async () => {
      const res = await app.request(
        "/api/users/00000000-0000-0000-0000-000000000000",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "誰やねん" }),
        }
      );
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body).toEqual({ error: "User not found" });
    });

    it("サロゲートペア文字に名前を更新できるんやで", async () => {
      const createRes = await createUser("加藤九郎", "kato@example.com");
      const created = await createRes.json();

      const res = await app.request(`/api/users/${created.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.user.name).toEqual("森鷗外");
    });
  });

  describe("DELETE /api/users/:id", () => {
    beforeAll(() => {
      console.log("[START] DELETE /api/users/:id");
    });

    afterAll(() => {
      console.log("[END] DELETE /api/users/:id");
    });

    it("ユーザーを削除できるんやで", async () => {
      const createRes = await createUser("松本十郎", "matsumoto@example.com");
      const created = await createRes.json();

      const res = await app.request(`/api/users/${created.user.id}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body).toEqual({ message: "User deleted" });

      const getRes = await app.request(`/api/users/${created.user.id}`);
      expect(getRes.status).toEqual(404);
    });

    it("存在しないIDの削除は404返すねん", async () => {
      const res = await app.request(
        "/api/users/00000000-0000-0000-0000-000000000000",
        { method: "DELETE" }
      );
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body).toEqual({ error: "User not found" });
    });

    it("ユーザー削除したらタスクのassigneeIdがnullになるんやで", async () => {
      const createRes = await createUser("井上一郎", "inoue@example.com");
      const created = await createRes.json();
      const userId = created.user.id;

      const taskRes = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "マグロ",
          assigneeId: userId,
        }),
      });
      const taskBody = await taskRes.json();
      const taskId = taskBody.task.id;

      await app.request(`/api/users/${userId}`, { method: "DELETE" });

      const updatedTaskRes = await app.request(`/api/tasks/${taskId}`);
      const updatedTask = await updatedTaskRes.json();

      expect(updatedTask.task.assigneeId).toEqual(null);
    });
  });

  describe("GET /api/users/:id/tasks", () => {
    beforeAll(() => {
      console.log("[START] GET /api/users/:id/tasks");
    });

    afterAll(() => {
      console.log("[END] GET /api/users/:id/tasks");
    });

    it("ユーザーに割り当てられたタスク一覧を取得できるんやで", async () => {
      const createRes = await createUser("木村二郎", "kimura@example.com");
      const created = await createRes.json();
      const userId = created.user.id;

      await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "サーモン", assigneeId: userId }),
      });
      await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "エビ", assigneeId: userId }),
      });
      await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "イカ" }),
      });

      const res = await app.request(`/api/users/${userId}/tasks`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.tasks).toHaveLength(2);
      const titles = body.tasks.map(
        (t: { title: string }) => t.title
      );
      expect(titles).toContain("サーモン");
      expect(titles).toContain("エビ");
    });

    it("タスクが割り当てられてへんユーザーやと空配列返すんやで", async () => {
      const createRes = await createUser("林三郎", "hayashi@example.com");
      const created = await createRes.json();

      const res = await app.request(`/api/users/${created.user.id}/tasks`);
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.tasks).toEqual([]);
    });

    it("存在しないユーザーIDやったら404返すねん", async () => {
      const res = await app.request(
        "/api/users/00000000-0000-0000-0000-000000000000/tasks"
      );
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body).toEqual({ error: "User not found" });
    });
  });
});
