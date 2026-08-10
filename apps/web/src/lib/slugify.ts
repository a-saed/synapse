export const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidProjectId(id: string): boolean {
  return PROJECT_ID_PATTERN.test(id);
}
