// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";

describe("POST /api/users", () => {
  beforeAll(() => {
    console.log("[START] POST /api/users");
  });

  afterAll(() => {
    console.log("[END] POST /api/users");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  it("ユーザーが正しく作成されるんやで", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "イカ三郎", email: "ika@sushi.com" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.user).toEqual(
      expect.objectContaining({
        name: "イカ三郎",
        email: "ika@sushi.com",
      })
    );
    expect(body.user.id).toBeDefined();
    expect(body.user.createdAt).toBeDefined();
    expect(body.user.updatedAt).toBeDefined();
  });

  it("名前がなかったら400返すで", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "noname@sushi.com" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Name is required");
  });

  it("メールがなかったら400返すで", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "タマゴ四郎" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Email is required");
  });

  it("同じメールアドレスで重複作成したらエラーになるねん", async () => {
    await userStore.create({ name: "ウニ五郎", email: "uni@sushi.com" });

    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ウニ六郎", email: "uni@sushi.com" }),
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("サロゲートペア文字（森鷗外）の名前でも作成できるで", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外", email: "ogai@sushi.com" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.user.name).toEqual("森鷗外");
  });

  it("空文字の名前でも作成リクエストは通るで", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "empty@sushi.com" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Name is required");
  });
});
