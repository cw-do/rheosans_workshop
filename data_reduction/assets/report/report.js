(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll("section.tab"));

  function show(id) {
    id = id || "overview";
    if (!tabs.some(function (t) { return t.dataset.id === id; })) id = "overview";
    tabs.forEach(function (t) { t.classList.toggle("active", t.dataset.id === id); });
    document.querySelectorAll("nav a[data-tab]").forEach(function (a) {
      a.classList.toggle("active", a.dataset.tab === id);
    });
    document.querySelectorAll("svg.tree a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
  show(location.hash.slice(1));

  // Images in tabs that were never shown are lazy and not loaded yet; load them before printing.
  function loadImages(scope) {
    var imgs = Array.prototype.slice.call(scope.querySelectorAll("img"));
    imgs.forEach(function (img) { img.loading = "eager"; });
    var pending = imgs.filter(function (img) { return !img.complete; }).map(function (img) {
      return new Promise(function (done) { img.addEventListener("load", done); img.addEventListener("error", done); });
    });
    var timeout = new Promise(function (done) { setTimeout(done, 15000); });
    return Promise.race([Promise.all(pending), timeout]);
  }

  // Reduction records are part of the PDF even when folded on screen.
  function openKept() {
    document.querySelectorAll("details.keep").forEach(function (d) { d.open = true; });
  }
  window.addEventListener("beforeprint", openKept);

  function printAs(mode) {
    openKept();
    document.body.classList.remove("print-one", "print-all");
    document.body.classList.add(mode);
    var scope = mode === "print-all" ? document : (document.querySelector("section.tab.active") || document);
    loadImages(scope).then(function () { window.print(); });
  }
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("print-one", "print-all");
  });
  document.getElementById("print-one").addEventListener("click", function () { printAs("print-one"); });
  document.getElementById("print-all").addEventListener("click", function () { printAs("print-all"); });

  // ?print=all lays every page out for printing without a dialog (used for headless PDF checks).
  if (new URLSearchParams(location.search).get("print") === "all") {
    document.body.classList.add("print-all");
    loadImages(document);
  }
})();
