(function () {
  /**
   * Senha do painel — altere antes de publicar (o ficheiro fica no repositório).
   * Não há servidor: quem tiver este ficheiro pode ver a senha.
   */
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
    $("f-logo-mode").value = s.logoMode === "image" ? "image" : "text";
    $("f-logo-image").value = s.logoImage || "";
    toggleLogoFields();
  }

  function toggleLogoFields() {
    var img = $("f-logo-image");
    if (!img) return;
    var mode = $("f-logo-mode").value;
    img.closest("label").style.display = mode === "image" ? "" : "none";
  }

  function readStoreForm() {
    menuData.store = {
      name: $("f-name").value.trim() || "Cardápio Digital",
      headline: $("f-headline").value.trim() || "Monte seu pedido",
      subhead: $("f-subhead").value.trim() || "",
      whatsapp: $("f-wa").value.replace(/\D/g, "") || "5511999999999",
      address: $("f-address").value.trim() || "",
      logoMode: $("f-logo-mode").value === "image" ? "image" : "text",
      logoImage: $("f-logo-image").value.trim() || "",
    };
  }

  function renderItem(ci, ii, item, si) {
    var row = document.createElement("div");
    row.className = "item-grid";
    var siAttr = si == null ? "" : ' data-si="' + si + '"';
    row.innerHTML =
      '<label>Nome <input type="text" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '"' +
      siAttr +
      ' data-field="name" value="' +
      escapeAttr(item.name) +
      '" /></label>' +
      '<label>Descrição <input type="text" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '"' +
      siAttr +
      ' data-field="description" value="' +
      escapeAttr(item.description) +
      '" /></label>' +
      '<label>Preço <input type="number" step="0.01" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '"' +
      siAttr +
      ' data-field="price" value="' +
      item.price +
      '" /></label>' +
      '<label>Imagem (URL) <input type="text" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '"' +
      siAttr +
      ' data-field="image" value="' +
      escapeAttr(item.image || "") +
      '" placeholder="https://…" /></label>' +
      '<button type="button" class="btn-sm rm-item" data-ci="' +
      ci +
      '" data-ii="' +
      ii +
      '"' +
      (si == null ? "" : ' data-si="' + si + '"') +
      '">✕</button>';
    row.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("input", syncItem);
    });
    row.querySelector(".rm-item").addEventListener("click", function () {
      var el = this;
      var c = +el.dataset.ci;
      var i = +el.dataset.ii;
      var s = el.dataset.si;
      if (s === undefined || s === "") {
        menuData.categories[c].items.splice(i, 1);
      } else {
        menuData.categories[c].sections[+s].items.splice(i, 1);
      }
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
    var si = inp.dataset.si;
    if (si === undefined || si === "") {
      if (menuData.categories[ci].items && menuData.categories[ci].items[ii])
        menuData.categories[ci].items[ii][f] = v;
    } else {
      var sec = menuData.categories[ci].sections[+si];
      if (sec && sec.items && sec.items[ii]) sec.items[ii][f] = v;
    }
  }

  function syncCat(ev) {
    var inp = ev.target;
    var ci = +inp.dataset.ci;
    var f = inp.getAttribute("data-field");
    var v = inp.value;
    if (f === "id") v = slugify(v);
    if (f === "subtitle") v = v.trim();
    if (f === "backgroundUrl") {
      v = v.trim();
      if (!v) delete menuData.categories[ci].backgroundUrl;
      else menuData.categories[ci].backgroundUrl = v;
      return;
    }
    menuData.categories[ci][f] = v;
  }

  function syncSectionMeta(ev) {
    var inp = ev.target;
    var ci = +inp.dataset.ci;
    var si = +inp.dataset.si;
    var f = inp.getAttribute("data-field");
    var v = inp.value;
    if (!menuData.categories[ci].sections[si]) return;
    menuData.categories[ci].sections[si][f] = v.trim();
  }

  function renderCats() {
    var root = $("cats-editor");
    root.innerHTML = "";
    (menuData.categories || []).forEach(function (cat, ci) {
      var box = document.createElement("div");
      box.className = "cat-box";

      var head = document.createElement("h3");
      head.textContent = "Categoria " + (ci + 1) + " — " + (cat.title || cat.id || "");
      box.appendChild(head);

      var catGrid = document.createElement("div");
      catGrid.className = "cat-grid";
      catGrid.innerHTML =
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
        '" maxlength="4" /></label>';
      box.appendChild(catGrid);

      var subRow = document.createElement("div");
      subRow.className = "cat-sub";
      subRow.innerHTML =
        '<label>Subtítulo <input type="text" data-ci="' +
        ci +
        '" data-field="subtitle" value="' +
        escapeAttr(cat.subtitle || "") +
        '" /></label>' +
        '<label class="cat-theme-label">Tema visual <select data-ci="' +
        ci +
        '" data-field="theme">' +
        '<option value="default"' +
        (cat.theme === "default" || !cat.theme ? " selected" : "") +
        '>Padrão (bebidas)</option>' +
        '<option value="burger"' +
        (cat.theme === "burger" ? " selected" : "") +
        '>Hambúrguer</option>' +
        '<option value="pastel"' +
        (cat.theme === "pastel" ? " selected" : "") +
        '>Pastelaria</option>' +
        '<option value="pizza"' +
        (cat.theme === "pizza" ? " selected" : "") +
        '>Pizza</option>' +
        '<option value="sweet"' +
        (cat.theme === "sweet" ? " selected" : "") +
        '>Doces</option>' +
        "</select></label>";
      box.appendChild(subRow);

      var bgRow = document.createElement("label");
      bgRow.className = "cat-bg-row";
      bgRow.innerHTML =
        'Fundo da página (URL da imagem, opcional — sobrepõe o padrão do tema)<input type="text" data-ci="' +
        ci +
        '" data-field="backgroundUrl" value="' +
        escapeAttr(cat.backgroundUrl || "") +
        '" placeholder="https://… (1920×1080 recomendado)" />';
      box.appendChild(bgRow);

      box
        .querySelectorAll(".cat-grid input, .cat-sub input, .cat-theme-label select, .cat-bg-row input")
        .forEach(function (inp) {
          inp.addEventListener("input", syncCat);
          inp.addEventListener("change", syncCat);
        });

      var hasSections = cat.sections && Array.isArray(cat.sections) && cat.sections.length > 0;

      if (hasSections) {
        cat.sections.forEach(function (sec, si) {
          var secBox = document.createElement("div");
          secBox.className = "sec-box";
          secBox.innerHTML =
            '<div class="sec-head"><strong>Secção ' +
            (si + 1) +
            '</strong><button type="button" class="btn-sm rm-sec" data-ci="' +
            ci +
            '" data-si="' +
            si +
            '">Remover secção</button></div>' +
            '<div class="sec-grid">' +
            '<label>Título da secção <input type="text" data-ci="' +
            ci +
            '" data-si="' +
            si +
            '" data-field="title" value="' +
            escapeAttr(sec.title || "") +
            '" /></label>' +
            '<label>Subtítulo <input type="text" data-ci="' +
            ci +
            '" data-si="' +
            si +
            '" data-field="subtitle" value="' +
            escapeAttr(sec.subtitle || "") +
            '" /></label></div>' +
            '<div class="items-wrap sec-items" data-for="' +
            ci +
            "-" +
            si +
            '"></div>' +
            '<button type="button" class="btn-sm add-item-sec" data-ci="' +
            ci +
            '" data-si="' +
            si +
            '">+ Item nesta secção</button>';

          box.appendChild(secBox);
          var wrap = secBox.querySelector(".items-wrap");
          (sec.items || []).forEach(function (item, ii) {
            wrap.appendChild(renderItem(ci, ii, item, si));
          });
          secBox.querySelectorAll(".sec-grid input").forEach(function (inp) {
            inp.addEventListener("input", syncSectionMeta);
          });
          secBox.querySelector(".rm-sec").addEventListener("click", function () {
            menuData.categories[ci].sections.splice(si, 1);
            readStoreForm();
            renderCats();
          });
          secBox.querySelector(".add-item-sec").addEventListener("click", function () {
            if (!menuData.categories[ci].sections[si].items)
              menuData.categories[ci].sections[si].items = [];
            menuData.categories[ci].sections[si].items.push({
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

        var addSecBtn = document.createElement("button");
        addSecBtn.type = "button";
        addSecBtn.className = "btn-sm";
        addSecBtn.textContent = "+ Nova secção";
        addSecBtn.addEventListener("click", function () {
          if (!menuData.categories[ci].sections) menuData.categories[ci].sections = [];
          menuData.categories[ci].sections.push({
            title: "Nova secção",
            subtitle: "",
            items: [],
          });
          readStoreForm();
          renderCats();
        });
        box.appendChild(addSecBtn);

        var flatBtn = document.createElement("button");
        flatBtn.type = "button";
        flatBtn.className = "btn-sm btn-warn";
        flatBtn.textContent = "Juntar tudo numa lista simples (sem secções)";
        flatBtn.addEventListener("click", function () {
          if (!confirm("Todos os itens passam para uma única lista; títulos de secção perdem-se. Continuar?"))
            return;
          var all = [];
          (menuData.categories[ci].sections || []).forEach(function (sec) {
            (sec.items || []).forEach(function (it) {
              all.push(it);
            });
          });
          menuData.categories[ci].items = all;
          delete menuData.categories[ci].sections;
          readStoreForm();
          renderCats();
        });
        box.appendChild(flatBtn);
      } else {
        var itemsWrap = document.createElement("div");
        itemsWrap.className = "items-wrap";
        (cat.items || []).forEach(function (item, ii) {
          itemsWrap.appendChild(renderItem(ci, ii, item, null));
        });
        box.appendChild(itemsWrap);

        var rowBtns = document.createElement("div");
        rowBtns.className = "cat-actions";
        rowBtns.innerHTML =
          '<button type="button" class="btn-sm add-item-flat" data-ci="' +
          ci +
          '">+ Item</button>' +
          '<button type="button" class="btn-sm" data-ci="' +
          ci +
          '" data-act="sections">Organizar em secções</button>';
        box.appendChild(rowBtns);

        rowBtns.querySelector(".add-item-flat").addEventListener("click", function () {
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
        rowBtns.querySelector('[data-act="sections"]').addEventListener("click", function () {
          var old = menuData.categories[ci].items || [];
          menuData.categories[ci].sections = [
            {
              title: "Geral",
              subtitle: "",
              items: old.slice(),
            },
          ];
          delete menuData.categories[ci].items;
          readStoreForm();
          renderCats();
        });
      }

      var rmCat = document.createElement("button");
      rmCat.type = "button";
      rmCat.className = "btn-sm rm-cat";
      rmCat.dataset.ci = ci;
      rmCat.textContent = "Remover categoria";
      rmCat.addEventListener("click", function () {
        menuData.categories.splice(ci, 1);
        readStoreForm();
        renderCats();
      });
      box.appendChild(rmCat);

      root.appendChild(box);
    });
  }

  function syncAll() {
    readStoreForm();
    document
      .querySelectorAll(".cat-grid input, .cat-sub input, .cat-theme-label select, .cat-bg-row input")
      .forEach(function (inp) {
        var ci = +inp.dataset.ci;
        var f = inp.getAttribute("data-field");
        var v = inp.value;
        if (f === "id") v = slugify(v);
        if (f === "subtitle" || f === "backgroundUrl") v = v.trim();
        if (menuData.categories[ci]) {
          if (f === "backgroundUrl" && !v) delete menuData.categories[ci].backgroundUrl;
          else menuData.categories[ci][f] = v;
        }
      });
    document.querySelectorAll(".sec-grid input").forEach(function (inp) {
      var ci = +inp.dataset.ci;
      var si = +inp.dataset.si;
      var f = inp.getAttribute("data-field");
      if (menuData.categories[ci] && menuData.categories[ci].sections[si])
        menuData.categories[ci].sections[si][f] = inp.value.trim();
    });
    document.querySelectorAll(".item-grid input").forEach(function (inp) {
      var ci = +inp.dataset.ci;
      var ii = +inp.dataset.ii;
      var f = inp.getAttribute("data-field");
      var v = inp.value;
      if (f === "price") v = parseFloat(v) || 0;
      if (f === "image" && !String(v).trim()) v = null;
      var si = inp.dataset.si;
      if (si === undefined || si === "") {
        if (
          menuData.categories[ci] &&
          menuData.categories[ci].items &&
          menuData.categories[ci].items[ii]
        )
          menuData.categories[ci].items[ii][f] = v;
      } else {
        var sec = menuData.categories[ci].sections[+si];
        if (sec && sec.items && sec.items[ii]) sec.items[ii][f] = v;
      }
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
          ["f-name", "f-wa", "f-headline", "f-subhead", "f-address", "f-logo-image"].forEach(function (id) {
            var el = $(id);
            if (el) el.addEventListener("input", readStoreForm);
          });
          $("f-logo-mode").addEventListener("change", function () {
            toggleLogoFields();
            readStoreForm();
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
      theme: "default",
      items: [],
    });
    renderCats();
  });

  if (sessionStorage.getItem(SESSION_KEY) === "1") start();
  else showLogin();
})();
