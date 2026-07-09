const currentPath = window.location.pathname.replace(/\/$/, "") || "/";

document.querySelectorAll(".site-nav a").forEach((link) => {
  const linkPath = new URL(link.href).pathname.replace(/\/$/, "") || "/";
  if (linkPath === currentPath) {
    link.setAttribute("aria-current", "page");
  }
});

document.querySelectorAll(".contact-form").forEach((form) => {
  const status = form.querySelector("[data-form-status]");
  form.addEventListener("submit", () => {
    if (status) {
      status.textContent = "Skickar formuläret…";
    }
  });
});
