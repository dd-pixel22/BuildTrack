
"use strict";

/* BUILDTRACK FRONTEND DEMO
   Later: connect these actions to a Node.js + MySQL API.
   Do not use this localStorage demo for real customer passwords.
*/

const API_BASE = "https://buildtrack-backend-02wf.onrender.com/api";

const STORAGE = {
  products: "buildtrack_products_v1",
  suppliers: "buildtrack_suppliers_v1",
  users: "buildtrack_users_v1",
  orders: "buildtrack_orders_v1",
  session: "buildtrack_session_v1",
  cart: "buildtrack_cart_v1",
  view: "buildtrack_current_view_v1"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const money = value => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number(value) || 0);

const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

async function apiRequest(path, options = {}) {
  const session = getSession();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || result.error || `Request failed (${response.status})`
    );
  }

  return result;
}

function saveCurrentView(view) {
  currentView = view || "home";
  writeStore(STORAGE.view, currentView);
}

async function refreshProductsFromAPI() {
  try {
    const result = await apiRequest("/products");
    const products = Array.isArray(result) ? result : result.products;

    if (Array.isArray(products)) {
      const existing = getProducts();

      writeStore(STORAGE.products, products.map(p => {
        const old = existing.find(x =>
          String(x.id) === String(p.id) ||
          String(x.databaseId) === String(p.databaseId)
        );

        return {
          ...old,
          ...p,
          id: String(p.id),
          active: p.active !== false
        };
      }));
    }
  } catch (error) {
    console.error("Could not load products from the database:", error);
  }
}

async function refreshSuppliersFromAPI() {
  try {
    const result = await apiRequest("/suppliers");
    const suppliers = Array.isArray(result) ? result : result.suppliers;

    if (Array.isArray(suppliers)) {
      writeStore(STORAGE.suppliers, suppliers);
    }
  } catch (error) {
    console.error("Could not load suppliers from the database:", error);
  }
}


async function refreshOrdersFromAPI() {
  if (!getSession()?.token) return;

  try {
    const result = await apiRequest("/orders");
    const orders = Array.isArray(result) ? result : result.orders;

    if (Array.isArray(orders)) {
      const normalizedOrders = orders.map(order => ({
        ...order,
        id: String(order.id ?? ""),
        customerName: order.customerName || order.customer || "Customer",
        customerEmail: order.customerEmail || order.email || "",
        date: order.date
          ? new Date(order.date).toLocaleString("en-IN")
          : "",
        total: Number(order.total) || 0,
        items: Array.isArray(order.items)
          ? order.items.map(item => ({
              ...item,
              id: String(item.id ?? item.sku ?? ""),
              name: item.name || item.product_name || "Material",
              qty: Number(item.qty ?? item.quantity) || 0,
              price: Number(item.price ?? item.unit_price) || 0
            }))
          : []
      }));

      writeStore(STORAGE.orders, normalizedOrders);
    }
  } catch (error) {
    console.error("Could not load orders from the database:", error);
  }
}


