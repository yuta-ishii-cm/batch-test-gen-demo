// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";

describe("GET /api/users/:id/tasks", () => {
  beforeAll(() => {
    console.log("[START] GET /api/users/:id/tasks");
  });

  afterAll(() => {
    console.log("[END] GET /api/users/:id/tasks");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  it("ユーザーに紐づくタスク一覧を取得できるんやで", async () => {
    const user = await userStore.create({ name: "マグロ太郎", email: "maguro@sushi.com" });
    await taskStore.create({ title: "寿司を握る", assigneeId: user.id });
    await taskStore.create({ title: "ネタを仕入れる", assigneeId: user.id });

    const res = await app.request(`/api/users/${user.id}/tasks`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(2);
  });

  it("タスクが割り当てられてないユーザーは空配列を返すで", async () => {
    const user = await userStore.create({ name: "サーモン花子", email: "salmon@sushi.com" });

    const res = await app.request(`/api/users/${user.id}/tasks`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks).toEqual([]);
  });

  it("他のユーザーのタスクは含まれへんで", async () => {
    const user1 = await userStore.create({ name: "エビ次郎", email: "ebi@sushi.com" });
    const user2 = await userStore.create({ name: "イカ三郎", email: "ika@sushi.com" });
    await taskStore.create({ title: "エビの仕込み", assigneeId: user1.id });
    await taskStore.create({ title: "イカの仕込み", assigneeId: user2.id });

    const res = await app.request(`/api/users/${user1.id}/tasks`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
    expect(body.tasks[0].title).toEqual("エビの仕込み");
  });

  it("存在しないユーザーIDやったら404返すねん", async () => {
    const res = await app.request("/api/users/00000000-0000-0000-0000-000000000000/tasks");
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("User not found");
  });

  it("サロゲートペア文字（森鷗外）のユーザーのタスクも取得できるで", async () => {
    const user = await userStore.create({ name: "森鷗外", email: "ogai@sushi.com" });
    await taskStore.create({ title: "原稿を書く", assigneeId: user.id });

    const res = await app.request(`/api/users/${user.id}/tasks`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tasks.length).toEqual(1);
    expect(body.tasks[0].title).toEqual("原稿を書く");
  });
});
