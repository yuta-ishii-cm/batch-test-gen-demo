// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { commentStore } from "../../src/store/commentStore";
import { tagStore } from "../../src/store/tagStore";
import { taskStore } from "../../src/store/taskStore";
import { milestoneStore } from "../../src/store/milestoneStore";
import { projectStore } from "../../src/store/projectStore";

const NULL_UUID = "00000000-0000-0000-0000-000000000000";

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await taskStore.reset();
  await milestoneStore.reset();
  await projectStore.reset();
});

/** プロジェクトを作成してIDを返すヘルパー */
const createProject = async (name = "Test Project"): Promise<string> => {
  const res = await app.request("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  return json.project.id;
};

/** マイルストーンを作成してIDを返すヘルパー */
const createMilestone = async (
  projectId: string,
  title = "Test Milestone"
): Promise<string> => {
  const res = await app.request(`/api/projects/${projectId}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const json = await res.json();
  return json.milestone.id;
};

describe("POST /api/projects/:projectId/milestones", () => {
  beforeAll(() => {
    console.log("[START] POST /api/projects/:projectId/milestones");
  });

  afterAll(() => {
    console.log("[END] POST /api/projects/:projectId/milestones");
  });

  it("マイルストーンを作成できる", async () => {
    const projectId = await createProject();

    const res = await app.request(`/api/projects/${projectId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Milestone" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.milestone.title).toEqual("Test Milestone");
    expect(json.milestone.projectId).toEqual(projectId);
    expect(json.milestone.status).toEqual("open");
  });

  it("タイトルなしの場合は400を返す", async () => {
    const projectId = await createProject();

    const res = await app.request(`/api/projects/${projectId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toEqual(400);
    const json = await res.json();
    expect(json.error).toEqual("Title is required");
  });

  it("存在しないプロジェクトIDの場合は404を返す", async () => {
    const res = await app.request(
      `/api/projects/${NULL_UUID}/milestones`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test Milestone" }),
      }
    );

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Project not found");
  });

  it("説明と期日を含むマイルストーンを作成できる", async () => {
    const projectId = await createProject();

    const res = await app.request(`/api/projects/${projectId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Milestone with details",
        description: "詳細な説明",
        dueDate: "2026-12-31",
      }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.milestone.description).toEqual("詳細な説明");
    expect(json.milestone.dueDate).toEqual("2026-12-31");
  });

  it("サロゲートペアを含むタイトルでマイルストーンを作成できる", async () => {
    const projectId = await createProject();

    const res = await app.request(`/api/projects/${projectId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "森鷗外マイルストーン" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.milestone.title).toEqual("森鷗外マイルストーン");
  });
});

describe("GET /api/projects/:projectId/milestones", () => {
  beforeAll(() => {
    console.log("[START] GET /api/projects/:projectId/milestones");
  });

  afterAll(() => {
    console.log("[END] GET /api/projects/:projectId/milestones");
  });

  it("マイルストーン一覧を取得できる", async () => {
    const projectId = await createProject();
    await createMilestone(projectId, "Milestone 1");
    await createMilestone(projectId, "Milestone 2");

    const res = await app.request(`/api/projects/${projectId}/milestones`);

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestones.length).toEqual(2);
  });

  it("マイルストーンが存在しない場合は空配列を返す", async () => {
    const projectId = await createProject();

    const res = await app.request(`/api/projects/${projectId}/milestones`);

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestones).toEqual([]);
  });

  it("存在しないプロジェクトIDの場合は404を返す", async () => {
    const res = await app.request(
      `/api/projects/${NULL_UUID}/milestones`
    );

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Project not found");
  });

  it("別プロジェクトのマイルストーンは含まれない", async () => {
    const projectId1 = await createProject("Project 1");
    const projectId2 = await createProject("Project 2");
    await createMilestone(projectId1, "Milestone for P1");
    await createMilestone(projectId2, "Milestone for P2");

    const res = await app.request(`/api/projects/${projectId1}/milestones`);

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestones.length).toEqual(1);
    expect(json.milestones[0].title).toEqual("Milestone for P1");
  });
});

describe("GET /api/projects/:projectId/milestones/:milestoneId", () => {
  beforeAll(() => {
    console.log("[START] GET /api/projects/:projectId/milestones/:milestoneId");
  });

  afterAll(() => {
    console.log("[END] GET /api/projects/:projectId/milestones/:milestoneId");
  });

  it("IDでマイルストーンを取得できる", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId, "Target Milestone");

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`
    );

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestone.id).toEqual(milestoneId);
    expect(json.milestone.title).toEqual("Target Milestone");
  });

  it("存在しないIDの場合は404を返す", async () => {
    const projectId = await createProject();

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${NULL_UUID}`
    );

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Milestone not found");
  });
});

describe("PUT /api/projects/:projectId/milestones/:milestoneId", () => {
  beforeAll(() => {
    console.log("[START] PUT /api/projects/:projectId/milestones/:milestoneId");
  });

  afterAll(() => {
    console.log("[END] PUT /api/projects/:projectId/milestones/:milestoneId");
  });

  it("マイルストーンを更新できる", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId, "Old Title");

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Title" }),
      }
    );

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestone.title).toEqual("New Title");
  });

  it("ステータスをclosedに更新できる", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId);

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      }
    );

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestone.status).toEqual("closed");
  });

  it("ステータスをopenに戻せる", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId);

    await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      }
    );

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      }
    );

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestone.status).toEqual("open");
  });

  it("無効なステータスの場合は400を返す", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId);

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid-status" }),
      }
    );

    expect(res.status).toEqual(400);
    const json = await res.json();
    expect(json.error).toEqual("Invalid status");
  });

  it("存在しないIDの場合は404を返す", async () => {
    const projectId = await createProject();

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${NULL_UUID}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      }
    );

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Milestone not found");
  });

  it("説明と期日を更新できる", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId);

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "更新された説明",
          dueDate: "2027-01-01",
        }),
      }
    );

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestone.description).toEqual("更新された説明");
    expect(json.milestone.dueDate).toEqual("2027-01-01");
  });

  it("サロゲートペアを含むタイトルに更新できる", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId);

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "森鷗外リリース" }),
      }
    );

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.milestone.title).toEqual("森鷗外リリース");
  });
});

describe("DELETE /api/projects/:projectId/milestones/:milestoneId", () => {
  beforeAll(() => {
    console.log(
      "[START] DELETE /api/projects/:projectId/milestones/:milestoneId"
    );
  });

  afterAll(() => {
    console.log(
      "[END] DELETE /api/projects/:projectId/milestones/:milestoneId"
    );
  });

  it("マイルストーンを削除できる", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId);

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      { method: "DELETE" }
    );

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.message).toEqual("Milestone deleted");
  });

  it("削除後に取得すると404を返す", async () => {
    const projectId = await createProject();
    const milestoneId = await createMilestone(projectId);

    await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`,
      { method: "DELETE" }
    );

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${milestoneId}`
    );

    expect(res.status).toEqual(404);
  });

  it("存在しないIDの場合は404を返す", async () => {
    const projectId = await createProject();

    const res = await app.request(
      `/api/projects/${projectId}/milestones/${NULL_UUID}`,
      { method: "DELETE" }
    );

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Milestone not found");
  });
});