const imageURL = (photo, width = 700) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=80`;

const initialProducts = [
  {
    id: "BT101", name: "Premium Structural Cement", category: "Structural Materials",
    price: 420, unit: "bag", stock: 180, supplierId: "SUP01",
    tag: "BESTSELLER", description: "High-strength cement for reliable foundations and structural work.",
    image: "photo-1513467655676-561b7d489a88", active: true
  },
  {
    id: "BT102", name: "AAC Lightweight Blocks", category: "Advanced Blocks",
    price: 78, unit: "block", stock: 620, supplierId: "SUP02",
    tag: "POPULAR", description: "Lightweight, durable blocks with excellent thermal performance.",
    image: "photo-1600585154340-be6161a56a0c", active: true
  },
  {
    id: "BT103", name: "Architectural Smart Glass", category: "Smart Glass",
    price: 1250, unit: "sq. ft.", stock: 46, supplierId: "SUP03",
    tag: "PREMIUM", description: "Contemporary glass for elegant facades and modern interiors.",
    image: "photo-1497366754035-f200968a6e72", active: true
  },
  {
    id: "BT104", name: "Reinforced Steel Bars", category: "Structural Materials",
    price: 685, unit: "bar", stock: 240, supplierId: "SUP01",
    tag: "ESSENTIAL", description: "Reliable reinforcement steel for structural construction.",
    image: "photo-1504307651254-35680f356dfd", active: true
  },
  {
    id: "BT105", name: "Eco-Friendly Bamboo Panels", category: "Green Materials",
    price: 890, unit: "panel", stock: 74, supplierId: "SUP04",
    tag: "ECO PICK", description: "Renewable decorative panels for sustainable spaces.",
    image: "photo-1511818966892-d7d671e672a2", active: true
  },
  {
    id: "BT106", name: "Thermal Insulation Boards", category: "Energy Efficiency",
    price: 540, unit: "board", stock: 95, supplierId: "SUP04",
    tag: "ENERGY SMART", description: "Insulation boards designed to improve building efficiency.",
    image: "photo-1510798831971-661eb04b3739", active: true
  },
  {
    id: "BT107", name: "Premium Porcelain Tiles", category: "Premium Finishes",
    price: 115, unit: "sq. ft.", stock: 360, supplierId: "SUP05",
    tag: "DESIGN PICK", description: "Refined tile finishes for contemporary residential projects.",
    image: "photo-1600607687939-ce8a6c25118c", active: true
  },
  {
    id: "BT108", name: "Ready-Mix Concrete", category: "Structural Materials",
    price: 5900, unit: "m³", stock: 22, supplierId: "SUP01",
    tag: "PROJECT READY", description: "Convenient ready-mix supply for larger construction projects.",
    image: "photo-1503387762-592deb58ef4e", active: true
  },
  {
    id: "BT109", name: "Reclaimed Timber Boards", category: "Green Materials",
    price: 760, unit: "board", stock: 58, supplierId: "SUP04",
    tag: "SUSTAINABLE", description: "Character-rich timber boards for responsible design.",
    image: "photo-1519710164239-da123dc03ef4", active: true
  },
  {
    id: "BT110", name: "Low-Energy LED Fixtures", category: "Energy Efficiency",
    price: 650, unit: "unit", stock: 120, supplierId: "SUP05",
    tag: "EFFICIENT", description: "Energy-conscious lighting for homes and commercial buildings.",
    image: "photo-1507473885765-e6ed057f782c", active: true
  },
  {
    id: "BT111", name: "Decorative Wall Panels", category: "Premium Finishes",
    price: 460, unit: "panel", stock: 88, supplierId: "SUP05",
    tag: "NEW ARRIVAL", description: "Modern wall panels for polished interior finishes.",
    image: "photo-1600210492486-724fe5c67fb0", active: true
  },
  {
    id: "BT112", name: "High-Performance Window Glass", category: "Smart Glass",
    price: 980, unit: "sq. ft.", stock: 9, supplierId: "SUP03",
    tag: "LIMITED STOCK", description: "Elegant glazing for daylight and contemporary architecture.",
    image: "photo-1600607687920-4e2a09cf159d", active: true
  }
];

const initialSuppliers = [
  { id: "SUP01", name: "Apex Structural Supply", contact: "Apex Sales Team", email: "sales@apex.example", phone: "9000000101", city: "Hyderabad", category: "Structural Materials" },
  { id: "SUP02", name: "BuildCore Blocks", contact: "BuildCore Team", email: "orders@buildcore.example", phone: "9000000102", city: "Bengaluru", category: "Advanced Blocks" },
  { id: "SUP03", name: "ClearView Architectural", contact: "ClearView Team", email: "sales@clearview.example", phone: "9000000103", city: "Chennai", category: "Smart Glass" },
  { id: "SUP04", name: "Earthwise Materials", contact: "Earthwise Team", email: "hello@earthwise.example", phone: "9000000104", city: "Pune", category: "Green Materials" },
  { id: "SUP05", name: "Forma Finishes", contact: "Forma Team", email: "orders@forma.example", phone: "9000000105", city: "Hyderabad", category: "Premium Finishes" }
];

const categories = [
  { name: "Structural Materials", count: "Cement · Steel", image: "photo-1504307651254-35680f356dfd" },
  { name: "Advanced Blocks", count: "AAC · Masonry", image: "photo-1600585154340-be6161a56a0c" },
  { name: "Green Materials", count: "Eco · Renewable", image: "photo-1511818966892-d7d671e672a2" },
  { name: "Smart Glass", count: "Glass · Glazing", image: "photo-1497366754035-f200968a6e72" },
  { name: "Energy Efficiency", count: "Insulation · LED", image: "photo-1510798831971-661eb04b3739" },
  { name: "Premium Finishes", count: "Tiles · Interiors", image: "photo-1600607687939-ce8a6c25118c" }
];

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast("Browser storage is unavailable. Some demo data may not persist.");
  }
}

function seedData() {
  if (!localStorage.getItem(STORAGE.products)) writeStore(STORAGE.products, initialProducts);
  if (!localStorage.getItem(STORAGE.suppliers)) writeStore(STORAGE.suppliers, initialSuppliers);
  if (!localStorage.getItem(STORAGE.users)) writeStore(STORAGE.users, []);
  if (!localStorage.getItem(STORAGE.orders)) writeStore(STORAGE.orders, []);
  if (!localStorage.getItem(STORAGE.cart)) writeStore(STORAGE.cart, []);
}

const getProducts = () => readStore(STORAGE.products, initialProducts);
const saveProducts = value => writeStore(STORAGE.products, value);
const getSuppliers = () => readStore(STORAGE.suppliers, initialSuppliers);
const saveSuppliers = value => writeStore(STORAGE.suppliers, value);
const getUsers = () => readStore(STORAGE.users, []);
const saveUsers = value => writeStore(STORAGE.users, value);
const getOrders = () => readStore(STORAGE.orders, []);
const saveOrders = value => writeStore(STORAGE.orders, value);
const getCart = () => readStore(STORAGE.cart, []);
const saveCart = value => writeStore(STORAGE.cart, value);
const getSession = () => {
  try {
    const session = sessionStorage.getItem(STORAGE.session);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    return null;
  }
};

const setSession = value => {
  try {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(STORAGE.session);
    } else {
      sessionStorage.setItem(STORAGE.session, JSON.stringify(value));
    }
  } catch (error) {
    console.error("Could not save login session:", error);
  }
};

let authMode = "login";
let authRole = "customer";
let currentView = readStore(STORAGE.view, "home");
let currentCategory = "All";
let searchTerm = "";
let sortMode = "featured";
let adminTab = "overview";
let modalState = null;

function toast(message) {
  const root = $("#toast-root");
  if (!root) return;
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  root.replaceChildren(item);
  setTimeout(() => { if (item.isConnected) item.remove(); }, 3000);
}

function getSupplierName(id) {
  return getSuppliers().find(s => s.id === id)?.name || "Unassigned supplier";
}

function initials(name) {
  return String(name || "B").trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();
}

function activeProducts() {
  return getProducts().filter(p => p.active !== false);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartTotal() {
  const products = getProducts();
  return getCart().reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function renderAuth() {
  const register = authMode === "register";
  $("#app").innerHTML = `
    <main class="auth-screen">
      <section class="auth-visual">
        <a class="brand" href="#" data-action="auth-home">
          <span class="brand-symbol">B</span>
          <span><span class="brand-name">BUILDTRACK</span><span class="brand-sub">Materials · Suppliers · Orders</span></span>
        </a>
        <div>
          <span class="eyebrow">A better way to build</span>
          <h1>Good spaces begin with <em>better materials.</em></h1>
          <p>Discover trusted construction supplies, explore thoughtful materials, and keep every project moving with one streamlined platform.</p>
        </div>
        <div class="auth-bottom"><span>Designed for modern construction</span><span>BUILDTRACK © 2026</span></div>
      </section>
      <section class="auth-form-side">
        <div class="auth-form">
          <span class="eyebrow">${register ? "Join the community" : "Welcome to BuildTrack"}</span>
          <h2>${register ? "Create your account" : "Welcome back."}</h2>
          <p>${register ? "Create an account to browse materials and manage your project orders." : "Sign in to explore materials, suppliers and your project dashboard."}</p>
          <div class="role-switch">
            <button type="button" data-action="auth-role" data-role="customer" class="${authRole === "customer" ? "active" : ""}">Customer</button>
            <button type="button" data-action="auth-role" data-role="admin" class="${authRole === "admin" ? "active" : ""}">Administrator</button>
          </div>
          <form id="auth-form">
            ${register ? `
              <div class="form-field"><label for="auth-name">Full name</label><input id="auth-name" name="name" autocomplete="name" required minlength="2" placeholder="e.g. Ananya Rao"></div>
            ` : ""}
            <div class="form-field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div>
            <div class="form-field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" minlength="8" autocomplete="${register ? "new-password" : "current-password"}" required placeholder="At least 8 characters"></div>
            <button class="btn btn-primary btn-block" type="submit">${register ? "Create account →" : "Sign in to BuildTrack →"}</button>
          </form>
          <div class="auth-switch">${register ? "Already have an account?" : "New to BuildTrack?"}
            <button class="text-button" data-action="auth-mode" data-mode="${register ? "login" : "register"}">${register ? "Sign in" : "Create an account"}</button>
          </div>
          <div class="demo-note">
            <strong>Frontend demonstration</strong><br>
            ${authRole === "admin"
              ? "Admin demo: admin@buildtrack.demo · Admin123"
              : "Create a demo customer account, or use the administrator tab to explore management tools."}
            <br>Demo accounts are stored in this browser only. Do not use real passwords.
          </div>
        </div>
      </section>
    </main>`;
}

function brandHTML() {
  return `<a class="brand" href="#" data-action="navigate" data-view="home">
    <span class="brand-symbol">B</span>
    <span><span class="brand-name">BUILDTRACK</span><span class="brand-sub">Materials · Suppliers · Orders</span></span>
  </a>`;
}

function headerHTML() {
  const user = getSession();
  const admin = user?.role === "admin";
  const navItems = admin
    ? [["overview", "Overview"], ["products", "Products"], ["suppliers", "Suppliers"], ["inventory", "Inventory"], ["orders", "Orders"], ["customers", "Customers"]]
    : [["home", "Discover"], ["catalogue", "Materials"], ["suppliers", "Suppliers"], ["orders", "My orders"]];
  return `
    <div class="top-note">THOUGHTFULLY SOURCED MATERIALS · BETTER BUILT PROJECTS</div>
    <header class="site-header">
      <div class="header-inner">
        ${brandHTML()}
        <nav class="main-nav">
          ${navItems.map(([view, label]) => `<button data-action="${admin ? "admin-tab" : "navigate"}" data-view="${view}" data-tab="${view}" class="${(admin ? adminTab : currentView) === view ? "active" : ""}">${label}</button>`).join("")}
        </nav>
        <div class="header-actions">
          ${!admin ? `<label class="header-search"><span>⌕</span><input id="header-search" placeholder="Search materials..." value="${escapeHTML(searchTerm)}" aria-label="Search materials"></label>` : ""}
          ${!admin ? `<button class="icon-btn" aria-label="Open cart" data-action="navigate" data-view="cart">♧<span class="count-badge">${cartCount()}</span></button>` : ""}
          <button class="user-chip" data-action="${admin ? "admin-tab" : "navigate"}" data-view="${admin ? "overview" : "profile"}" data-tab="overview">
            <span class="avatar">${escapeHTML(initials(user?.name))}</span>
            <span><strong>${escapeHTML(user?.name || "Guest")}</strong><small>${admin ? "Administrator" : "Customer account"}</small></span>
          </button>
          <button class="icon-btn mobile-menu" aria-label="Toggle navigation" data-action="mobile-menu">☰</button>
          <button class="btn btn-light btn-sm" data-action="logout">Sign out</button>
        </div>
      </div>
      <nav class="mobile-nav" id="mobile-nav">
        ${navItems.map(([view, label]) => `<button data-action="${admin ? "admin-tab" : "navigate"}" data-view="${view}" data-tab="${view}">${label}</button>`).join("")}
        ${!admin ? `<button data-action="navigate" data-view="cart">Shopping cart (${cartCount()})</button>` : ""}
      </nav>
    </header>`;
}

function footerHTML() {
  return `<footer class="footer"><div class="container footer-inner">
    <div>${brandHTML()}<p>Materials, supplier records and project orders — all in one place.</p></div>
    <div class="footer-links"><a href="#" data-action="navigate" data-view="catalogue">Materials</a><a href="#" data-action="navigate" data-view="suppliers">Suppliers</a><a href="#" data-action="navigate" data-view="orders">Orders</a></div>
    <span class="small">© 2026 BuildTrack · Academic project demo</span>
  </div></footer>`;
}

function categoryCardsHTML() {
  return categories.map(c => `
    <button class="category-card ${currentCategory === c.name ? "selected" : ""}" data-action="category" data-category="${escapeHTML(c.name)}">
      <img src="${imageURL(c.image, 450)}" alt="${escapeHTML(c.name)}" loading="lazy">
      <div class="category-info"><strong>${escapeHTML(c.name)}</strong><span>${escapeHTML(c.count)} ↗</span></div>
    </button>`).join("");
}

function productCardHTML(p) {
  const supplier = getSupplierName(p.supplierId);
  const low = p.stock <= 10;
  return `<article class="product-card">
    <div class="product-image">
      <img src="${imageURL(p.image, 650)}" alt="${escapeHTML(p.name)}" loading="lazy">
      <span class="product-tag">${escapeHTML(p.tag || "MATERIAL")}</span>
    </div>
    <div class="product-body">
      <span class="product-category">${escapeHTML(p.category)}</span>
      <h3>${escapeHTML(p.name)}</h3>
      <p class="product-description">${escapeHTML(p.description)}</p>
      <div class="product-meta">
        <span class="price">${money(p.price)} <small>/ ${escapeHTML(p.unit)}</small></span>
        <span class="stock-label ${low ? "low" : ""}">${p.stock > 0 ? (low ? "Low stock" : "In stock") : "Out of stock"}</span>
      </div>
      <p class="muted small">Supplier: ${escapeHTML(supplier)}</p>
      <div class="product-actions">
        <button class="btn btn-light btn-sm" data-action="product-details" data-id="${escapeHTML(p.id)}">Details</button>
        <button class="btn btn-primary btn-sm" data-action="add-cart" data-id="${escapeHTML(p.id)}" ${p.stock < 1 ? "disabled" : ""}>＋ Add to cart</button>
      </div>
    </div>
  </article>`;
}

function filteredProducts() {
  let products = activeProducts();
  if (currentCategory !== "All") products = products.filter(p => p.category === currentCategory);
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase().trim();
    products = products.filter(p => [p.name, p.category, p.description, getSupplierName(p.supplierId)].some(v => String(v).toLowerCase().includes(q)));
  }
  if (sortMode === "price-low") products.sort((a, b) => a.price - b.price);
  if (sortMode === "price-high") products.sort((a, b) => b.price - a.price);
  if (sortMode === "name") products.sort((a, b) => a.name.localeCompare(b.name));
  return products;
}

function homeHTML() {
  const featured = activeProducts().slice(0, 4);
  return `<main>
    <section class="container hero">
      <div class="hero-panel">
        <div class="hero-copy">
          <span class="eyebrow">The modern materials marketplace</span>
          <h1>Build well.<br>Build <em>beautifully.</em></h1>
          <p>From structural essentials to considered finishes, find quality materials and the suppliers behind them — all in one place.</p>
          <div class="hero-actions">
            <button class="btn btn-primary" data-action="navigate" data-view="catalogue">Explore materials ↗</button>
            <button class="btn btn-light" data-action="navigate" data-view="suppliers">Meet our suppliers</button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><strong>${activeProducts().length}+</strong><span>Material options</span></div>
            <div class="hero-stat"><strong>${getSuppliers().length}+</strong><span>Supplier records</span></div>
            <div class="hero-stat"><strong>One</strong><span>Streamlined workspace</span></div>
          </div>
        </div>
        <div class="hero-image"><img src="${imageURL("photo-1600607687939-ce8a6c25118c", 1000)}" alt="Beautiful modern architectural interior"></div>
      </div>
      <div class="trust-strip">
        <div class="trust-item"><span class="trust-icon">◇</span><div><strong>Curated materials</strong><span>Thoughtful product selection</span></div></div>
        <div class="trust-item"><span class="trust-icon">⌂</span><div><strong>Supplier visibility</strong><span>Know who supplies what</span></div></div>
        <div class="trust-item"><span class="trust-icon">↗</span><div><strong>Order tracking</strong><span>Keep orders organised</span></div></div>
        <div class="trust-item"><span class="trust-icon">▤</span><div><strong>Stock awareness</strong><span>Inventory in one place</span></div></div>
      </div>
    </section>
    <section class="container section" id="categories">
      <div class="section-head"><div><span class="eyebrow">Explore by category</span><h2>Materials for every vision.</h2><p>Find the right materials for each stage of your project.</p></div><button class="btn btn-light" data-action="navigate" data-view="catalogue">View all materials →</button></div>
      <div class="category-grid">${categoryCardsHTML()}</div>
    </section>
    <section class="container section" id="featured">
      <div class="section-head"><div><span class="eyebrow">Selected for you</span><h2>Featured materials.</h2><p>Popular picks for thoughtful building and design.</p></div><button class="btn btn-outline" data-action="navigate" data-view="catalogue">Browse catalogue ↗</button></div>
      <div class="product-grid">${featured.map(productCardHTML).join("")}</div>
    </section>
    <section class="container"><div class="promo-panel">
      <div class="promo-copy"><span class="eyebrow">Better sourcing starts here</span><h2>Good projects begin with good partners.</h2><p>Explore supplier records and discover the businesses behind the materials you use.</p><button class="btn btn-light" data-action="navigate" data-view="suppliers">Explore suppliers →</button></div>
      <div class="promo-image"><img src="${imageURL("photo-1486406146926-c627a92ad1ab", 900)}" alt="Modern architectural building" loading="lazy"></div>
    </div></section>
  </main>`;
}

function catalogueHTML() {
  const products = filteredProducts();
  return `<main class="container page-shell">
    <section class="page-heading"><span class="eyebrow">Materials library</span><h1>Find your next building essential.</h1><p>Browse materials, compare pricing, and add the products you need to your cart.</p></section>
    <div class="product-toolbar">
      <label class="header-search"><span>⌕</span><input id="catalogue-search" placeholder="Search materials or suppliers..." value="${escapeHTML(searchTerm)}" aria-label="Search catalogue"></label>
      <select class="select-control" id="category-select" aria-label="Filter by category">
        ${["All", ...categories.map(c => c.name)].map(c => `<option value="${escapeHTML(c)}" ${currentCategory === c ? "selected" : ""}>${c === "All" ? "All categories" : escapeHTML(c)}</option>`).join("")}
      </select>
      <select class="select-control" id="sort-select" aria-label="Sort products">
        <option value="featured" ${sortMode === "featured" ? "selected" : ""}>Featured first</option>
        <option value="price-low" ${sortMode === "price-low" ? "selected" : ""}>Price: low to high</option>
        <option value="price-high" ${sortMode === "price-high" ? "selected" : ""}>Price: high to low</option>
        <option value="name" ${sortMode === "name" ? "selected" : ""}>Name A–Z</option>
      </select>
    </div>
    <div class="section-head"><div><h2>${currentCategory === "All" ? "All materials" : escapeHTML(currentCategory)}</h2><p>${products.length} products found</p></div><button class="btn btn-light btn-sm" data-action="clear-filters">Reset filters</button></div>
    ${products.length ? `<div class="product-grid">${products.map(productCardHTML).join("")}</div>` : `<div class="panel empty-state"><div class="empty-icon">⌕</div><h3>No materials found</h3><p>Try a different search or clear your filters.</p><button class="btn btn-primary" data-action="clear-filters">Show all materials</button></div>`}
    <div class="notice" style="margin:28px 0">Demo catalogue: product descriptions, prices, stock and suppliers are sample data for an academic project.</div>
  </main>`;
}

function suppliersHTML() {
  const suppliers = getSuppliers();
  return `<main class="container page-shell">
    <section class="page-heading"><span class="eyebrow">Our supply network</span><h1>Meet the suppliers.</h1><p>Explore sample supplier records and the material categories they support.</p></section>
    <div class="category-grid">${suppliers.map(s => {
      const count = getProducts().filter(p => p.supplierId === s.id && p.active !== false).length;
      return `<article class="panel">
        <div class="trust-icon" style="margin-bottom:17px">⌂</div>
        <span class="product-category">${escapeHTML(s.category)}</span>
        <h3 style="margin:9px 0">${escapeHTML(s.name)}</h3>
        <p class="muted small">${escapeHTML(s.city)} · ${count} listed products</p>
        <div class="summary-line"><span>Contact</span><strong>${escapeHTML(s.contact)}</strong></div>
        <div class="summary-line"><span>Email</span><span>${escapeHTML(s.email)}</span></div>
        <div class="summary-line"><span>Phone</span><span>${escapeHTML(s.phone)}</span></div>
        <button class="btn btn-light btn-block" data-action="supplier-products" data-id="${escapeHTML(s.id)}">View their materials →</button>
      </article>`;
    }).join("")}</div>
  </main>`;
}

function statusClass(status) {
  if (status === "Cancelled") return "cancelled";
  if (status === "Delivered" || status === "Approved") return "";
  return "pending";
}

function orderRowsHTML(orders) {
  if (!orders.length) return `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">▤</div><h3>No orders yet</h3><p>Placed orders will appear here.</p></div></td></tr>`;
  return orders.slice().reverse().map(o => `<tr>
    <td><strong>${escapeHTML(o.id)}</strong><br><span class="muted small">${escapeHTML(o.date)}</span></td>
    <td>${escapeHTML(o.customerName || "Customer")}<br><span class="muted small">${escapeHTML(o.customerEmail || "")}</span></td>
    <td>${o.items.reduce((n, item) => n + item.qty, 0)} item(s)</td>
    <td><strong>${money(o.total)}</strong></td>
    <td><span class="status-pill ${statusClass(o.status)}">${escapeHTML(o.status)}</span></td>
    <td><button class="btn btn-light btn-sm" data-action="order-details" data-id="${escapeHTML(o.id)}">Details</button></td>
  </tr>`).join("");
}

