import { readFileSync } from "node:fs";
import path from "node:path";

describe("005_add_profile_image_column.sql", () => {
  it("contains canonical conversion from legacy avatar-x values", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "database/migrations/005_add_profile_image_column.sql"
    );
    const sql = readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("WHEN profile_image = 'avatar-1' THEN '/avatars/avatar-1.svg'");
    expect(sql).toContain("WHEN profile_image = 'avatar-5' THEN '/avatars/avatar-5.svg'");
    expect(sql).toContain("ELSE '/avatars/avatar-1.svg'");
  });

  it("enforces strict allowlist with CHECK constraint", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "database/migrations/005_add_profile_image_column.sql"
    );
    const sql = readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("users_profile_image_allowed_check");
    expect(sql).toContain("'/avatars/avatar-1.svg'");
    expect(sql).toContain("'/avatars/avatar-5.svg'");
    expect(sql).toContain("ALTER COLUMN profile_image SET NOT NULL");
  });
});
