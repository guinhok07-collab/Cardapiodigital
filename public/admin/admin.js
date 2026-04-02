(function () {
  var ADMIN_PASSWORD = "admin123";
  var SESSION_KEY = "cardapio_admin_ok_v1";
  var STORAGE_PREVIEW = "cardapio_menu_preview_v1";
  var menuData = null;
  var storeBound = false;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function slugify(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cat-" + Date.now();
  }

  function showLogin() {
    $("login-section").classList.remove("hidden");
    $("panel-section").classList.add("hidden");
  }

  function showPanel() {
    $("login-section").classList.add("hidden");
    $("panel-section").classList.remove("hidden");
  }

  function loadData() {
    return fetch("../data/menu-data.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("JSON");
      return r.json();
    });
  }

  function fillStoreForm() {
    var s = menuData.store || {};
    $("f-name").value = s.name || "";
    $("f-wa").value = s.whatsapp || "";
    $("f-headline").value = s.headline || "";
    $("f-subhead").value = s.subhead || "";
    $("f-address").value = s.address || "";
    $("f-hero").value = s.heroImage || "";
  }

  function readStoreForm() {
    var h = $("f-hero").value.trim();
    menuData.store = {
      name: $("f-name").value.trim() || "Cardápio Digital",
      headline: $("f-headline").value.trim() || "Monte seu pedido",
      subhead: $("f-subhead").value.trim() || "",
      whatsapp: $("f-wa").value.replace(/\D/g, "") || "5511999999999",
      address: $("f-address").value.trim() || "",
      heroImage: h || null,
    };
  }

  function renderItem(ci, ii, item) {
    var row = document.createElement("div");
    row.className = "item-grid";
    row.innerHTML =
      '<label>Nome <input type="text" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '" data-field="name" value="' +
      escapeAttr(item.name) +
      '" /></label>' +
      '<label>Descrição <input type="text" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '" data-field="description" value="' +
      escapeAttr(item.description) +
      '" /></label>' +
      '<label>Preço <input type="number" step="0.01" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '" data-field="price" value="' +
      item.price +
      '" /></label>' +
      '<label>Imagem URL <input type="text" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '" data-field="image" value="' +
      escapeAttr(item.image || "") +
      '" /></label>' +
      '<button type="button" class="btn-sm rm-item" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '">✕</button>';
    row.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("input", syncItem);
    });
    row.querySelector(".rm-item").addEventListener("click", function () {
      menuData.categories[ci].items.splice(ii, 1);
      readStoreForm();
      renderCats();
    });
    return row;
  }

  function syncItem(ev) {
    var inp = ev.target;
    var ci = +inp.dataset.ci;
    var ii = +inp.dataset.ii;
    var f = inp.getAttribute("data-field");
    var v = inp.value;
    if (f === "price") v = parseFloat(v) || 0;
    if (f === "image" && !String(v).trim()) v = null;
    menuData.categories[ci].items[ii][f] = v;
  }

  function syncCat(ev) {
    var inp = ev.target;
    var ci = +inp.dataset.ci;
    var f = inp.getAttribute("data-field");
    var v = inp.value;
    if (f === "id") v = slugify(v);
    if (f === "subtitle") v = v.trim();
    menuData.categories[ci][f] = v;
  }

  function renderCats() {
    var root = $("cats-editor");
    root.innerHTML = "";
    (menuData.categories || []).forEach(function (cat, ci) {
      var box = document.createElement("div");
      box.className = "cat-box";
      box.innerHTML =
        "<h3>Categoria " +
        (ci + 1) +
        '</h3><div class="cat-grid">' +
        '<label>ID <input type="text" data-ci="' +
        ci +
        '" data-field="id" value="' +
        escapeAttr(cat.id) +
        '" /></label>' +
        '<label>Nome <input type="text" data-ci="' +
        ci +
        '" data-field="title" value="' +
        escapeAttr(cat.title) +
        '" /></label>' +
        '<label>Emoji <input type="text" data-ci="' +
        ci +
        '" data-field="emoji" value="' +
        escapeAttr(cat.emoji) +
        '" maxlength="4" /></label></div>' +
        '<div class="cat-sub"><label>Subtítulo <input type="text" data-ci="' +
        ci +
        '" data-field="subtitle" value="' +
        escapeAttr(cat.subtitle || "") +
        '" /></label></div>' +
        '<button type="button" class="btn-sm rm-cat" data-ci="' +
        ci +
        '">Remover categoria</button>' +
        '<div class="items-wrap" data-for="' +
        ci +
        '"></div>' +
        '<button type="button" class="btn-sm add-item" data-ci="' +
        ci +
        '">+ Item</button>';

      root.appendChild(box);
      var wrap = box.querySelector(".items-wrap");
      (cat.items || []).forEach(function (item, ii) {
        wrap.appendChild(renderItem(ci, ii, item));
      });

      box.querySelectorAll(".cat-grid input, .cat-sub input").forEach(function (inp) {
        inp.addEventListener("input", syncCat);
      });
      box.querySelector(".rm-cat").addEventListener("click", function () {
        menuData.categories.splice(ci, 1);
        readStoreForm();
        renderCats();
      });
      box.querySelector(".add-item").addEventListener("click", function () {
        if (!menuData.categories[ci].items) menuData.categories[ci].items = [];
        menuData.categories[ci].items.push({
          id: "i-" + Date.now(),
          name: "Item",
          description: "",
          price: 0,
          image: null,
        });
        readStoreForm();
        renderCats();
      });
    });
  }

  function syncAll() {
    readStoreForm();
    document.querySelectorAll(".cat-grid input, .cat-sub input").forEach(function (inp) {
      var ci = +inp.dataset.ci;
      var f = inp.getAttribute("data-field");
      var v = inp.value;
      if (f === "id") v = slugify(v);
      if (f === "subtitle") v = v.trim();
      menuData.categories[ci][f] = v;
    });
    document.querySelectorAll(".item-grid input").forEach(function (inp) {
      var ci = +inp.dataset.ci;
      var ii = +inp.dataset.ii;
      var f = inp.getAttribute("data-field");
      var v = inp.value;
      if (f === "price") v = parseFloat(v) || 0;
      if (f === "image" && !String(v).trim()) v = null;
      if (menuData.categories[ci].items[ii])
        menuData.categories[ci].items[ii][f] = v;
    });
  }

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    $("login-error").classList.add("hidden");
    if ($("login-password").value !== ADMIN_PASSWORD) {
      $("login-error").textContent = "Senha incorreta.";
      $("login-error").classList.remove("hidden");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    $("login-password").value = "";
    start();
  });

  function start() {
    loadData()
      .then(function (data) {
        menuData = data;
        fillStoreForm();
        renderCats();
        showPanel();
        if (!storeBound) {
          storeBound = true;
          ["f-name", "f-wa", "f-headline", "f-subhead", "f-address", "f-hero"].forEach(function (id) {
            $(id).addEventListener("input", readStoreForm);
          });
        }
      })
      .catch(function () {
        sessionStorage.removeItem(SESSION_KEY);
        showLogin();
        $("login-error").textContent = "Erro ao carregar menu-data.json";
        $("login-error").classList.remove("hidden");
      });
  }

  $("btn-logout").addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });

  $("btn-download").addEventListener("click", function () {
    syncAll();
    menuData.version = 1;
    var blob = new Blob([JSON.stringify(menuData, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "menu-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("btn-preview").addEventListener("click", function () {
    syncAll();
    localStorage.setItem(STORAGE_PREVIEW, JSON.stringify(menuData));
    $("preview-msg").classList.remove("hidden");
  });

  $("btn-add-cat").addEventListener("click", function () {
    syncAll();
    menuData.categories.push({
      id: "nova-" + Date.now(),
      title: "Nova",
      subtitle: "",
      emoji: "📋",
      items: [],
    });
    renderCats();
  });

  if (sessionStorage.getItem(SESSION_KEY) === "1") start();
  else showLogin();
})();