function ordersHTML() {
  const user = getSession();
  const orders = user.role === "admin" ? getOrders() : getOrders().filter(o => o.customerEmail === user.email);
  return `<main class="container page-shell">
    <section class="page-heading"><span class="eyebrow">Order management</span><h1>${user.role === "admin" ? "Purchase orders." : "Your orders."}</h1><p>${user.role === "admin" ? "Review orders and update their progress." : "Review your purchase history and order statuses."}</p></section>
    <section class="panel"><div class="panel-head"><h3>${orders.length} order record(s)</h3>${user.role === "admin" ? "" : `<button class="btn btn-primary btn-sm" data-action="navigate" data-view="catalogue">Shop materials</button>`}</div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>${orderRowsHTML(orders)}</tbody></table></div>
    </section>
  </main>`;
}

function cartHTML() {
  const cart = getCart();
  const products = getProducts();
  const items = cart.map(item => ({ ...item, product: products.find(p => p.id === item.id) })).filter(item => item.product);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  return `<main class="container page-shell">
<section class="page-heading"><span class="eyebrow">Your selection</span><h1>Shopping cart.</h1><p>Review your materials before placing your order.</p></section>
    ${items.length ? `<div class="cart-layout">
      <section class="panel"><div class="panel-head"><h3>Selected materials (${cartCount()})</h3><button class="btn btn-light btn-sm" data-action="clear-cart">Clear cart</button></div>
        ${items.map(item => `<div class="cart-item">
          <img src="${imageURL(item.product.image, 250)}" alt="${escapeHTML(item.product.name)}">
          <div><h4>${escapeHTML(item.product.name)}</h4><p>${money(item.product.price)} / ${escapeHTML(item.product.unit)}</p>
            <div class="quantity-control"><button data-action="cart-qty" data-id="${escapeHTML(item.id)}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button data-action="cart-qty" data-id="${escapeHTML(item.id)}" data-delta="1" aria-label="Increase quantity">+</button></div>
          </div>
          <div><strong>${money(item.product.price * item.qty)}</strong><br><button class="text-button" data-action="remove-cart" data-id="${escapeHTML(item.id)}">Remove</button></div>
        </div>`).join("")}
      </section>
      <aside class="panel summary-card"><h3>Order summary</h3>
        <div class="summary-line"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
        <div class="summary-line"><span>Delivery</span><span>Calculated later</span></div>
        <div class="summary-line"><span>Taxes</span><span>Not included</span></div>
        <div class="summary-line total"><span>Estimated total</span><span>${money(subtotal)}</span></div>
        <p class="muted small">This demo does not process real payments.</p>
        <button class="btn btn-primary btn-block" data-action="checkout">Place order →</button>
        <button class="btn btn-light btn-block" data-action="navigate" data-view="catalogue">Continue shopping</button>
      </aside>
    </div>` : `<div class="panel empty-state"><div class="empty-icon">♧</div><h3>Your cart is waiting.</h3><p>Explore the catalogue and add materials to begin your order.</p><button class="btn btn-primary" data-action="navigate" data-view="catalogue">Explore materials →</button></div>`}
  </main>`;
}

