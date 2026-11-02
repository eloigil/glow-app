// Applies the saved light/dark choice (components/ThemeToggle.tsx) as early as possible, so there's no flash.
try {
  var t = localStorage.getItem("glow.theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
