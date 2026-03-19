// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
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

const createProject = async (name = "寿司プロジェクト") => {
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

const putMilestone = async (
  projectId: string,
  milestoneId: string,
  body: Record<string, unknown>
) => {
  return app.request(
    `/api/projects/${projectId}/milestones/${milestoneId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
};

describe("POST /api/projects/:projectId/milestones", () => {
  beforeAll(() => {
    console.log("[START] POST /api/projects/:projectId/milestones");
  });
  afterAll(() => {
    console.log("[END] POST /api/projects/:projectId/milestones");
  });
  beforeEach(async () => {
    await resetAll();
  });

  it("マイルストーンが正しく作成されるんやで", async () => {
    const project = await createProject();

    const res = await postMilestone(project.id, { title: "マグロリリース" });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("マグロリリース");
    expect(json.milestone.projectId).toEqual(project.id);
    expect(json.milestone.status).toEqual("open");
    expect(json.milestone.description).toEqual("");
    expect(json.milestone.dueDate).toEqual(null);
  });

  it("descriptionとdueDateも一緒に指定できるんやで", async () => {
    const project = await createProject();

    const res = await postMilestone(project.id, {
      title: "サーモンフェーズ",
      description: "サーモンの旬に合わせたリリース",
      dueDate: "2026-06-01",
    });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("サーモンフェーズ");
    expect(json.milestone.description).toEqual("サーモンの旬に合わせたリリース");
    expect(json.milestone.dueDate).toEqual("2026-06-01");
  });

  it("titleが無かったら400返すねん", async () => {
    const project = await createProject();

    const res = await postMilestone(project.id, {});

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Title is required");
  });

  it("存在しないプロジェクトやったら404返すねん", async () => {
    const res = await postMilestone(NON_EXISTENT_UUID, {
      title: "エビリリース",
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Project not found");
  });

  it("境界値: サロゲートペア文字（森鷗外）を含むタイトルで作成できるんやで", async () => {
    const project = await createProject();

    const res = await postMilestone(project.id, {
      title: "森鷗外マイルストーン",
    });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("森鷗外マイルストーン");
  });

  it("境界値: 空文字のtitleやったら400返すねん", async () => {
    const project = await createProject();

    const res = await postMilestone(project.id, { title: "" });

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Title is required");
  });
});

describe("GET /api/projects/:projectId/milestones", () => {
  beforeAll(() => {
    console.log("[START] GET /api/projects/:projectId/milestones");
  });
  afterAll(() => {
    console.log("[END] GET /api/projects/:projectId/milestones");
  });
  beforeEach(async () => {
    await resetAll();
  });

  it("マイルストーンが0件でも空配列が返ってくるんやで", async () => {
    const project = await createProject();

    const res = await app.request(
      `/api/projects/${project.id}/milestones`
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestones: Milestone[] };
    expect(json.milestones).toEqual([]);
  });

  it("マイルストーン一覧がちゃんと取得できるんやで", async () => {
    const project = await createProject();
    await milestoneStore.create(project.id, { title: "マグロリリース" });
    await milestoneStore.create(project.id, { title: "サーモンフェーズ" });
    await milestoneStore.create(project.id, { title: "エビスプリント" });

    const res = await app.request(
      `/api/projects/${project.id}/milestones`
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestones: Milestone[] };
    expect(json.milestones.length).toEqual(3);
    const titles = json.milestones.map((m) => m.title).sort();
    expect(titles).toEqual(["エビスプリント", "サーモンフェーズ", "マグロリリース"]);
  });

  it("存在しないプロジェクトやったら404返すねん", async () => {
    const res = await app.request(
      `/api/projects/${NON_EXISTENT_UUID}/milestones`
    );

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Project not found");
  });

  it("他のプロジェクトのマイルストーンは混ざらへんで", async () => {
    const project1 = await createProject("イカプロジェクト");
    const project2 = await createProject("タマゴプロジェクト");
    await milestoneStore.create(project1.id, { title: "イカリリース" });
    await milestoneStore.create(project2.id, { title: "タマゴリリース" });

    const res = await app.request(
      `/api/projects/${project1.id}/milestones`
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestones: Milestone[] };
    expect(json.milestones.length).toEqual(1);
    expect(json.milestones[0].title).toEqual("イカリリース");
  });
});

describe("GET /api/projects/:projectId/milestones/:milestoneId", () => {
  beforeAll(() => {
    console.log(
      "[START] GET /api/projects/:projectId/milestones/:milestoneId"
    );
  });
  afterAll(() => {
    console.log(
      "[END] GET /api/projects/:projectId/milestones/:milestoneId"
    );
  });
  beforeEach(async () => {
    await resetAll();
  });

  it("指定したマイルストーンがちゃんと取得できるんやで", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "ウニスペシャル",
      description: "ウニ級の高級リリース",
    });

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${milestone.id}`
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.id).toEqual(milestone.id);
    expect(json.milestone.title).toEqual("ウニスペシャル");
    expect(json.milestone.description).toEqual("ウニ級の高級リリース");
    expect(json.milestone.projectId).toEqual(project.id);
    expect(json.milestone.status).toEqual("open");
  });

  it("存在しないIDやったら404返すねん", async () => {
    const project = await createProject();

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${NON_EXISTENT_UUID}`
    );

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Milestone not found");
  });

  it("境界値: サロゲートペア文字（森鷗外）を含むマイルストーンも取得できるんやで", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "森鷗外リリース",
      description: "森鷗外の作品にちなんだフェーズ",
    });

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${milestone.id}`
    );

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("森鷗外リリース");
    expect(json.milestone.description).toEqual("森鷗外の作品にちなんだフェーズ");
  });
});

