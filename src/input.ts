export const Keys: Record<string, boolean> = {};

window.addEventListener("keydown", (e) => {
  Keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  Keys[e.code] = false;
});
