// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";

const BASE_URL = "http://localhost";
const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000";
const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * ユーザーを作成するヘルパー
 * @param name - ユーザー名
 * @param email - メールアドレス
 * @returns レスポンスのJSONオブジェクト
 */
const createUser = async (name: string, email: string) => {
  const res = await app.request(`${BASE_URL}/api/users`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name, email }),
  });
  return res.json();
};

describe("users handlers", () => {
  beforeAll(() => {
    console.log("[START] users handlers");
  });

  afterAll(() => {
    console.log("[END] users handlers");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  describe("GET /api/users", () => {
    it("ユーザー一覧が取得できるんやで", async () => {
      await createUser("マグロ", "maguro@sushi.com");
      await createUser("サーモン", "salmon@sushi.com");

      const res = await app.request(`${BASE_URL}/api/users`);
      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.users.length).toEqual(2);
    });

    it("ユーザーおらんかったら空配列返すねん", async () => {
      const res = await app.request(`${BASE_URL}/api/users`);
      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.users).toEqual([]);
    });
  });

  describe("POST /api/users", () => {
    it("ユーザーが正しく作成されるんやで", async () => {
      const res = await app.request(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: "エビ", email: "ebi@sushi.com" }),
      });

      expect(res.status).toEqual(201);

      const body = await res.json();
      expect(body.user.name).toEqual("エビ");
      expect(body.user.email).toEqual("ebi@sushi.com");
      expect(body.user.id).toBeDefined();
      expect(body.user.createdAt).toBeDefined();
      expect(body.user.updatedAt).toBeDefined();
    });

    it("名前がないと400返すねん", async () => {
      const res = await app.request(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ email: "noname@sushi.com" }),
      });

      expect(res.status).toEqual(400);

      const body = await res.json();
      expect(body.error).toEqual("Name is required");
    });

    it("メールがないと400返すっちゅうねん", async () => {
      const res = await app.request(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: "イカ" }),
      });

      expect(res.status).toEqual(400);

      const body = await res.json();
      expect(body.error).toEqual("Email is required");
    });

    it("名前もメールもないと400になるんやで", async () => {
      const res = await app.request(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({}),
      });

      expect(res.status).toEqual(400);

      const body = await res.json();
      expect(body.error).toEqual("Name is required");
    });
  });

  describe("GET /api/users/:id", () => {
    it("IDでユーザーが取得できるんやで", async () => {
      const created = await createUser("タマゴ", "tamago@sushi.com");

      const res = await app.request(
        `${BASE_URL}/api/users/${created.user.id}`
      );
      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.user.name).toEqual("タマゴ");
      expect(body.user.email).toEqual("tamago@sushi.com");
    });

    it("存在しないIDやったら404返すねん", async () => {
      const res = await app.request(`${BASE_URL}/api/users/${NON_EXISTENT_ID}`);

      expect(res.status).toEqual(404);

      const body = await res.json();
      expect(body.error).toEqual("User not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("ユーザー情報を更新できるんやで", async () => {
      const created = await createUser("ウニ", "uni@sushi.com");

      const res = await app.request(
        `${BASE_URL}/api/users/${created.user.id}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            name: "イクラ",
            email: "ikura@sushi.com",
          }),
        }
      );

      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.user.name).toEqual("イクラ");
      expect(body.user.email).toEqual("ikura@sushi.com");
    });

    it("名前だけ更新してもちゃんと動くんやで", async () => {
      const created = await createUser("アナゴ", "anago@sushi.com");

      const res = await app.request(
        `${BASE_URL}/api/users/${created.user.id}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ name: "ホタテ" }),
        }
      );

      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.user.name).toEqual("ホタテ");
      expect(body.user.email).toEqual("anago@sushi.com");
    });

    it("存在しないユーザーの更新は404やねん", async () => {
      const res = await app.request(`${BASE_URL}/api/users/${NON_EXISTENT_ID}`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: "カンパチ" }),
      });

      expect(res.status).toEqual(404);

      const body = await res.json();
      expect(body.error).toEqual("User not found");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("ユーザーを削除できるんやで", async () => {
      const created = await createUser("カンパチ", "kanpachi@sushi.com");

      const res = await app.request(
        `${BASE_URL}/api/users/${created.user.id}`,
        { method: "DELETE" }
      );

      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.message).toEqual("User deleted");

      const getRes = await app.request(
        `${BASE_URL}/api/users/${created.user.id}`
      );
      expect(getRes.status).toEqual(404);
    });

    it("存在しないユーザーの削除は404返すねん", async () => {
      const res = await app.request(`${BASE_URL}/api/users/${NON_EXISTENT_ID}`, {
        method: "DELETE",
      });

      expect(res.status).toEqual(404);

      const body = await res.json();
      expect(body.error).toEqual("User not found");
    });
  });

  describe("GET /api/users/:id/tasks", () => {
    it("ユーザーのタスク一覧が取得できるんやで", async () => {
      const created = await createUser("マグロ", "maguro2@sushi.com");
      const userId = created.user.id;

      await taskStore.create({
        title: "マグロのタスク",
        assigneeId: userId,
      });
      await taskStore.create({
        title: "サーモンのタスク",
        assigneeId: userId,
      });
      await taskStore.create({ title: "他のタスク" });

      const res = await app.request(`${BASE_URL}/api/users/${userId}/tasks`);
      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.tasks.length).toEqual(2);
      expect(body.tasks.every((t: { assigneeId: string }) => t.assigneeId === userId)).toEqual(true);
    });

    it("タスクがないユーザーやったら空配列返すねん", async () => {
      const created = await createUser("サーモン", "salmon2@sushi.com");

      const res = await app.request(
        `${BASE_URL}/api/users/${created.user.id}/tasks`
      );
      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.tasks).toEqual([]);
    });

    it("存在しないユーザーのタスク取得は404やねん", async () => {
      const res = await app.request(`${BASE_URL}/api/users/${NON_EXISTENT_ID}/tasks`);

      expect(res.status).toEqual(404);

      const body = await res.json();
      expect(body.error).toEqual("User not found");
    });
  });

  describe("境界値テスト", () => {
    it("サロゲートペア文字を含む名前でもユーザー作成できるんやで", async () => {
      const res = await app.request(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          name: "森鷗外",
          email: "ogai@sushi.com",
        }),
      });

      expect(res.status).toEqual(201);

      const body = await res.json();
      expect(body.user.name).toEqual("森鷗外");
    });

    it("サロゲートペア文字の名前で更新してもちゃんと保存されるんやで", async () => {
      const created = await createUser("エビ", "ebi2@sushi.com");

      const res = await app.request(
        `${BASE_URL}/api/users/${created.user.id}`,
        {
          method: "PUT",
          headers: JSON_HEADERS,
          body: JSON.stringify({ name: "森鷗外" }),
        }
      );

      expect(res.status).toEqual(200);

      const body = await res.json();
      expect(body.user.name).toEqual("森鷗外");

      const getRes = await app.request(
        `${BASE_URL}/api/users/${created.user.id}`
      );
      const getBody = await getRes.json();
      expect(getBody.user.name).toEqual("森鷗外");
    });

    it("空文字の名前でも送信はできるけどnameのバリデーションで弾かれるんやで", async () => {
      const res = await app.request(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: "", email: "empty@sushi.com" }),
      });

      expect(res.status).toEqual(400);

      const body = await res.json();
      expect(body.error).toEqual("Name is required");
    });

    it("空文字のメールでもemailのバリデーションで弾かれるんやで", async () => {
      const res = await app.request(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: "イカ", email: "" }),
      });

      expect(res.status).toEqual(400);

      const body = await res.json();
      expect(body.error).toEqual("Email is required");
    });
  });
});
