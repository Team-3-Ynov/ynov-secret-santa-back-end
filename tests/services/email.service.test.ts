import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMailMock, createTransportMock } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return {
    sendMailMock: sendMail,
    createTransportMock: vi.fn(() => ({ sendMail })),
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

describe("email.service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.NODE_ENV;
  });

  it("sendInvitationEmail should skip sending in production when SMTP creds are missing", async () => {
    process.env.NODE_ENV = "production";
    process.env.SMTP_PORT = "587";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const { sendInvitationEmail } = await import("../../src/services/email.service");
    await sendInvitationEmail("to@example.com", "Noel", "https://app/invite");

    expect(sendMailMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it("sendInvitationEmail should not throw in dev when send fails", async () => {
    process.env.NODE_ENV = "development";
    process.env.SMTP_PORT = "1025";
    sendMailMock.mockRejectedValueOnce(new Error("smtp down"));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    const { sendInvitationEmail } = await import("../../src/services/email.service");

    await expect(
      sendInvitationEmail("to@example.com", "Noel", "https://app/invite")
    ).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("sendDrawResultEmail should throw in production when send fails with creds", async () => {
    process.env.NODE_ENV = "production";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "smtp-user";
    process.env.SMTP_PASS = "smtp-pass";
    sendMailMock.mockRejectedValueOnce(new Error("smtp fail"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { sendDrawResultEmail } = await import("../../src/services/email.service");

    await expect(
      sendDrawResultEmail("to@example.com", "giver", "receiver", "Noel")
    ).rejects.toThrow("smtp fail");
  });

  it("sendDrawResultEmail should send email when SMTP succeeds", async () => {
    process.env.NODE_ENV = "production";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "smtp-user";
    process.env.SMTP_PASS = "smtp-pass";
    sendMailMock.mockResolvedValueOnce({ messageId: "mid-1" });

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const { sendDrawResultEmail } = await import("../../src/services/email.service");
    await sendDrawResultEmail("to@example.com", "giver", "receiver", "Noel");

    expect(createTransportMock).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });
});
