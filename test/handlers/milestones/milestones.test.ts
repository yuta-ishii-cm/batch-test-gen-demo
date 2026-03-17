import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { tagStore } from "../../../src/store/tagStore";
import { milestoneStore } from "../../../src/store/milestoneStore";
import { taskStore } from "../../../src/store/taskStore";
import { projectStore } from "../../../src/store/projectStore";
import { userStore } from "../../../src/store/userStore";
import type { Milestone } from "../../../src/types/milestone";

const NON_EXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

const resetAll = async () => {
  await commentStore.reset();
  await tagStore.reset();
  await milestoneStore.reset();
  await taskStore.reset();
  await projectStore.reset();
  await userStore.reset();
};

const createProject = async (name = "テストプロジェクト") => {
  return projectStore.create({ name });
};

const postMilestone = async (
  projectId: string,
  body: Record<string, unknown>
) => {
  return app.request(`/api/projects/${projectId}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

describe("POST /api/projects/:projectId/milestones", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: マイルストーンを作成できる", async () => {
    const project = await createProject();

    const res = await postMilestone(project.id, { title: "v1.0リリース" });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("v1.0リリース");
    expect(json.milestone.projectId).toEqual(project.id);
    expect(json.milestone.status).toEqual("open");
    expect(json.milestone.description).toEqual("");
    expect(json.milestone.dueDate).toEqual(null);
  });

  it("正常系: descriptionとdueDateを指定して作成できる", async () => {
    const project = await createProject();

    const res = await postMilestone(project.id, {
      title: "v2.0リリース",
      description: "メジャーアップデート",
      dueDate: "2026-06-01",
    });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("v2.0リリース");
    expect(json.milestone.description).toEqual("メジャーアップデート");
    expect(json.milestone.dueDate).toEqual("2026-06-01");
  });

  it("異常系: titleが未指定の場合400エラー", async () => {
    const project = await createProject();

    const res = await postMilestone(project.id, {});

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Title is required");
  });

  it("異常系: 存在しないプロジェクトの場合404エラー", async () => {
    const res = await postMilestone(NON_EXISTENT_UUID, {
      title: "v1.0リリース",
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Project not found");
  });
});

describe("GET /api/projects/:projectId/milestones", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: マイルストーンが0件の場合、空配列を返す", async () => {
    const project = await createProject();

    const res = await app.request(
      `/api/projects/${project.id}/milestones`
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestones: Milestone[] };
    expect(json.milestones).toEqual([]);
  });

  it("正常系: マイルストーン一覧を取得できる", async () => {
    const project = await createProject();
    await milestoneStore.create(project.id, { title: "v1.0" });
    await milestoneStore.create(project.id, { title: "v2.0" });

    const res = await app.request(
      `/api/projects/${project.id}/milestones`
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestones: Milestone[] };
    expect(json.milestones.length).toEqual(2);
    const titles = json.milestones.map((m) => m.title).sort();
    expect(titles).toEqual(["v1.0", "v2.0"]);
  });

  it("異常系: 存在しないプロジェクトの場合404エラー", async () => {
    const res = await app.request(
      `/api/projects/${NON_EXISTENT_UUID}/milestones`
    );

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Project not found");
  });
});

describe("GET /api/projects/:projectId/milestones/:milestoneId", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: マイルストーンを取得できる", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "v1.0",
      description: "初回リリース",
    });

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${milestone.id}`
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.id).toEqual(milestone.id);
    expect(json.milestone.title).toEqual("v1.0");
    expect(json.milestone.description).toEqual("初回リリース");
  });

  it("異常系: 存在しないマイルストーンの場合404エラー", async () => {
    const project = await createProject();

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${NON_EXISTENT_UUID}`
    );

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Milestone not found");
  });
});

describe("PUT /api/projects/:projectId/milestones/:milestoneId", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: マイルストーンを更新できる", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "v1.0",
    });

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${milestone.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "v1.1",
          description: "バグ修正リリース",
          status: "closed",
          dueDate: "2026-12-31",
        }),
      }
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("v1.1");
    expect(json.milestone.description).toEqual("バグ修正リリース");
    expect(json.milestone.status).toEqual("closed");
    expect(json.milestone.dueDate).toEqual("2026-12-31");
  });

  it("異常系: 存在しないマイルストーンの場合404エラー", async () => {
    const project = await createProject();

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${NON_EXISTENT_UUID}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "v1.1" }),
      }
    );

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Milestone not found");
  });

  it("異常系: 無効なstatusの場合400エラー", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "v1.0",
    });

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${milestone.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid" }),
      }
    );

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Invalid status");
  });
});

describe("DELETE /api/projects/:projectId/milestones/:milestoneId", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: マイルストーンを削除できる", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "v1.0",
    });

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${milestone.id}`,
      { method: "DELETE" }
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { message: string };
    expect(json.message).toEqual("Milestone deleted");

    const deleted = await milestoneStore.getById(milestone.id);
    expect(deleted).toEqual(null);
  });

  it("異常系: 存在しないマイルストーンの場合404エラー", async () => {
    const project = await createProject();

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${NON_EXISTENT_UUID}`,
      { method: "DELETE" }
    );

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Milestone not found");
  });
});
