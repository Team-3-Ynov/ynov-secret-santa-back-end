import { validateEventInput } from "../../src/models/event.model";

describe("event.model validateEventInput", () => {
  it("should return normalized data for valid payload", () => {
    const payload = {
      title: "  Noel 2026  ",
      description: "  Cadeaux et tirage  ",
      eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      budget: "30",
    };

    const result = validateEventInput(payload);

    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.title).toBe("Noel 2026");
      expect(result.data.description).toBe("Cadeaux et tirage");
      expect(result.data.budget).toBe(30);
      expect(result.data.eventDate).toBeInstanceOf(Date);
    }
  });

  it("should return errors for invalid date", () => {
    const payload = {
      title: "Event",
      eventDate: "not-a-date",
    };

    const result = validateEventInput(payload);

    expect("errors" in result).toBe(true);
  });

  it("should return errors for past date", () => {
    const payload = {
      title: "Event",
      eventDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    };

    const result = validateEventInput(payload);

    expect("errors" in result).toBe(true);
  });

  it("should return errors for negative budget", () => {
    const payload = {
      title: "Event",
      eventDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      budget: -10,
    };

    const result = validateEventInput(payload);

    expect("errors" in result).toBe(true);
  });
});