describe("PUT /api/projects/:projectId/milestones/:milestoneId", () => {
  beforeAll(() => {
    console.log(
      "[START] PUT /api/projects/:projectId/milestones/:milestoneId"
    );
  });
  afterAll(() => {
    console.log(
      "[END] PUT /api/projects/:projectId/milestones/:milestoneId"
    );
  });
  beforeEach(async () => {
    await resetAll();
  });

  it("マイルストーンのタイトルとステータスを更新できるんやで", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "マグロリリース",
    });

    const res = await putMilestone(project.id, milestone.id, {
      title: "マグロリリースv2",
      description: "マグロの大トロ級アップデート",
      status: "closed",
      dueDate: "2026-12-31",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("マグロリリースv2");
    expect(json.milestone.description).toEqual("マグロの大トロ級アップデート");
    expect(json.milestone.status).toEqual("closed");
    expect(json.milestone.dueDate).toEqual("2026-12-31");
  });

  it("一部のフィールドだけ更新してもええんやで", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "サーモンフェーズ",
      description: "最初の説明",
    });

    const res = await putMilestone(project.id, milestone.id, {
      title: "サーモンフェーズv2",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("サーモンフェーズv2");
    expect(json.milestone.description).toEqual("最初の説明");
    expect(json.milestone.status).toEqual("open");
  });

  it("存在しないマイルストーンやったら404返すねん", async () => {
    const project = await createProject();

    const res = await putMilestone(project.id, NON_EXISTENT_UUID, {
      title: "イカリリース",
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Milestone not found");
  });

  it("無効なstatusやったら400返すねん", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "タマゴリリース",
    });

    const res = await putMilestone(project.id, milestone.id, {
      status: "invalid_status",
    });

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Invalid status");
  });

  it("statusをopenからclosedに変えられるんやで", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "エビスプリント",
    });

    const res = await putMilestone(project.id, milestone.id, {
      status: "closed",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.status).toEqual("closed");
  });

  it("statusをclosedからopenに戻せるんやで", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "ウニフェーズ",
    });
    await milestoneStore.update(milestone.id, { status: "closed" });

    const res = await putMilestone(project.id, milestone.id, {
      status: "open",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.status).toEqual("open");
  });

  it("境界値: サロゲートペア文字（森鷗外）で更新できるんやで", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "仮タイトル",
    });

    const res = await putMilestone(project.id, milestone.id, {
      title: "森鷗外リリース",
      description: "森鷗外の世界観を表現",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { milestone: Milestone };
    expect(json.milestone.title).toEqual("森鷗外リリース");
    expect(json.milestone.description).toEqual("森鷗外の世界観を表現");
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
  beforeEach(async () => {
    await resetAll();
  });

  it("マイルストーンがちゃんと削除されるんやで", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "マグロリリース",
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

  it("存在しないマイルストーンやったら404返すねん", async () => {
    const project = await createProject();

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${NON_EXISTENT_UUID}`,
      { method: "DELETE" }
    );

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Milestone not found");
  });

  it("削除済みマイルストーンをもう一回削除しようとしたら404返すねん", async () => {
    const project = await createProject();
    const milestone = await milestoneStore.create(project.id, {
      title: "サーモンフェーズ",
    });

    await app.request(
      `/api/projects/${project.id}/milestones/${milestone.id}`,
      { method: "DELETE" }
    );

    const res = await app.request(
      `/api/projects/${project.id}/milestones/${milestone.id}`,
      { method: "DELETE" }
    );

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Milestone not found");
  });
});
