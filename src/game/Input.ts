export const Keys: Record<string, boolean> = {};

window.addEventListener("keydown", (e: KeyboardEvent) => {
  Keys[e.code] = true;
});

window.addEventListener("keyup", (e: KeyboardEvent) => {
  Keys[e.code] = false;
});
