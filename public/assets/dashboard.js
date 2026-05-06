const tokenKey = "optizenqor_admin_token";
const userKey = "optizenqor_admin_user";

const authStatus = document.querySelector("#auth-status");
const dashboardPanel = document.querySelector("#dashboard-panel");
const categorySelect = document.querySelector("#product-category");

function unwrap(payload) {
  return payload?.data ?? payload;
}

function setStatus(message, type = "") {
  authStatus.textContent = message;
  authStatus.className = `status-line ${type}`.trim();
}

function initReveal() {
  document.querySelectorAll(".reveal").forEach((node) => node.classList.add("visible"));

  if (typeof IntersectionObserver === "undefined") {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
}

async function request(path, options = {}) {
  const token = localStorage.getItem(tokenKey);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.message || json.error || `Request failed: ${path}`);
  }

  return unwrap(json);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderOverview(overview) {
  const container = document.querySelector("#overview-cards");
  const cards = [
    ["Customers", overview.customers],
    ["Orders", overview.orders],
    ["Products", overview.products],
    ["Open threads", overview.openThreads],
    ["Revenue", `BDT ${Number(overview.totalRevenue || 0).toLocaleString()}`],
  ];

  container.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="overview-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>`,
    )
    .join("");
}

function renderRows(selector, items, mapper) {
  const node = document.querySelector(selector);
  node.innerHTML = items.map(mapper).join("") || '<div class="table-row"><strong>No data yet</strong></div>';
}

function fillCategoryOptions(categories) {
  categorySelect.innerHTML = '<option value="">Primary category</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

async function loadDashboard() {
  const [me, overview, products, customers, orders, features, categories] = await Promise.all([
    request("/auth/me"),
    request("/admin/overview"),
    request("/admin/products"),
    request("/admin/customers"),
    request("/admin/orders"),
    request("/admin/features"),
    request("/categories"),
  ]);

  localStorage.setItem(userKey, JSON.stringify(me));
  document.querySelector("#welcome-title").textContent = `Dashboard overview for ${me.fullName}`;
  renderOverview(overview);
  fillCategoryOptions(categories);

  renderRows(
    "#product-table",
    products.slice(0, 6),
    (item) => `
      <article class="table-row">
        <strong>${item.name}</strong>
        <div class="row-meta">
          <span>${item.primaryCategory?.name || "No category"}</span>
          <span>Stock ${item.stockQuantity}</span>
          <span>${item.status}</span>
        </div>
      </article>`,
  );

  renderRows(
    "#customer-list",
    customers.slice(0, 6),
    (item) => `
      <article class="table-row">
        <strong>${item.fullName}</strong>
        <div class="row-meta">
          <span>${item.email}</span>
          <span>${item.status}</span>
          <span>${item.orders?.length || 0} orders</span>
        </div>
      </article>`,
  );

  renderRows(
    "#order-list",
    orders.slice(0, 6),
    (item) => `
      <article class="table-row">
        <strong>${item.orderNumber || item.id}</strong>
        <div class="row-meta">
          <span>${item.user?.fullName || "Unknown customer"}</span>
          <span>${item.status}</span>
          <span>BDT ${Number(item.total || 0).toLocaleString()}</span>
        </div>
      </article>`,
  );

  renderRows(
    "#feature-list",
    features.slice(0, 6),
    (item) => `
      <article class="table-row">
        <strong>${item.label}</strong>
        <div class="row-meta">
          <span>${item.environment}</span>
          <span>${item.isEnabled ? "Enabled" : "Disabled"}</span>
          <span>${item.rolloutPercentage}% rollout</span>
        </div>
      </article>`,
  );
}

async function login(event) {
  event.preventDefault();
  setStatus("Signing in...");

  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  try {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem(tokenKey, result.tokens.accessToken);
    dashboardPanel.classList.remove("hidden");
    setStatus("Authenticated successfully.", "success");
    await loadDashboard();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function submitCategory(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = String(formData.get("name") || "");
  const slug = slugify(formData.get("slug") || name);

  try {
    await request("/categories", {
      method: "POST",
      body: JSON.stringify({
        name,
        slug,
        bannerTitle: formData.get("bannerTitle"),
        description: formData.get("description"),
        isActive: true,
      }),
    });

    form.reset();
    setStatus("Category created.", "success");
    await loadDashboard();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function submitProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = String(formData.get("name") || "");
  const slug = slugify(formData.get("slug") || name);
  const primaryCategoryId = String(formData.get("primaryCategoryId") || "");

  const payload = {
    name,
    slug,
    sku: String(formData.get("sku") || ""),
    description: String(formData.get("description") || ""),
    shortDescription: String(formData.get("shortDescription") || ""),
    imageUrl: String(formData.get("imageUrl") || ""),
    price: Number(formData.get("price") || 0),
    compareAtPrice: formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : undefined,
    stockQuantity: Number(formData.get("stockQuantity") || 0),
    primaryCategoryId: primaryCategoryId || undefined,
    categoryIds: primaryCategoryId ? [primaryCategoryId] : undefined,
    isFeatured: formData.get("isFeatured") === "on",
    isPopular: formData.get("isPopular") === "on",
    isVisible: formData.get("isVisible") === "on",
    status: "ACTIVE",
  };

  try {
    await request("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    form.reset();
    document.querySelector('input[name="isVisible"]').checked = true;
    setStatus("Product created.", "success");
    await loadDashboard();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function logout() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  dashboardPanel.classList.add("hidden");
  setStatus("Logged out.");
}

async function restoreSession() {
  if (!localStorage.getItem(tokenKey)) return;

  try {
    dashboardPanel.classList.remove("hidden");
    setStatus("Restoring session...");
    await loadDashboard();
    setStatus("Session restored.", "success");
  } catch {
    logout();
  }
}

document.querySelector("#login-form").addEventListener("submit", login);
document.querySelector("#category-form").addEventListener("submit", submitCategory);
document.querySelector("#product-form").addEventListener("submit", submitProduct);
document.querySelector("#refresh-dashboard").addEventListener("click", () => loadDashboard().catch((error) => setStatus(error.message, "error")));
document.querySelector("#logout-button").addEventListener("click", logout);

initReveal();
restoreSession();
