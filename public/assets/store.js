const state = {
  homepage: null,
  products: [],
  categories: [],
  offers: [],
};

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const $ = (selector) => document.querySelector(selector);

function unwrap(payload) {
  return payload?.data ?? payload;
}

async function api(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return unwrap(await response.json());
}

function formatPrice(value) {
  return currency.format(Number(value || 0));
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
}

function renderHero() {
  const hero = state.homepage?.find((section) => section.key === "hero");
  if (!hero) return;

  $("#hero-title").textContent = hero.title || $("#hero-title").textContent;
  $("#hero-subtitle").textContent = hero.subtitle || $("#hero-subtitle").textContent;
  $("#hero-highlight").textContent =
    hero.contentJson?.highlight || hero.contentJson?.ctaLabel || $("#hero-highlight").textContent;
}

function renderMetrics() {
  $("#metric-products").textContent = String(state.products.length);
  $("#metric-categories").textContent = String(state.categories.length);
  $("#metric-offers").textContent = String(state.offers.length);
}

function renderCategoryFilter() {
  const select = $("#category-filter");
  select.innerHTML = '<option value="">All categories</option>';

  state.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    select.appendChild(option);
  });
}

function renderCategories() {
  const grid = $("#category-grid");
  grid.innerHTML = "";

  state.categories.forEach((category, index) => {
    const card = document.createElement("article");
    card.className = "category-card";
    card.innerHTML = `
      <span class="card-pill">${String(index + 1).padStart(2, "0")}</span>
      <h3>${category.name}</h3>
      <p>${category.description || "Curated products for modern routines and better consistency."}</p>
      <small>${category.bannerTitle || "Explore the collection"}</small>
    `;
    grid.appendChild(card);
  });
}

function renderOffers() {
  const grid = $("#offer-grid");
  grid.innerHTML = "";

  if (!state.offers.length) {
    grid.innerHTML = '<article class="offer-card"><h3>No active offers</h3><p>Create offers in the backend to feature them here.</p></article>';
    return;
  }

  state.offers.forEach((offer) => {
    const card = document.createElement("article");
    card.className = "offer-card";
    card.innerHTML = `
      <span class="card-pill">${offer.label || "Campaign"}</span>
      <h3>${offer.slug}</h3>
      <p>${offer.description || "Promotional messaging ready for the storefront."}</p>
      <small>${offer.isActive ? "Active now" : "Inactive"}</small>
    `;
    grid.appendChild(card);
  });
}

function getFilteredProducts() {
  const search = $("#search-input").value.trim().toLowerCase();
  const categoryId = $("#category-filter").value;

  return state.products.filter((product) => {
    const matchesSearch =
      !search ||
      [product.name, product.description, product.sku].some((value) =>
        String(value || "").toLowerCase().includes(search),
      );

    const categoryIds = [
      product.primaryCategoryId,
      ...(product.categories || []).map((item) => item.categoryId),
    ].filter(Boolean);

    const matchesCategory = !categoryId || categoryIds.includes(categoryId);
    return matchesSearch && matchesCategory;
  });
}

function renderProducts() {
  const grid = $("#product-grid");
  const empty = $("#product-empty");
  const filtered = getFilteredProducts();
  grid.innerHTML = "";

  empty.classList.toggle("hidden", filtered.length > 0);

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    const categoryName = product.primaryCategory?.name || "General";
    card.innerHTML = `
      <span class="card-pill">${categoryName}</span>
      <h3>${product.name}</h3>
      <p>${product.shortDescription || product.description || "Live product item from the backend."}</p>
      <div class="price-row">
        <strong>${formatPrice(product.price)}</strong>
        ${product.compareAtPrice ? `<del>${formatPrice(product.compareAtPrice)}</del>` : ""}
      </div>
      <div class="row-meta">
        <span class="status-pill">${product.stockQuantity} in stock</span>
        ${product.isFeatured ? '<span class="status-pill">Featured</span>' : ""}
        ${product.isPopular ? '<span class="status-pill">Popular</span>' : ""}
      </div>
    `;
    grid.appendChild(card);
  });
}

async function bootstrap() {
  initReveal();

  try {
    const [homepage, products, categories, offers] = await Promise.all([
      api("/homepage"),
      api("/products"),
      api("/categories"),
      api("/offers"),
    ]);

    state.homepage = homepage;
    state.products = products;
    state.categories = categories.filter((category) => category.isActive !== false);
    state.offers = offers.filter((offer) => offer.isActive !== false);

    renderHero();
    renderMetrics();
    renderCategoryFilter();
    renderCategories();
    renderOffers();
    renderProducts();

    $("#search-input").addEventListener("input", renderProducts);
    $("#category-filter").addEventListener("change", renderProducts);
  } catch (error) {
    $("#product-grid").innerHTML =
      '<article class="product-card"><h3>Unable to load storefront data</h3><p>Start the API, run the seed, and refresh this page.</p></article>';
  }
}

bootstrap();
