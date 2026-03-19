// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { commentStore } from "../../src/store/commentStore";
import { tagStore } from "../../src/store/tagStore";
import { taskStore } from "../../src/store/taskStore";
import { milestoneStore } from "../../src/store/milestoneStore";
import { projectStore } from "../../src/store/projectStore";

const NONEXISTENT_ID = "00000000-0000-0000-0000-000000000000";

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
  await milestoneStore.reset();
  await projectStore.reset();
});

describe("POST /api/projects", () => {
  beforeAll(() => {
    console.log("[START] POST /api/projects");
  });

  afterAll(() => {
    console.log("[END] POST /api/projects");
  });

  it("nameを指定して作成したら201とプロジェクトが返ってくるんやで", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Project" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.project.name).toEqual("Test Project");
    expect(json.project.status).toEqual("active");
    expect(json.project.id).toBeDefined();
    expect(json.project.createdAt).toBeDefined();
    expect(json.project.updatedAt).toBeDefined();
  });

  it("nameとdescriptionを指定してもちゃんと作れるんやで", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Project", description: "説明文" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.project.name).toEqual("My Project");
    expect(json.project.description).toEqual("説明文");
  });

  it("サロゲートペアを含む名前でも作れるっちゅうねん", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外プロジェクト" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(201);
    expect(json.project.name).toEqual("森鷗外プロジェクト");
  });

  it("nameがなかったら400返すねん", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "説明のみ" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toBeDefined();
  });

  it("nameが空文字列やったら400になるで", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toBeDefined();
  });
});

describe("GET /api/projects", () => {
  beforeAll(() => {
    console.log("[START] GET /api/projects");
  });

  afterAll(() => {
    console.log("[END] GET /api/projects");
  });

  it("プロジェクトがなかったら空配列返ってくるんやで", async () => {
    const res = await app.request("/api/projects");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.projects).toEqual([]);
  });

  it("作成したプロジェクトを全件返してくれるねん", async () => {
    await projectStore.create({ name: "Project A" });
    await projectStore.create({ name: "Project B" });

    const res = await app.request("/api/projects");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.projects).toHaveLength(2);
  });

  it("statusクエリでフィルタリングできるんやで", async () => {
    await projectStore.create({ name: "Active Project" });
    const toArchive = await projectStore.create({ name: "Archived Project" });
    await projectStore.update(toArchive.id, { status: "archived" });

    const res = await app.request("/api/projects?status=archived");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.projects).toHaveLength(1);
    expect(json.projects[0].status).toEqual("archived");
  });

  it("存在しないstatusでフィルタリングしたら空配列になるっちゅうねん", async () => {
    await projectStore.create({ name: "Project A" });

    const res = await app.request("/api/projects?status=unknown");
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.projects).toEqual([]);
  });
});

describe("GET /api/projects/:id", () => {
  beforeAll(() => {
    console.log("[START] GET /api/projects/:id");
  });

  afterAll(() => {
    console.log("[END] GET /api/projects/:id");
  });

  it("存在するIDやったらちゃんと取得できるんやで", async () => {
    const created = await projectStore.create({ name: "Target Project" });

    const res = await app.request(`/api/projects/${created.id}`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.project.id).toEqual(created.id);
    expect(json.project.name).toEqual("Target Project");
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(`/api/projects/${NONEXISTENT_ID}`);
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toBeDefined();
  });
});

describe("PUT /api/projects/:id", () => {
  beforeAll(() => {
    console.log("[START] PUT /api/projects/:id");
  });

  afterAll(() => {
    console.log("[END] PUT /api/projects/:id");
  });

  it("nameを更新できるんやで", async () => {
    const created = await projectStore.create({ name: "Old Name" });

    const res = await app.request(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.project.name).toEqual("New Name");
  });

  it("descriptionも更新できるっちゅうねん", async () => {
    const created = await projectStore.create({ name: "Project" });

    const res = await app.request(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "新しい説明" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.project.description).toEqual("新しい説明");
  });

  it("statusをarchivedに更新できるんやで", async () => {
    const created = await projectStore.create({ name: "Project" });

    const res = await app.request(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.project.status).toEqual("archived");
  });

  it("statusをcompletedに更新できるんやで", async () => {
    const created = await projectStore.create({ name: "Project" });

    const res = await app.request(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.project.status).toEqual("completed");
  });

  it("無効なstatusやったら400になるで", async () => {
    const created = await projectStore.create({ name: "Project" });

    const res = await app.request(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid_status" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(400);
    expect(json.error).toBeDefined();
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(`/api/projects/${NONEXISTENT_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toBeDefined();
  });

  it("サロゲートペアを含む名前に更新できるっちゅうねん", async () => {
    const created = await projectStore.create({ name: "Project" });

    const res = await app.request(`/api/projects/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外プロジェクト更新" }),
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.project.name).toEqual("森鷗外プロジェクト更新");
  });
});

describe("DELETE /api/projects/:id", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/projects/:id");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/projects/:id");
  });

  it("存在するプロジェクトを削除できるんやで", async () => {
    const created = await projectStore.create({ name: "To Delete" });

    const res = await app.request(`/api/projects/${created.id}`, {
      method: "DELETE",
    });
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.message).toEqual("Project deleted");
  });

  it("削除後に取得しようとしたら404になるんやで", async () => {
    const created = await projectStore.create({ name: "To Delete" });
    await app.request(`/api/projects/${created.id}`, { method: "DELETE" });

    const res = await app.request(`/api/projects/${created.id}`);
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toBeDefined();
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(`/api/projects/${NONEXISTENT_ID}`, {
      method: "DELETE",
    });
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toBeDefined();
  });
});

describe("GET /api/projects/:id/tasks", () => {
  beforeAll(() => {
    console.log("[START] GET /api/projects/:id/tasks");
  });

  afterAll(() => {
    console.log("[END] GET /api/projects/:id/tasks");
  });

  it("プロジェクトに属するタスクを返してくれるんやで", async () => {
    const project = await projectStore.create({ name: "Project With Tasks" });
    await taskStore.create({ title: "マグロ", projectId: project.id });
    await taskStore.create({ title: "サーモン", projectId: project.id });

    const res = await app.request(`/api/projects/${project.id}/tasks`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(2);
    expect(json.tasks.every((t: { projectId: string }) => t.projectId === project.id)).toEqual(true);
  });

  it("他のプロジェクトのタスクは含まれへんねん", async () => {
    const project1 = await projectStore.create({ name: "Project 1" });
    const project2 = await projectStore.create({ name: "Project 2" });
    await taskStore.create({ title: "エビ", projectId: project1.id });
    await taskStore.create({ title: "イカ", projectId: project2.id });

    const res = await app.request(`/api/projects/${project1.id}/tasks`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toHaveLength(1);
    expect(json.tasks[0].title).toEqual("エビ");
  });

  it("タスクがなかったら空配列返ってくるんやで", async () => {
    const project = await projectStore.create({ name: "Empty Project" });

    const res = await app.request(`/api/projects/${project.id}/tasks`);
    const json = await res.json();

    expect(res.status).toEqual(200);
    expect(json.tasks).toEqual([]);
  });

  it("存在しないプロジェクトIDやったら404返すねん", async () => {
    const res = await app.request(`/api/projects/${NONEXISTENT_ID}/tasks`);
    const json = await res.json();

    expect(res.status).toEqual(404);
    expect(json.error).toBeDefined();
  });
});
