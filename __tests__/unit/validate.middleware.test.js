jest.mock("../../config/logger");

const { log } = require("../../config/logger");
const {
  validate,
  parkingIdParam,
  reservationIdParam,
} = require("../../middleware/validate");
const { z } = require("zod");
const { VALIDATION_FAILED } = require("../../constants/errors");

beforeEach(() => {
  jest.clearAllMocks();
  log.mockResolvedValue();
});

const mockReqRes = (body = {}) => {
  const req = { body, params: {}, originalUrl: "/test" };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

const mockParam = (value) => {
  const req = { params: {} };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next, value };
};

// ─────────────────────────────────────────
describe("sanitizeObject (via validate)", () => {
  const schema = z.object({ name: z.string() });

  test("✅ Sanitize XSS dans une string", async () => {
    const { req, res, next } = mockReqRes({
      name: "<script>alert(1)</script>",
    });
    await validate(schema)(req, res, next);
    expect(req.body.name).not.toContain("<script>");
  });

  test("✅ Sanitize XSS dans un objet imbriqué", async () => {
    const nestedSchema = z.object({ meta: z.object({ label: z.string() }) });
    const { req, res, next } = mockReqRes({
      meta: { label: "<img src=x onerror=alert(1)>" },
    });
    await validate(nestedSchema)(req, res, next);
    expect(req.body.meta.label).not.toContain("onerror=alert(1)");
  });

  test("✅ Sanitize XSS dans un tableau", async () => {
    const arrSchema = z.object({ tags: z.array(z.string()) });
    const { req, res, next } = mockReqRes({
      tags: ["ok", "<script>xss</script>"],
    });
    await validate(arrSchema)(req, res, next);
    expect(req.body.tags[1]).not.toContain("<script>");
  });

  test("✅ Les types non-string (number, boolean) passent inchangés", async () => {
    const numSchema = z.object({ count: z.number() });
    const { req, res, next } = mockReqRes({ count: 42 });
    await validate(numSchema)(req, res, next);
    expect(req.body.count).toBe(42);
    expect(next).toHaveBeenCalled();
  });

  test("✅ null passé directement est renvoyé tel quel", async () => {
    const nullSchema = z.object({ value: z.null() });
    const { req, res, next } = mockReqRes({ value: null });
    await validate(nullSchema)(req, res, next);
    expect(req.body.value).toBeNull();
    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────
describe("validate middleware", () => {
  const schema = z.object({
    name: z.string().min(1),
    city: z.string().min(1),
  });

  test("✅ Body valide → next() appelé, req.body mis à jour", async () => {
    const { req, res, next } = mockReqRes({ name: "Parking A", city: "Paris" });
    await validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toMatchObject({ name: "Parking A", city: "Paris" });
  });

  test("❌ Body invalide → 400 avec structure d'erreur correcte", async () => {
    const { req, res, next } = mockReqRes({ name: "" });
    await validate(schema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        code: 400,
        message: VALIDATION_FAILED,
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("❌ Body invalide → erreurs contiennent le champ fautif", async () => {
    const { req, res, next } = mockReqRes({ name: "X" }); // city manquant
    await validate(schema)(req, res, next);
    const json = res.json.mock.calls[0][0];
    expect(json.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "city" })]),
    );
  });

  test("❌ Body invalide → log warn appelé", async () => {
    const { req, res, next } = mockReqRes({ name: "" });
    await validate(schema)(req, res, next);
    expect(log).toHaveBeenCalledWith(
      "warn",
      "VALIDATION_FAILED",
      expect.any(String),
      null,
      expect.any(Object),
    );
  });
});

// ─────────────────────────────────────────
describe("parkingIdParam", () => {
  test("✅ ID entier valide → req.params.parkingId converti en number, next() appelé", () => {
    const { req, res, next } = mockParam("42");
    parkingIdParam(req, res, next, "42");
    expect(req.params.parkingId).toBe(42);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("❌ Valeur négative → 400", () => {
    const { req, res, next } = mockParam("-5");
    parkingIdParam(req, res, next, "-5");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test("❌ Float → 400", () => {
    const { req, res, next } = mockParam("1.5");
    parkingIdParam(req, res, next, "1.5");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test("❌ Chaîne alphabétique → 400", () => {
    const { req, res, next } = mockParam("abc");
    parkingIdParam(req, res, next, "abc");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────
describe("reservationIdParam", () => {
  test("✅ ID entier valide → req.params.reservationId converti en number, next() appelé", () => {
    const { req, res, next } = mockParam("7");
    reservationIdParam(req, res, next, "7");
    expect(req.params.reservationId).toBe(7);
    expect(next).toHaveBeenCalledTimes(1);
  });
  test("❌ Valeur alphanumérique → 400", () => {
    const { req, res, next } = mockParam("7abc");
    reservationIdParam(req, res, next, "7abc");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