function profileHTML() {
  const user = getSession();
  const orders = getOrders().filter(o => o.customerEmail === user.email);
  return `<main class="container page-shell">
    <section class="page-heading"><span class="eyebrow">Your workspace</span><h1>Account details.</h1><p>Review your demo account information and recent orders.</p></section>
    <div class="profile-layout">
      <section class="panel profile-card"><div class="profile-avatar">${escapeHTML(initials(user.name))}</div><h3>${escapeHTML(user.name)}</h3><p>${escapeHTML(user.email)}</p><span class="status-pill">Customer account</span><hr style="border:0;border-top:1px solid var(--line);margin:22px 0"><button class="btn btn-light btn-block" data-action="logout">Sign out</button></section>
      <section class="panel"><div class="panel-head"><h3>Recent orders</h3><button class="btn btn-light btn-sm" data-action="navigate" data-view="orders">All orders</button></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>
        ${orders.length ? orders.slice().reverse().slice(0,5).map(o => `<tr><td><strong>${escapeHTML(o.id)}</strong></td><td>${escapeHTML(o.date)}</td><td>${money(o.total)}</td><td><span class="status-pill ${statusClass(o.status)}">${escapeHTML(o.status)}</span></td></tr>`).join("") : `<tr><td colspan="4" class="muted">You haven't placed any orders yet.</td></tr>`}
        </tbody></table></div>
      </section>
    </div>
  </main>`;
}

function adminOverviewHTML() {
  const products = getProducts();
  const suppliers = getSuppliers();
  const orders = getOrders();
  const customers = getUsers().filter(u => u.role === "customer");
  const revenue = orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.total, 0);
  const lowStock = products.filter(p => p.stock <= 10 && p.active !== false);
  return `<div>
    <div class="section-head"><div><span class="eyebrow">Management workspace</span><h2>Overview</h2><p>A quick view of your materials business.</p></div><button class="btn btn-primary btn-sm" data-action="product-form">＋ Add product</button></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-top">Total products <span class="stat-icon">▦</span></div><div class="stat-number">${products.filter(p => p.active !== false).length}</div><div class="stat-note">Active catalogue items</div></div>
      <div class="stat-card"><div class="stat-top">Suppliers <span class="stat-icon">⌂</span></div><div class="stat-number">${suppliers.length}</div><div class="stat-note">Registered supplier records</div></div>
      <div class="stat-card"><div class="stat-top">Purchase orders <span class="stat-icon">▤</span></div><div class="stat-number">${orders.length}</div><div class="stat-note">Orders recorded in this demo</div></div>
      <div class="stat-card"><div class="stat-top">Order value <span class="stat-icon">₹</span></div><div class="stat-number" style="font-size:22px">${money(revenue)}</div><div class="stat-note">Excluding cancelled orders</div></div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-top">Customers <span class="stat-icon">♙</span></div><div class="stat-number">${customers.length}</div><div class="stat-note">Registered demo customers</div></div>
      <div class="stat-card"><div class="stat-top">Low stock items <span class="stat-icon">!</span></div><div class="stat-number">${lowStock.length}</div><div class="stat-note">Stock at or below 10 units</div></div>
      <div class="stat-card"><div class="stat-top">Categories <span class="stat-icon">◇</span></div><div class="stat-number">${categories.length}</div><div class="stat-note">Material groups</div></div>
      <div class="stat-card"><div class="stat-top">Pending orders <span class="stat-icon">◷</span></div><div class="stat-number">${orders.filter(o => o.status === "Pending").length}</div><div class="stat-note">Awaiting processing</div></div>
    </div>
    <section class="panel" style="margin-bottom:20px"><div class="panel-head"><h3>Recent purchase orders</h3><button class="btn btn-light btn-sm" data-action="admin-tab" data-tab="orders">Manage orders →</button></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>${orderRowsHTML(orders.slice(-5))}</tbody></table></div>
    </section>
    <section class="panel"><div class="panel-head"><h3>Inventory attention</h3><button class="btn btn-light btn-sm" data-action="admin-tab" data-tab="inventory">View inventory →</button></div>
      ${lowStock.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Material</th><th>Category</th><th>Stock</th><th>Supplier</th></tr></thead><tbody>${lowStock.map(p => `<tr><td><strong>${escapeHTML(p.name)}</strong></td><td>${escapeHTML(p.category)}</td><td><span class="status-pill pending">${p.stock} units</span></td><td>${escapeHTML(getSupplierName(p.supplierId))}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted small">No low-stock items at the moment.</p>`}
    </section>
  </div>`;
}

function adminProductsHTML() {
  const products = getProducts();
  return `<section class="panel">
    <div class="panel-head"><div><h3>Product catalogue</h3><p class="muted small" style="margin:5px 0 0">Manage prices, suppliers and stock.</p></div><button class="btn btn-primary btn-sm" data-action="product-form">＋ Add product</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Supplier</th><th>Actions</th></tr></thead><tbody>
    ${products.map(p => `<tr><td><strong>${escapeHTML(p.name)}</strong><br><span class="muted small">${escapeHTML(p.id)}</span></td><td>${escapeHTML(p.category)}</td><td>${money(p.price)} / ${escapeHTML(p.unit)}</td><td><span class="status-pill ${p.stock <= 10 ? "pending" : ""}">${p.stock}</span></td><td>${escapeHTML(getSupplierName(p.supplierId))}</td><td><div class="table-actions"><button class="btn btn-light btn-sm" data-action="product-form" data-id="${escapeHTML(p.id)}">Edit</button><button class="btn btn-danger btn-sm" data-action="delete-product" data-id="${escapeHTML(p.id)}">Delete</button></div></td></tr>`).join("")}
    </tbody></table></div>
  </section>`;
}

function adminSuppliersHTML() {
  const suppliers = getSuppliers();
  return `<section class="panel">
    <div class="panel-head"><div><h3>Supplier records</h3><p class="muted small" style="margin:5px 0 0">Maintain supplier contact information.</p></div><button class="btn btn-primary btn-sm" data-action="supplier-form">＋ Add supplier</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Supplier</th><th>Category</th><th>Location</th><th>Contact</th><th>Products</th><th>Actions</th></tr></thead><tbody>
    ${suppliers.map(s => `<tr><td><strong>${escapeHTML(s.name)}</strong><br><span class="muted small">${escapeHTML(s.id)}</span></td><td>${escapeHTML(s.category)}</td><td>${escapeHTML(s.city)}</td><td>${escapeHTML(s.email)}<br><span class="muted small">${escapeHTML(s.phone)}</span></td><td>${getProducts().filter(p => p.supplierId === s.id).length}</td><td><button class="btn btn-light btn-sm" data-action="supplier-form" data-id="${escapeHTML(s.id)}">Edit</button></td></tr>`).join("")}
    </tbody></table></div>
  </section>`;
}

function adminInventoryHTML() {
  return `<section class="panel">
    <div class="panel-head"><div><h3>Inventory control</h3><p class="muted small" style="margin:5px 0 0">Update stock quantities and monitor low stock.</p></div><button class="btn btn-light btn-sm" data-action="export-products">Export CSV ↓</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Material</th><th>Category</th><th>Current stock</th><th>Unit</th><th>Supplier</th><th>Update</th></tr></thead><tbody>
    ${getProducts().map(p => `<tr><td><strong>${escapeHTML(p.name)}</strong><br><span class="muted small">${escapeHTML(p.id)}</span></td><td>${escapeHTML(p.category)}</td><td><span class="status-pill ${p.stock <= 10 ? "pending" : ""}">${p.stock}</span></td><td>${escapeHTML(p.unit)}</td><td>${escapeHTML(getSupplierName(p.supplierId))}</td><td><button class="btn btn-light btn-sm" data-action="stock-form" data-id="${escapeHTML(p.id)}">Update stock</button></td></tr>`).join("")}
    </tbody></table></div>
  </section>`;
}

function adminCustomersHTML() {
  const users = getUsers().filter(u => u.role === "customer");
  return `<section class="panel">
    <div class="panel-head"><div><h3>Customer accounts</h3><p class="muted small" style="margin:5px 0 0">Accounts registered in this browser demo.</p></div><span class="status-pill">${users.length} customers</span></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Total order value</th></tr></thead><tbody>
    ${users.length ? users.map(u => {
      const orders = getOrders().filter(o => o.customerEmail === u.email);
      return `<tr><td><strong>${escapeHTML(u.name)}</strong></td><td>${escapeHTML(u.email)}</td><td>${orders.length}</td><td>${money(orders.reduce((sum, o) => sum + o.total, 0))}</td></tr>`;
    }).join("") : `<tr><td colspan="4" class="muted">No customer accounts registered yet.</td></tr>`}
    </tbody></table></div>
  </section>`;
}

function adminReportsHTML() {
  const orders = getOrders();
  const products = getProducts();
  const revenue = orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.total, 0);
  const categoryCount = categories.map(c => ({
    name: c.name,
    count: products.filter(p => p.category === c.name).length,
    stock: products.filter(p => p.category === c.name).reduce((sum, p) => sum + p.stock, 0)
  }));
  return `<section class="panel">
    <div class="panel-head"><div><h3>Business reports</h3><p class="muted small" style="margin:5px 0 0">Summary of demo order and inventory data.</p></div><button class="btn btn-primary btn-sm" data-action="export-orders">Export orders CSV ↓</button></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-top">Order value</div><div class="stat-number">${money(revenue)}</div></div>
      <div class="stat-card"><div class="stat-top">Orders placed</div><div class="stat-number">${orders.length}</div></div>
      <div class="stat-card"><div class="stat-top">Units in stock</div><div class="stat-number">${products.reduce((sum, p) => sum + p.stock, 0).toLocaleString("en-IN")}</div></div>
      <div class="stat-card"><div class="stat-top">Low-stock items</div><div class="stat-number">${products.filter(p => p.stock <= 10).length}</div></div>
    </div>
    <h3 style="margin-top:25px">Inventory by category</h3>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Category</th><th>Products</th><th>Total stock units</th></tr></thead><tbody>${categoryCount.map(c => `<tr><td><strong>${escapeHTML(c.name)}</strong></td><td>${c.count}</td><td>${c.stock}</td></tr>`).join("")}</tbody></table></div>
    <p class="muted small" style="margin-top:15px">These reports use sample data stored in your browser. Live database reporting will be added with the backend.</p>
  </section>`;
}

function adminContentHTML() {
  switch (adminTab) {
    case "products": return adminProductsHTML();
    case "suppliers": return adminSuppliersHTML();
    case "inventory": return adminInventoryHTML();
    case "orders": return ordersHTML();
    case "customers": return adminCustomersHTML();
    case "reports": return adminReportsHTML();
    default: return adminOverviewHTML();
  }
}

function adminHTML() {
  return `<main class="container page-shell">
    <section class="page-heading"><span class="eyebrow">BuildTrack control centre</span><h1>Good morning, admin.</h1><p>Manage your catalogue, supplier network, inventory and purchase orders.</p></section>
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="side-label">WORKSPACE</div>
        ${[
          ["overview", "▦", "Overview"], ["products", "◇", "Products"], ["suppliers", "⌂", "Suppliers"],
          ["inventory", "▤", "Inventory"], ["orders", "↗", "Purchase orders"], ["customers", "♙", "Customers"],
          ["reports", "▥", "Reports"]
        ].map(([tab, icon, label]) => `<button class="side-link ${adminTab === tab ? "active" : ""}" data-action="admin-tab" data-tab="${tab}"><span class="side-icon">${icon}</span>${label}</button>`).join("")}
        <div class="side-label" style="margin-top:25px">ACCOUNT</div>
        <button class="side-link" data-action="logout"><span class="side-icon">↪</span>Sign out</button>
      </aside>
      <div class="admin-content">${adminContentHTML()}</div>
    </div>
  </main>`;
}

function renderApp() {
  const user = getSession();
  if (!user) {
    renderAuth();
    return;
  }
  if (user.role === "admin") {
    $("#app").innerHTML = `${headerHTML()}${adminHTML()}${footerHTML()}`;
  } else {
    let page = "";
    if (currentView === "catalogue") page = catalogueHTML();
    else if (currentView === "suppliers") page = suppliersHTML();
    else if (currentView === "cart") page = cartHTML();
    else if (currentView === "orders") page = ordersHTML();
    else if (currentView === "profile") page = profileHTML();
    else page = homeHTML();
    $("#app").innerHTML = `${headerHTML()}${page}${footerHTML()}`;
  }
}

function navigate(view) {
  const user = getSession();
  if (user?.role === "admin") {
    adminTab = view === "home" ? "overview" : view;
  } else {
    saveCurrentView(view);
  }
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function signIn(email, password) {
  email = email.trim().toLowerCase();

  try {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    const user = result.user;

    if (!user || !result.token) {
      toast("Login failed. Please try again.");
      return;
    }

    if (authRole === "admin" && user.role !== "admin") {
      toast("This account does not have administrator access.");
      return;
    }

    if (authRole !== "admin" && user.role !== "customer") {
      toast("Please use the correct login option for your account.");
      return;
    }

    setSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: result.token
    });
     await refreshOrdersFromAPI();

    if (user.role === "admin") {
      adminTab = "overview";
    } else {
      saveCurrentView("home");
    }
     
    renderApp();
    toast(
      user.role === "admin"
        ? "Welcome to the admin workspace."
        : `Welcome back, ${user.name.split(" ")[0]}!`
    );

  } catch (error) {
    toast(error.message || "Login failed. Please check your details.");
  }
}



async function registerCustomer(name, email, password) {
  name = name.trim();
  email = email.trim().toLowerCase();

  if (name.length < 2) {
    toast("Please enter your full name.");
    return;
  }

  if (password.length < 8) {
    toast("Password must contain at least 8 characters.");
    return;
  }

  try {
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    const user = result.user;

    if (!user || !result.token) {
      toast("Registration failed. Please try again.");
      return;
    }

    setSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: result.token
    });

    saveCurrentView("home");
    renderApp();
    toast("Your BuildTrack account was created successfully!");

  } catch (error) {
    toast(error.message || "Registration failed. Please try again.");
  }
}


function addToCart(id) {
  const product = getProducts().find(p => p.id === id);
  if (!product || product.stock < 1) return toast("This material is currently out of stock.");
  const cart = getCart();
  const found = cart.find(item => item.id === id);
  if (found) {
    if (found.qty >= product.stock) return toast("You have reached the available stock quantity.");
    found.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart(cart);
  renderApp();
  toast(`${product.name} added to your cart.`);
}

function updateCartQty(id, delta) {
  const product = getProducts().find(p => p.id === id);
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) {
    saveCart(cart.filter(i => i.id !== id));
  } else if (product && item.qty > product.stock) {
    item.qty = product.stock;
    saveCart(cart);
    toast("Quantity adjusted to available stock.");
  } else {
    saveCart(cart);
  }
  renderApp();
}


async function placeOrder() {
  const user = getSession();

  if (!user || user.role !== "customer") {
    return toast("Please sign in as a customer.");
  }

  const cart = getCart();

  if (!cart.length) {
    return toast("Your cart is empty.");
  }

  const products = getProducts();

  for (const item of cart) {
    const product = products.find(p => String(p.id) === String(item.id));

    if (!product || product.stock < item.qty) {
      return toast("Stock changed. Please review your cart.");
    }
  }

  try {
    const result = await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify({
        items: cart.map(item => ({
          id: item.id,
          qty: item.qty
        }))
      })
    });

    await refreshOrdersFromAPI();

    saveCart([]);
    saveCurrentView("orders");
    renderApp();

    toast(`Order ${result.id || ""} placed successfully!`);
  } catch (error) {
    toast(error.message || "Could not place your order. Please try again.");
  }
}

function showModal(title, subtitle, body) {
  modalState = { title, subtitle, body };
  $("#modal-root")?.remove();
  const root = document.createElement("div");
  root.id = "modal-root";
  document.body.appendChild(root);
  root.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close">
    <section class="modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
      <div class="modal-head"><div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(subtitle || "")}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">✕</button></div>
      ${body}
    </section>
  </div>`;
}

function closeModal() {
  $("#modal-root")?.remove();
  modalState = null;
}

function productForm(id = "") {
  const p = getProducts().find(x => x.id === id);
  const product = p || { name: "", category: categories[0].name, price: "", unit: "unit", stock: "", supplierId: getSuppliers()[0]?.id || "", tag: "NEW", description: "", image: "photo-1600585154340-be6161a56a0c" };
  showModal(p ? "Edit material" : "Add a material", "Product details are saved in this browser demo.", `
    <form id="product-form" data-id="${escapeHTML(id)}">
      <div class="form-grid">
        <div class="form-field full"><label>Product name</label><input name="name" required value="${escapeHTML(product.name)}" placeholder="Material name"></div>
        <div class="form-field"><label>Category</label><select name="category">${categories.map(c => `<option ${product.category === c.name ? "selected" : ""}>${escapeHTML(c.name)}</option>`).join("")}</select></div>
        <div class="form-field"><label>Supplier</label><select name="supplierId">${getSuppliers().map(s => `<option value="${escapeHTML(s.id)}" ${product.supplierId === s.id ? "selected" : ""}>${escapeHTML(s.name)}</option>`).join("")}</select></div>
        <div class="form-field"><label>Price (₹)</label><input name="price" type="number" min="1" step="1" required value="${escapeHTML(product.price)}"></div>
        <div class="form-field"><label>Stock quantity</label><input name="stock" type="number" min="0" step="1" required value="${escapeHTML(product.stock)}"></div>
        <div class="form-field"><label>Unit</label><input name="unit" required value="${escapeHTML(product.unit)}" placeholder="bag, block, panel..."></div>
        <div class="form-field"><label>Tag</label><input name="tag" value="${escapeHTML(product.tag)}"></div>
        <div class="form-field full"><label>Description</label><textarea name="description" required>${escapeHTML(product.description)}</textarea></div>
        <div class="form-field full"><label>Unsplash photo ID (optional)</label><input name="image" value="${escapeHTML(product.image)}"><span class="form-note">Use a photo ID like photo-1600585154340-be6161a56a0c. Existing IDs work best.</span></div>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:20px" type="submit">${p ? "Save changes" : "Create product"}</button>
    </form>`);
}

function supplierForm(id = "") {
  const s = getSuppliers().find(x => x.id === id) || { name: "", contact: "", email: "", phone: "", city: "", category: categories[0].name };
  showModal(id ? "Edit supplier" : "Add supplier", "Maintain supplier contact records.", `
    <form id="supplier-form" data-id="${escapeHTML(id)}"><div class="form-grid">
      <div class="form-field full"><label>Supplier name</label><input name="name" required value="${escapeHTML(s.name)}"></div>
      <div class="form-field"><label>Contact person / team</label><input name="contact" required value="${escapeHTML(s.contact)}"></div>
      <div class="form-field"><label>Email</label><input name="email" type="email" required value="${escapeHTML(s.email)}"></div>
      <div class="form-field"><label>Phone</label><input name="phone" required value="${escapeHTML(s.phone)}"></div>
      <div class="form-field"><label>City</label><input name="city" required value="${escapeHTML(s.city)}"></div>
      <div class="form-field full"><label>Primary category</label><select name="category">${categories.map(c => `<option ${s.category === c.name ? "selected" : ""}>${escapeHTML(c.name)}</option>`).join("")}</select></div>
    </div><button class="btn btn-primary btn-block" style="margin-top:20px" type="submit">${id ? "Save supplier" : "Create supplier"}</button></form>`);
}

function stockForm(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  showModal("Update inventory", p.name, `
    <form id="stock-form" data-id="${escapeHTML(id)}">
      <div class="form-field"><label>Current stock</label><input value="${p.stock}" disabled></div>
      <div class="form-field" style="margin-top:14px"><label>New stock quantity</label><input name="stock" type="number" min="0" step="1" required value="${p.stock}"></div>
      <button class="btn btn-primary btn-block" style="margin-top:20px" type="submit">Save stock quantity</button>
    </form>`);
}

function productDetails(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  showModal(p.name, p.category, `
    <img src="${imageURL(p.image, 800)}" alt="${escapeHTML(p.name)}" style="width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-bottom:18px">
    <p style="line-height:1.8;color:var(--muted)">${escapeHTML(p.description)}</p>
    <div class="summary-line"><span>Price</span><strong>${money(p.price)} / ${escapeHTML(p.unit)}</strong></div>
    <div class="summary-line"><span>Availability</span><strong>${p.stock} units</strong></div>
    <div class="summary-line"><span>Supplier</span><strong>${escapeHTML(getSupplierName(p.supplierId))}</strong></div>
    <button class="btn btn-primary btn-block" style="margin-top:20px" data-action="modal-add-cart" data-id="${escapeHTML(id)}">＋ Add to cart</button>`);
}

function orderDetails(id) {
  const order = getOrders().find(o => o.id === id);
  if (!order) return;
  const user = getSession();
  if (user.role !== "admin" && order.customerEmail !== user.email) return toast("You cannot view this order.");
  const statusControl = user.role === "admin" ? `
    <form id="order-status-form" data-id="${escapeHTML(id)}" style="margin-top:18px">
      <div class="form-field"><label>Update order status</label><select name="status">${["Pending", "Approved", "Processing", "Delivered", "Cancelled"].map(s => `<option ${order.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <button class="btn btn-primary btn-block" style="margin-top:12px">Update status</button>
    </form>` : "";
  showModal(`Order ${order.id}`, `Placed on ${order.date}`, `
    <div class="summary-line"><span>Customer</span><strong>${escapeHTML(order.customerName)}</strong></div>
    <div class="summary-line"><span>Status</span><span class="status-pill ${statusClass(order.status)}">${escapeHTML(order.status)}</span></div>
    <h4 style="margin-top:20px">Items ordered</h4>
    ${order.items.map(item => `<div class="summary-line"><span>${escapeHTML(item.name)} × ${item.qty}</span><strong>${money(item.price * item.qty)}</strong></div>`).join("")}
    <div class="summary-line total"><span>Total</span><span>${money(order.total)}</span></div>${statusControl}`);
}

function deleteProduct(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Delete "${p.name}" from the demo catalogue?`)) return;
  saveProducts(getProducts().filter(x => x.id !== id));
  saveCart(getCart().filter(x => x.id !== id));
  renderApp();
  toast("Product removed.");
}

function exportCSV(type) {
  let rows;
  let filename;
  if (type === "products") {
    rows = [["ID", "Name", "Category", "Price", "Unit", "Stock", "Supplier"], ...getProducts().map(p => [p.id, p.name, p.category, p.price, p.unit, p.stock, getSupplierName(p.supplierId)])];
    filename = "buildtrack-inventory.csv";
  } else {
    rows = [["Order ID", "Customer", "Email", "Date", "Items", "Total", "Status"], ...getOrders().map(o => [o.id, o.customerName, o.customerEmail, o.date, o.items.map(i => `${i.name} x${i.qty}`).join("; "), o.total, o.status])];
    filename = "buildtrack-orders.csv";
  }
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast("CSV export prepared.");
}

document.addEventListener("submit", async event => {
  const form = event.target;
  if (!form.matches("form")) return;
  event.preventDefault();
  const data = new FormData(form);

  if (form.id === "auth-form") {
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");
    if (authMode === "register") registerCustomer(String(data.get("name") || ""), email, password);
    else signIn(email, password);
  }

  if (form.id === "product-form") {
    const id = form.dataset.id;
    const fields = {
      name: String(data.get("name")).trim(),
      category: String(data.get("category")),
      supplierId: String(data.get("supplierId")),
      price: Number(data.get("price")),
      stock: Number(data.get("stock")),
      unit: String(data.get("unit")).trim(),
      tag: String(data.get("tag") || "MATERIAL").trim(),
      description: String(data.get("description")).trim(),
      image: String(data.get("image") || "photo-1600585154340-be6161a56a0c").trim(),
      active: true
    };
    if (!fields.name || fields.price <= 0 || fields.stock < 0) return toast("Check the product name, price and stock.");
    const products = getProducts();
    if (id) saveProducts(products.map(p => p.id === id ? { ...p, ...fields } : p));
    else saveProducts([...products, { id: `BT${Date.now().toString().slice(-6)}`, ...fields }]);
    closeModal();
    renderApp();
    toast(id ? "Product updated." : "Product added.");
  }

  if (form.id === "supplier-form") {
    const id = form.dataset.id;
    const fields = {
      name: String(data.get("name")).trim(),
      contact: String(data.get("contact")).trim(),
      email: String(data.get("email")).trim(),
      phone: String(data.get("phone")).trim(),
      city: String(data.get("city")).trim(),
      category: String(data.get("category"))
    };
    const suppliers = getSuppliers();
    if (id) saveSuppliers(suppliers.map(s => s.id === id ? { ...s, ...fields } : s));
    else saveSuppliers([...suppliers, { id: `SUP${Date.now().toString().slice(-5)}`, ...fields }]);
    closeModal();
    renderApp();
    toast(id ? "Supplier updated." : "Supplier added.");
  }

  if (form.id === "stock-form") {
    const id = form.dataset.id;
    const stock = Number(data.get("stock"));
    if (!Number.isInteger(stock) || stock < 0) return toast("Enter a valid stock quantity.");
    saveProducts(getProducts().map(p => p.id === id ? { ...p, stock } : p));
    closeModal();
    renderApp();
    toast("Inventory updated.");
  }

  if (form.id === "order-status-form") {
  const id = form.dataset.id;
  const status = String(data.get("status"));
  const order = getOrders().find(o => String(o.id) === String(id));

  if (!order) {
    toast("Order not found. Please refresh and try again.");
    return;
  }

  try {
    await apiRequest(
      `/orders/${encodeURIComponent(order.databaseId || order.id)}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status })
      }
    );

    await refreshOrdersFromAPI();
    closeModal();
    renderApp();
    toast("Order status updated successfully.");
  } catch (error) {
    toast(error.message || "Could not update order status.");
  }
}
});

document.addEventListener("input", event => {
  if (event.target.id === "header-search" || event.target.id === "catalogue-search") {
    searchTerm = event.target.value;
    if (event.target.id === "header-search") currentView = "catalogue";
    if (event.target.id === "catalogue-search") {
      const input = event.target;
      const position = input.selectionStart;
      renderApp();
      const replacement = $("#catalogue-search");
      if (replacement) {
        replacement.focus();
        replacement.setSelectionRange(position, position);
      }
      return;
    }
    renderApp();
  }
});

document.addEventListener("change", event => {
  if (event.target.id === "category-select") {
    currentCategory = event.target.value;
    renderApp();
  }
  if (event.target.id === "sort-select") {
    sortMode = event.target.value;
    renderApp();
  }
});

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const view = button.dataset.view;
  const tab = button.dataset.tab;

  if (action === "auth-home") {
    event.preventDefault();
    authMode = "login";
    renderAuth();
  }
  if (action === "auth-mode") {
    authMode = button.dataset.mode;
    renderAuth();
  }
  if (action === "auth-role") {
    authRole = button.dataset.role;
    renderAuth();
  }
  if (action === "navigate") {
    event.preventDefault();
    if (view === "catalogue" && currentView !== "catalogue") currentCategory = "All";
    navigate(view);
  }
  if (action === "admin-tab") {
    adminTab = tab || view || "overview";
    renderApp();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (action === "logout") {
    setSession(null);
    currentView = "home";
    authMode = "login";
    authRole = "customer";
    renderAuth();
    toast("You have signed out.");
  }
  if (action === "mobile-menu") $("#mobile-nav")?.classList.toggle("open");
  if (action === "category") {
    currentCategory = button.dataset.category;
    currentView = "catalogue";
    renderApp();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (action === "clear-filters") {
    currentCategory = "All";
    searchTerm = "";
    sortMode = "featured";
    currentView = "catalogue";
    renderApp();
  }
  if (action === "add-cart" || action === "modal-add-cart") {
    addToCart(id);
    if (action === "modal-add-cart") closeModal();
  }
  if (action === "product-details") productDetails(id);
  if (action === "supplier-products") {
    const supplier = getSuppliers().find(s => s.id === id);
    searchTerm = supplier?.name || "";
    currentCategory = "All";
    currentView = "catalogue";
    renderApp();
  }
  if (action === "cart-qty") updateCartQty(id, Number(button.dataset.delta));
  if (action === "remove-cart") {
    saveCart(getCart().filter(item => item.id !== id));
    renderApp();
    toast("Item removed from cart.");
  }
  if (action === "clear-cart") {
    if (confirm("Remove all items from your cart?")) {
      saveCart([]);
      renderApp();
      toast("Cart cleared.");
    }
  }
  if (action === "checkout") placeOrder();
  if (action === "product-form") productForm(id || "");
  if (action === "supplier-form") supplierForm(id || "");
  if (action === "stock-form") stockForm(id);
  if (action === "delete-product") deleteProduct(id);
  if (action === "order-details") orderDetails(id);
  if (action === "export-products") exportCSV("products");
  if (action === "export-orders") exportCSV("orders");
  if (action === "close-modal") closeModal();
  if (action === "backdrop-close" && event.target === button) closeModal();
});


async function initBuildTrack() {
  seedData();

  await refreshProductsFromAPI();
  await refreshSuppliersFromAPI();
  await refreshOrdersFromAPI();

  renderApp();
}

initBuildTrack();

