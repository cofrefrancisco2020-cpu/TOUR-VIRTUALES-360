const STORAGE_KEY = "nadir-tours-prototype";
const supabaseConfig = window.NADIR_SUPABASE || {};
const hasSupabaseConfig =
  supabaseConfig.url &&
  supabaseConfig.anonKey &&
  !supabaseConfig.anonKey.includes("PEGA_AQUI");
const db = hasSupabaseConfig ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
let currentUser = null;

const iconByType = {
  scene: "↗",
  floor: "⌄",
  info: "i",
  video: "▶",
  drone: "✈",
  image: "▧",
  object: "3D",
  surface_text: "Txt",
  whatsapp: "W",
  lead: "@",
};

const typeLabel = {
  scene: "Escena",
  floor: "Piso",
  info: "Info",
  video: "Video",
  drone: "Dron",
  image: "Imagen",
  object: "3D",
  surface_text: "Texto pared",
  whatsapp: "WhatsApp",
  lead: "Contacto",
};

let state = loadState();
const route = new URLSearchParams(location.search);
let activeTourId = state.activeTourId || state.tours[0].id;
let activeSceneId = getActiveTour().activeSceneId || getActiveTour().scenes[0].id;
let activeHotspotId = null;
let viewer = null;
let placementMode = false;
let movingHotspotId = null;

const els = {
  tourList: document.querySelector("#tourList"),
  sceneList: document.querySelector("#sceneList"),
  hotspotList: document.querySelector("#hotspotList"),
  panorama: document.querySelector("#panorama"),
  tourTitle: document.querySelector("#tourTitle"),
  tourSlug: document.querySelector("#tourSlug"),
  tourAccess: document.querySelector("#tourAccess"),
  tourPassword: document.querySelector("#tourPassword"),
  sceneUpload: document.querySelector("#sceneUpload"),
  brandName: document.querySelector("#brandName"),
  brandLogoUpload: document.querySelector("#brandLogoUpload"),
  brandLogoUrl: document.querySelector("#brandLogoUrl"),
  hotspotType: document.querySelector("#hotspotType"),
  hotspotLabel: document.querySelector("#hotspotLabel"),
  hotspotTarget: document.querySelector("#hotspotTarget"),
  hotspotContent: document.querySelector("#hotspotContent"),
  hotspotColor: document.querySelector("#hotspotColor"),
  hotspotStyle: document.querySelector("#hotspotStyle"),
  hotspotTransition: document.querySelector("#hotspotTransition"),
  hotspotSize: document.querySelector("#hotspotSize"),
  hotspotRotate: document.querySelector("#hotspotRotate"),
  hotspotTiltX: document.querySelector("#hotspotTiltX"),
  hotspotTiltY: document.querySelector("#hotspotTiltY"),
  hotspotOpacity: document.querySelector("#hotspotOpacity"),
  transformGrid: document.querySelector(".transform-grid"),
  placeHotspotBtn: document.querySelector("#placeHotspotBtn"),
  addCenterHotspotBtn: document.querySelector("#addCenterHotspotBtn"),
  deleteHotspotBtn: document.querySelector("#deleteHotspotBtn"),
  centerStartBtn: document.querySelector("#centerStartBtn"),
  newTourBtn: document.querySelector("#newTourBtn"),
  saveBtn: document.querySelector("#saveBtn"),
  shareBtn: document.querySelector("#shareBtn"),
  publicLink: document.querySelector("#publicLink"),
  iframeCode: document.querySelector("#iframeCode"),
  modal: document.querySelector("#modal"),
  modalTitle: document.querySelector("#modalTitle"),
  modalBody: document.querySelector("#modalBody"),
  closeModalBtn: document.querySelector("#closeModalBtn"),
};

start();

async function start() {
  if (db) {
    const { data } = await db.auth.getUser();
    currentUser = data.user;
  }

  if (route.has("embed") || route.has("preview")) {
    await loadPublicTourFromSupabase();
    renderPublicExperience();
    return;
  }

  if (db && currentUser) {
    await loadToursFromSupabase();
  }

  bindEvents();
  render();
  renderConnectionPanel();
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const image = createDemoPanorama();
  return {
    activeTourId: "tour-demo",
    tours: [
      {
        id: "tour-demo",
        title: "Casa piloto demo",
        slug: "casa-piloto-demo",
        access: "public",
        password: "",
        brandName: "Nadir Tours",
        brandLogoUrl: "",
        activeSceneId: "scene-living",
        scenes: [
          {
            id: "scene-living",
            title: "Living principal",
            image,
            hfov: 100,
            yaw: 0,
            pitch: 0,
            hotspots: [
              {
                id: "hotspot-1",
                type: "floor",
                yaw: 42,
                pitch: -28,
              label: "Ir a terraza",
              targetSceneId: "scene-terrace",
              content: "",
              color: "#1f9d8a",
              style: "arrow",
              transition: "push",
              },
              {
                id: "hotspot-2",
                type: "info",
                yaw: -34,
                pitch: 2,
              label: "Terminaciones",
              targetSceneId: "",
              content: "Piso vinílico SPC, ventanas termopanel y cocina integrada.",
              color: "#e2b45c",
              style: "pin",
              transition: "fade",
              },
            ],
          },
          {
            id: "scene-terrace",
            title: "Terraza",
            image,
            hfov: 100,
            yaw: 120,
            pitch: 0,
            hotspots: [
              {
                id: "hotspot-3",
                type: "scene",
                yaw: -110,
                pitch: -12,
              label: "Volver al living",
              targetSceneId: "scene-living",
              content: "",
              color: "#1f9d8a",
              style: "pulse",
              transition: "push",
              },
              {
                id: "hotspot-4",
                type: "whatsapp",
                yaw: 8,
                pitch: 4,
              label: "Agendar visita",
              targetSceneId: "",
              content: "+56912345678",
              color: "#25d366",
              style: "label",
              transition: "fade",
              },
            ],
          },
        ],
      },
    ],
  };
}

function createEmptyRemoteState() {
  const tourId = crypto.randomUUID();
  const sceneId = crypto.randomUUID();
  return {
    activeTourId: tourId,
    tours: [
      {
        id: tourId,
        title: "Nuevo tour inmobiliario",
        slug: "nuevo-tour",
        access: "draft",
        password: "",
        brandName: "Perspective360",
        brandLogoUrl: "",
        activeSceneId: sceneId,
        scenes: [
          {
            id: sceneId,
            title: "Escena inicial",
            image: createDemoPanorama(),
            imagePath: "",
            hfov: 100,
            yaw: 0,
            pitch: 0,
            hotspots: [],
          },
        ],
      },
    ],
  };
}

async function loadToursFromSupabase() {
  if (!db || !currentUser) return;

  const { data: tours, error: tourError } = await db.from("tours").select("*").order("created_at", { ascending: false });
  if (tourError) throw tourError;

  if (!tours.length) {
    state = createEmptyRemoteState();
    activeTourId = state.activeTourId;
    activeSceneId = getActiveTour().activeSceneId;
    activeHotspotId = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return;
  }

  const tourIds = tours.map((tour) => tour.id);
  const { data: scenes, error: sceneError } = await db.from("scenes").select("*").in("tour_id", tourIds).order("sort_order", { ascending: true });
  if (sceneError) throw sceneError;

  const sceneIds = scenes.map((scene) => scene.id);
  const { data: hotspots, error: hotspotError } = sceneIds.length
    ? await db.from("hotspots").select("*").in("scene_id", sceneIds)
    : { data: [], error: null };
  if (hotspotError) throw hotspotError;

  state = {
    activeTourId: tours[0].id,
    tours: tours.map((tour) => ({
      id: tour.id,
      title: tour.title,
      slug: tour.slug,
      access: tour.access,
      password: tour.password_hash || "",
      brandName: tour.brand_name || "Perspective360",
      brandLogoUrl: tour.brand_logo_url || "",
      activeSceneId: scenes.find((scene) => scene.tour_id === tour.id)?.id,
      scenes: scenes
        .filter((scene) => scene.tour_id === tour.id)
        .map((scene) => ({
          id: scene.id,
          title: scene.title,
          image: scene.image_url,
          imagePath: scene.image_path,
          hfov: Number(scene.hfov),
          yaw: Number(scene.yaw),
          pitch: Number(scene.pitch),
          hotspots: hotspots
            .filter((hotspot) => hotspot.scene_id === scene.id)
            .map((hotspot) => ({
              id: hotspot.id,
              type: hotspot.type,
              yaw: Number(hotspot.yaw),
              pitch: Number(hotspot.pitch),
              label: hotspot.label,
              targetSceneId: hotspot.target_scene_id || "",
              content: hotspot.content || "",
              color: hotspot.color,
              style: hotspot.style || "pin",
              transition: hotspot.transition || "push",
              meta: hotspot.meta || hotspot.metadata || {},
            })),
        })),
    })),
  };

  state.tours.forEach((tour) => {
    if (!tour.scenes.length) {
      const sceneId = crypto.randomUUID();
      tour.activeSceneId = sceneId;
      tour.scenes.push({
        id: sceneId,
        title: "Escena inicial",
        image: createDemoPanorama(),
        imagePath: "",
        hfov: 100,
        yaw: 0,
        pitch: 0,
        hotspots: [],
      });
    }
  });

  activeTourId = state.activeTourId;
  activeSceneId = getActiveTour().activeSceneId || getActiveTour().scenes[0].id;
  activeHotspotId = null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadPublicTourFromSupabase() {
  if (!db) return;
  const slug = route.get("tour");
  if (!slug) return;

  const { data: tour, error: tourError } = await db.from("tours").select("*").eq("slug", slug).single();
  if (tourError || !tour) return;

  const { data: scenes, error: sceneError } = await db.from("scenes").select("*").eq("tour_id", tour.id).order("sort_order", { ascending: true });
  if (sceneError) return;

  const sceneIds = scenes.map((scene) => scene.id);
  const { data: hotspots } = sceneIds.length
    ? await db.from("hotspots").select("*").in("scene_id", sceneIds)
    : { data: [] };

  state = {
    activeTourId: tour.id,
    tours: [
      {
        id: tour.id,
        title: tour.title,
        slug: tour.slug,
        access: tour.access,
        password: tour.password_hash || "",
        brandName: tour.brand_name || "Perspective360",
        brandLogoUrl: tour.brand_logo_url || "",
        activeSceneId: scenes[0]?.id,
        scenes: scenes.map((scene) => ({
          id: scene.id,
          title: scene.title,
          image: scene.image_url,
          imagePath: scene.image_path,
          hfov: Number(scene.hfov),
          yaw: Number(scene.yaw),
          pitch: Number(scene.pitch),
          hotspots: (hotspots || [])
            .filter((hotspot) => hotspot.scene_id === scene.id)
            .map((hotspot) => ({
              id: hotspot.id,
              type: hotspot.type,
              yaw: Number(hotspot.yaw),
              pitch: Number(hotspot.pitch),
              label: hotspot.label,
              targetSceneId: hotspot.target_scene_id || "",
              content: hotspot.content || "",
              color: hotspot.color,
              style: hotspot.style || "pin",
              transition: hotspot.transition || "push",
              meta: hotspot.meta || hotspot.metadata || {},
            })),
        })),
      },
    ],
  };

  if (!state.tours[0].scenes.length) return;
  activeTourId = tour.id;
  activeSceneId = state.tours[0].activeSceneId;
}

async function persistActiveTour() {
  const tour = getActiveTour();
  if (!tour || !tour.id || !isUuid(tour.id)) return;
  showStatus("Guardando en Supabase...");

  const tourPayload = {
    id: tour.id,
    title: tour.title,
    slug: tour.slug,
    access: tour.access,
    password_hash: tour.password || null,
    brand_name: tour.brandName || "Perspective360",
    brand_logo_url: tour.brandLogoUrl || null,
  };
  let { error: tourError } = await db.from("tours").upsert(tourPayload);
  if (tourError && tourError.message?.includes("brand_logo_url")) {
    delete tourPayload.brand_logo_url;
    ({ error: tourError } = await db.from("tours").upsert(tourPayload));
  }
  if (tourError) throw tourError;

  for (const [index, scene] of tour.scenes.entries()) {
    if (!isUuid(scene.id)) continue;
    const { error: sceneError } = await db.from("scenes").upsert({
      id: scene.id,
      tour_id: tour.id,
      title: scene.title,
      image_url: scene.image,
      image_path: scene.imagePath || null,
      sort_order: index,
      yaw: scene.yaw || 0,
      pitch: scene.pitch || 0,
      hfov: scene.hfov || 100,
    });
    if (sceneError) throw sceneError;

    for (const hotspot of scene.hotspots) {
      if (!isUuid(hotspot.id)) continue;
      const payload = {
        id: hotspot.id,
        scene_id: scene.id,
        type: hotspot.type,
        yaw: hotspot.yaw,
        pitch: hotspot.pitch,
        label: hotspot.label || "Hotspot",
        target_scene_id: hotspot.targetSceneId || null,
        content: hotspot.content || null,
        color: hotspot.color || "#1f9d8a",
        style: hotspot.style || "pin",
        transition: hotspot.transition || "push",
        meta: hotspot.meta || {},
      };
      let { error: hotspotError } = await db.from("hotspots").upsert(payload);
      if (hotspotError && hotspotError.message?.includes("meta")) {
        delete payload.meta;
        ({ error: hotspotError } = await db.from("hotspots").upsert(payload));
      }
      if (hotspotError && hotspotError.message?.includes("transition")) {
        delete payload.transition;
        ({ error: hotspotError } = await db.from("hotspots").upsert(payload));
      }
      if (hotspotError && hotspotError.message?.includes("style")) {
        delete payload.style;
        ({ error: hotspotError } = await db.from("hotspots").upsert(payload));
      }
      if (hotspotError) throw hotspotError;
    }
  }

  showStatus("Guardado en Supabase.");
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function saveState() {
  state.activeTourId = activeTourId;
  getActiveTour().activeSceneId = activeSceneId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (db && currentUser) {
    persistActiveTour().catch((error) => {
      console.error(error);
      showStatus(`No se pudo guardar en Supabase: ${error.message}`, true);
    });
  }
}

function bindEvents() {
  els.newTourBtn.addEventListener("click", createTour);
  els.saveBtn.addEventListener("click", () => {
    syncTourFields();
    saveState();
    flashButton(els.saveBtn, "Guardado");
  });
  els.shareBtn.addEventListener("click", () => {
    updateShareFields();
    document.querySelector("#sharePanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  els.sceneUpload.addEventListener("change", handleSceneUpload);
  els.brandLogoUpload.addEventListener("change", handleLogoUpload);
  els.brandName.addEventListener("input", syncBrandFields);
  els.brandLogoUrl.addEventListener("input", syncBrandFields);
  els.placeHotspotBtn.addEventListener("click", () => {
    placementMode = !placementMode;
    els.placeHotspotBtn.textContent = placementMode ? "Haz clic en el panorama" : "Colocar hotspot";
  });
  els.addCenterHotspotBtn.addEventListener("click", addHotspotAtCenter);
  els.deleteHotspotBtn.addEventListener("click", deleteActiveHotspot);
  els.centerStartBtn.addEventListener("click", saveInitialView);
  els.closeModalBtn.addEventListener("click", closeModal);

  [els.tourTitle, els.tourSlug, els.tourAccess, els.tourPassword].forEach((input) => {
    input.addEventListener("input", () => {
      syncTourFields();
      updateShareFields();
    });
  });

  [
    els.hotspotType,
    els.hotspotLabel,
    els.hotspotTarget,
    els.hotspotContent,
    els.hotspotColor,
    els.hotspotStyle,
    els.hotspotTransition,
    els.hotspotSize,
    els.hotspotRotate,
    els.hotspotTiltX,
    els.hotspotTiltY,
    els.hotspotOpacity,
  ].forEach((input) => {
    input.addEventListener("input", syncHotspotFields);
  });
}

function renderConnectionPanel() {
  const oldPanel = document.querySelector("#connectionPanel");
  oldPanel?.remove();

  const panel = document.createElement("section");
  panel.id = "connectionPanel";
  panel.className = "panel connection-panel";

  if (!db) {
    panel.innerHTML = `
      <div class="panel-heading"><span>Supabase</span></div>
      <p class="hint">Falta pegar la anon public key en config.js. Mientras tanto, el prototipo guarda solo en este navegador.</p>
    `;
    document.querySelector(".sidebar").appendChild(panel);
    return;
  }

  if (currentUser) {
    panel.innerHTML = `
      <div class="panel-heading"><span>Supabase</span><button id="logoutBtn" class="small-button">Salir</button></div>
      <p class="hint">Conectado como ${escapeHtml(currentUser.email)}. Los tours se guardan en Supabase.</p>
      <p id="saveStatus" class="hint"></p>
    `;
    document.querySelector(".sidebar").appendChild(panel);
    document.querySelector("#logoutBtn").addEventListener("click", async () => {
      await db.auth.signOut();
      location.reload();
    });
    return;
  }

  panel.innerHTML = `
    <div class="panel-heading"><span>Login privado</span></div>
    <label>Email<input id="loginEmail" type="email" autocomplete="email"></label>
    <label>Contraseña<input id="loginPassword" type="password" autocomplete="current-password"></label>
    <button id="loginBtn">Entrar</button>
    <p id="loginMessage" class="hint"></p>
  `;
  document.querySelector(".sidebar").appendChild(panel);
  document.querySelector("#loginBtn").addEventListener("click", signIn);
}

async function signIn() {
  const email = document.querySelector("#loginEmail").value.trim();
  const password = document.querySelector("#loginPassword").value;
  const message = document.querySelector("#loginMessage");
  message.textContent = "Entrando...";
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    message.textContent = error.message;
    return;
  }
  currentUser = data.user;
  await loadToursFromSupabase();
  render();
  renderConnectionPanel();
}

function showStatus(message, isError = false) {
  const status = document.querySelector("#saveStatus");
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function render() {
  renderTourFields();
  renderTours();
  renderScenes();
  renderHotspots();
  renderHotspotEditor();
  updateShareFields();
  renderViewer();
}

function renderTourFields() {
  const tour = getActiveTour();
  els.tourTitle.value = tour.title;
  els.tourSlug.value = tour.slug;
  els.tourAccess.value = tour.access;
  els.tourPassword.value = tour.password;
  els.tourPassword.style.display = tour.access === "password" ? "block" : "none";
  els.brandName.value = tour.brandName || "Perspective360";
  els.brandLogoUrl.value = tour.brandLogoUrl || "";
  updateEditorBrand();
}

function renderTours() {
  els.tourList.innerHTML = "";
  state.tours.forEach((tour) => {
    const item = document.createElement("div");
    item.className = `list-item tour-item ${tour.id === activeTourId ? "active" : ""}`;
    item.innerHTML = `<button class="tour-select-button" type="button"><strong>${escapeHtml(tour.title)}</strong><span>${tour.scenes.length} escenas · ${accessText(tour.access)}</span></button><button class="tour-delete-button" title="Eliminar tour" type="button">×</button>`;
    item.querySelector(".tour-select-button").addEventListener("click", () => {
      syncTourFields();
      activeTourId = tour.id;
      activeSceneId = tour.activeSceneId || tour.scenes[0].id;
      activeHotspotId = null;
      saveState();
      render();
    });
    item.querySelector(".tour-delete-button").addEventListener("click", (event) => {
      event.stopPropagation();
      deleteTour(tour.id);
    });
    els.tourList.appendChild(item);
  });
}

async function deleteTour(tourId) {
  if (state.tours.length <= 1) {
    showStatus("Necesitas mantener al menos un tour.", true);
    return;
  }

  const tour = state.tours.find((item) => item.id === tourId);
  if (!tour) return;

  if (db && currentUser && isUuid(tour.id)) {
    const paths = tour.scenes.map((scene) => scene.imagePath).filter(Boolean);
    const { error } = await db.from("tours").delete().eq("id", tour.id);
    if (error) {
      showStatus(`No se pudo eliminar el tour: ${error.message}`, true);
      return;
    }
    if (paths.length) await db.storage.from("panoramas").remove(paths);
  }

  state.tours = state.tours.filter((item) => item.id !== tourId);
  if (activeTourId === tourId) {
    activeTourId = state.tours[0].id;
    activeSceneId = state.tours[0].activeSceneId || state.tours[0].scenes[0].id;
    activeHotspotId = null;
  }
  saveState();
  render();
  showStatus("Tour eliminado.");
}

function renderScenes() {
  const tour = getActiveTour();
  els.sceneList.innerHTML = "";
  tour.scenes.forEach((scene, index) => {
    const item = document.createElement("div");
    item.className = `list-item scene-item ${scene.id === activeSceneId ? "active" : ""}`;
    item.draggable = true;
    item.dataset.sceneId = scene.id;
    item.innerHTML = `
      <button class="drag-handle" title="Arrastrar escena" type="button">↕</button>
      <div class="scene-fields">
        <input class="scene-title-input" value="${escapeAttribute(scene.title)}" aria-label="Nombre de escena">
        <span>${scene.hotspots.length} hotspots</span>
      </div>
      <button class="scene-delete-button" title="Eliminar escena" type="button">×</button>
    `;
    item.addEventListener("click", (event) => {
      if (event.target.closest("input") || event.target.closest(".drag-handle") || event.target.closest(".scene-delete-button")) return;
      transitionToScene(scene.id, true);
    });
    item.querySelector(".scene-delete-button").addEventListener("click", () => deleteScene(scene.id));
    item.querySelector(".scene-title-input").addEventListener("input", (event) => {
      scene.title = event.target.value || `Escena ${index + 1}`;
      if (activeSceneId === scene.id) renderHotspotEditor();
      saveState();
      updateShareFields();
    });
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", scene.id);
      item.classList.add("dragging");
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      item.classList.add("drag-over");
    });
    item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("drag-over");
      reorderScene(event.dataTransfer.getData("text/plain"), scene.id);
    });
    els.sceneList.appendChild(item);
  });
}

async function deleteScene(sceneId) {
  const tour = getActiveTour();
  if (tour.scenes.length <= 1) {
    showStatus("Un tour necesita al menos una escena.", true);
    return;
  }

  const sceneIndex = tour.scenes.findIndex((scene) => scene.id === sceneId);
  const scene = tour.scenes[sceneIndex];
  if (!scene) return;

  if (db && currentUser && isUuid(scene.id)) {
    const { error } = await db.from("scenes").delete().eq("id", scene.id);
    if (error) {
      showStatus(`No se pudo eliminar la escena: ${error.message}`, true);
      return;
    }
    if (scene.imagePath) {
      await db.storage.from("panoramas").remove([scene.imagePath]);
    }
  }

  tour.scenes.splice(sceneIndex, 1);
  tour.scenes.forEach((remainingScene) => {
    remainingScene.hotspots.forEach((hotspot) => {
      if (hotspot.targetSceneId === sceneId) hotspot.targetSceneId = "";
    });
  });

  if (activeSceneId === sceneId) {
    activeSceneId = tour.scenes[Math.max(0, sceneIndex - 1)]?.id || tour.scenes[0].id;
  }
  activeHotspotId = null;
  saveState();
  render();
  showStatus("Escena eliminada.");
}

function reorderScene(sourceId, targetId) {
  if (!sourceId || sourceId === targetId) return;
  const tour = getActiveTour();
  const sourceIndex = tour.scenes.findIndex((scene) => scene.id === sourceId);
  const targetIndex = tour.scenes.findIndex((scene) => scene.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [scene] = tour.scenes.splice(sourceIndex, 1);
  tour.scenes.splice(targetIndex, 0, scene);
  saveState();
  renderScenes();
  renderHotspotEditor();
  updateShareFields();
}

function renderHotspots() {
  const scene = getActiveScene();
  els.hotspotList.innerHTML = "";

  if (!scene.hotspots.length) {
    els.hotspotList.innerHTML = `<p class="hint">Activa "Colocar hotspot" y haz clic sobre la panorámica, o agrega uno al centro de la vista.</p>`;
    return;
  }

  scene.hotspots.forEach((hotspot) => {
    const item = document.createElement("button");
    item.className = `list-item ${hotspot.id === activeHotspotId ? "active" : ""}`;
    item.innerHTML = `<div><strong>${escapeHtml(hotspot.label || "Sin etiqueta")}</strong><span>yaw ${hotspot.yaw.toFixed(1)} · pitch ${hotspot.pitch.toFixed(1)}</span></div><span class="hotspot-chip">${typeLabel[hotspot.type]}</span>`;
    item.addEventListener("click", () => {
      activeHotspotId = hotspot.id;
      viewer?.lookAt(hotspot.pitch, hotspot.yaw, viewer.getHfov());
      renderHotspots();
      renderHotspotEditor();
      refreshHotspotMarkers();
    });
    els.hotspotList.appendChild(item);
  });
}

function renderHotspotEditor() {
  const tour = getActiveTour();
  const hotspot = getActiveHotspot();
  els.hotspotTarget.innerHTML = `<option value="">Sin destino</option>`;
  tour.scenes.forEach((scene) => {
    const option = document.createElement("option");
    option.value = scene.id;
    option.textContent = scene.title;
    els.hotspotTarget.appendChild(option);
  });

  const disabled = !hotspot;
  [
    els.hotspotType,
    els.hotspotLabel,
    els.hotspotTarget,
    els.hotspotContent,
    els.hotspotColor,
    els.hotspotStyle,
    els.hotspotTransition,
    els.hotspotSize,
    els.hotspotRotate,
    els.hotspotTiltX,
    els.hotspotTiltY,
    els.hotspotOpacity,
    els.deleteHotspotBtn,
  ].forEach((input) => {
    input.disabled = disabled;
  });

  if (!hotspot) {
    els.hotspotType.value = "scene";
    els.hotspotLabel.value = "";
    els.hotspotTarget.value = "";
    els.hotspotContent.value = "";
    els.hotspotColor.value = "#1f9d8a";
    els.hotspotStyle.value = "pin";
    els.hotspotTransition.value = "push";
    els.hotspotSize.value = 28;
    els.hotspotRotate.value = 0;
    els.hotspotTiltX.value = 0;
    els.hotspotTiltY.value = 0;
    els.hotspotOpacity.value = 90;
    updateHotspotFieldVisibility(null);
    return;
  }

  els.hotspotType.value = hotspot.type;
  els.hotspotLabel.value = hotspot.label;
  els.hotspotTarget.value = hotspot.targetSceneId || "";
  els.hotspotContent.value = hotspot.content || "";
  els.hotspotColor.value = hotspot.color || "#1f9d8a";
  els.hotspotStyle.value = hotspot.style || "pin";
  els.hotspotTransition.value = hotspot.transition || "push";
  const meta = getHotspotMeta(hotspot);
  els.hotspotSize.value = meta.size;
  els.hotspotRotate.value = meta.rotate;
  els.hotspotTiltX.value = meta.tiltX;
  els.hotspotTiltY.value = meta.tiltY;
  els.hotspotOpacity.value = meta.opacity;
  updateHotspotFieldVisibility(hotspot);
}

function renderViewer() {
  const scene = getActiveScene();
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }

  els.panorama.innerHTML = "";
  viewer = pannellum.viewer("panorama", {
    type: "equirectangular",
    panorama: scene.image,
    autoLoad: true,
    showControls: true,
    compass: false,
    hfov: scene.hfov || 100,
    yaw: scene.yaw || 0,
    pitch: scene.pitch || 0,
    hotSpots: scene.hotspots.map(toPannellumHotspot),
  });

  viewer.on("mouseup", (event) => {
    const coords = viewer.mouseEventToCoords(event);
    if (movingHotspotId) {
      moveHotspotTo(movingHotspotId, coords[1], coords[0]);
      return;
    }
    if (!placementMode) return;
    addHotspot(coords[1], coords[0]);
    placementMode = false;
    els.placeHotspotBtn.textContent = "Colocar hotspot";
  });
}

async function transitionToScene(sceneId, shouldSave = false, origin = null) {
  if (!sceneId || sceneId === activeSceneId) return;
  const surface = document.querySelector(".viewer-band") || document.querySelector(".public-viewer");
  const targetScene = getActiveTour().scenes.find((scene) => scene.id === sceneId);
  if (origin && viewer) {
    await animateHotspotTravel(origin);
  } else {
    holdCurrentScene(surface);
    await wait(180);
  }
  await preloadSceneImage(targetScene?.image, 1200);
  clearTransitionClasses(surface);

  activeSceneId = sceneId;
  activeHotspotId = null;

  if (route.has("embed") || route.has("preview")) {
    renderPublicSceneNav();
    renderViewer();
  } else {
    if (shouldSave) saveState();
    render();
  }

  revealSceneQuality(surface);
}

function holdCurrentScene(surface) {
  if (!surface) return;
  surface.classList.add("transition-hold");
}

function revealSceneQuality(surface) {
  if (!surface) return;
  surface.classList.add("quality-loading");
  requestAnimationFrame(() => {
    surface.classList.add("quality-reveal");
    setTimeout(() => {
      surface.classList.remove("quality-loading", "quality-reveal");
    }, 980);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function preloadSceneImage(src, timeout = 700) {
  if (!src) return Promise.resolve();
  return Promise.race([
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = src;
      image.decode?.().then(resolve).catch(resolve);
    }),
    wait(timeout),
  ]);
}

async function animateHotspotTravel(hotspot) {
  const surface = document.querySelector(".viewer-band") || document.querySelector(".public-viewer");
  const transition = hotspot.transition || "push";
  if (transition === "none") return;
  surface?.classList.add(`transition-${transition}`);

  if (transition === "push" || transition === "zoom") {
    viewer.lookAt(hotspot.pitch, hotspot.yaw, Math.max(38, viewer.getHfov() * 0.48), 820);
    await wait(620);
  } else if (transition === "blur") {
    viewer.lookAt(hotspot.pitch, hotspot.yaw, Math.max(52, viewer.getHfov() * 0.7), 520);
    await wait(420);
  } else {
    await wait(260);
  }
}

function clearTransitionClasses(surface) {
  surface?.classList.remove("transition-hold", "transition-preload", "transition-push", "transition-zoom", "transition-crossfade", "transition-fade", "transition-blur", "transition-none", "quality-loading", "quality-reveal");
}

function toPannellumHotspot(hotspot) {
  return {
    id: hotspot.id,
    pitch: hotspot.pitch,
    yaw: hotspot.yaw,
    cssClass: `custom-hotspot style-${hotspot.style || "pin"} type-${hotspot.type} ${hotspot.id === activeHotspotId ? "is-selected" : ""}`,
    createTooltipFunc: createHotspotNode,
    createTooltipArgs: hotspot,
    clickHandlerFunc: handleHotspotClick,
    clickHandlerArgs: hotspot,
  };
}

function createHotspotNode(node, hotspot) {
  node.innerHTML = "";
  node.classList.toggle("is-selected", hotspot.id === activeHotspotId);
  const meta = getHotspotMeta(hotspot);
  node.style.setProperty("--hotspot-size", `${meta.size}px`);
  node.style.setProperty("--hotspot-rotate", `${meta.rotate}deg`);
  node.style.setProperty("--hotspot-tilt-x", `${meta.tiltX}deg`);
  node.style.setProperty("--hotspot-tilt-y", `${meta.tiltY}deg`);
  node.style.setProperty("--hotspot-opacity", `${meta.opacity / 100}`);
  node.style.setProperty("--hotspot-color", hotspot.color || "#1f9d8a");
  if (hotspot.type === "surface_text") {
    node.textContent = hotspot.content || hotspot.label || "Texto";
    node.style.setProperty("--surface-size", `${meta.size}px`);
    node.style.setProperty("--surface-rotate", `${meta.rotate}deg`);
    node.style.setProperty("--surface-tilt-x", `${meta.tiltX}deg`);
    node.style.setProperty("--surface-tilt-y", `${meta.tiltY}deg`);
    node.style.setProperty("--surface-opacity", `${meta.opacity / 100}`);
    node.style.color = hotspot.color || "#f4f0e8";
    node.style.background = "transparent";
  } else {
    node.textContent = hotspot.style === "label" ? hotspot.label || iconByType[hotspot.type] : iconByType[hotspot.type] || "•";
    node.style.background = hotspot.color || "#1f9d8a";
  }
  const visualText = getHotspotDisplayText(hotspot);
  node.textContent = "";
  node.style.background = "transparent";
  const visual = document.createElement("span");
  visual.className = "hotspot-visual";
  if (hotspot.type === "surface_text" || hotspot.style === "label") {
    visual.textContent = visualText;
  } else if (isNavigationHotspot(hotspot) && shouldShowTargetThumbnail(hotspot)) {
    const target = getHotspotTargetScene(hotspot);
    visual.innerHTML = target
      ? `<img class="hotspot-thumb" src="${escapeAttribute(target.image)}" alt="">`
      : getHotspotIconSvg(hotspot.type);
  } else {
    visual.innerHTML = getHotspotIconSvg(getStyleIconType(hotspot));
  }
  node.appendChild(visual);
  const preview = createHotspotPreview(hotspot);
  if (preview) {
    node.appendChild(preview);
    node.addEventListener("mouseenter", () => node.classList.add("show-preview"));
    node.addEventListener("mouseleave", () => node.classList.remove("show-preview"));
  }
  node.title = hotspot.label;
  node.addEventListener("pointerdown", (event) => {
    if (route.has("embed") || route.has("preview")) return;
    if (event.target.closest(".hotspot-inline-tools")) return;
    startHotspotDrag(event, hotspot.id);
  });

  if (!route.has("embed") && !route.has("preview") && hotspot.id === activeHotspotId) {
    const handles = document.createElement("span");
    handles.className = "hotspot-corners";
    handles.innerHTML = `<i></i><i></i><i></i><i></i>`;
    node.appendChild(handles);

    const controls = document.createElement("span");
    controls.className = "hotspot-inline-tools";
    controls.innerHTML = `<button type="button" data-action="go">Ir</button><button type="button" data-action="move">Mover</button>`;
    controls.addEventListener("click", (event) => {
      event.stopPropagation();
      const action = event.target?.dataset?.action;
      if (action === "go") runHotspotAction(hotspot);
      if (action === "move") startMoveHotspot(hotspot.id);
    });
    node.appendChild(controls);
  }
}

function createHotspotPreview(hotspot) {
  if (!isNavigationHotspot(hotspot)) return null;
  const target = getHotspotTargetScene(hotspot);
  if (!target) return null;
  const preview = document.createElement("span");
  preview.className = "hotspot-preview-card";
  preview.innerHTML = `
    <span class="hotspot-preview-kicker">Ir a</span>
    <strong>${escapeHtml(hotspot.label || target.title)}</strong>
  `;
  return preview;
}

function isNavigationHotspot(hotspot) {
  return hotspot.type === "scene" || hotspot.type === "floor";
}

function getHotspotTargetScene(hotspot) {
  return getActiveTour().scenes.find((scene) => scene.id === hotspot.targetSceneId);
}

function shouldShowTargetThumbnail(hotspot) {
  return ["pin", "pulse", "beacon", "ring", "square", "glass"].includes(hotspot.style || "pin");
}

function getStyleIconType(hotspot) {
  if (!isNavigationHotspot(hotspot)) return hotspot.type;
  if (hotspot.style === "dot") return "dot";
  if (hotspot.style === "chevron") return "chevron";
  if (hotspot.style === "arrow") return "scene";
  return hotspot.type;
}

function getHotspotDisplayText(hotspot) {
  if (hotspot.type === "surface_text") return hotspot.content || hotspot.label || "Texto";
  if (hotspot.style === "label") return hotspot.label || typeLabel[hotspot.type] || "Hotspot";
  return iconByType[hotspot.type] || "•";
}

function getHotspotIconSvg(type) {
  const icons = {
    scene: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8l18 45-18-12-18 12L32 8z"/></svg>`,
    chevron: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M21 10l22 22-22 22-7-7 15-15-15-15 7-7zm18 0l22 22-22 22-7-7 15-15-15-15 7-7z"/></svg>`,
    dot: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="16"/></svg>`,
    floor: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6c-10 0-18 8-18 18 0 15 18 34 18 34s18-19 18-34C50 14 42 6 32 6zm0 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/><path d="M14 48h36l6 10H8l6-10z"/></svg>`,
    info: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M29 25h8v26h-8V25zm0-12h8v8h-8v-8z"/></svg>`,
    video: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M23 14l28 18-28 18V14z"/></svg>`,
    drone: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 31l50-22-19 46-8-18-23-6zm23 3l7 11 10-25-25 11 8 3z"/></svg>`,
    image: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 16h35a5 5 0 0 1 5 5v27a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V21a5 5 0 0 1 5-5zm3 29h30L34 31l-8 10-5-6-6 10zm28-18a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><path d="M18 10h35a5 5 0 0 1 5 5v27h-5V17a2 2 0 0 0-2-2H18v-5z"/></svg>`,
    object: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5l23 13v28L32 59 9 46V18L32 5zm0 8L17 21l15 8 15-8-15-8zm-17 15v14l13 8V36l-13-8zm21 22l13-8V28l-13 8v14z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 53l4-12a21 21 0 1 1 8 8l-12 4zm18-31c-1 0-3 1-3 3 0 5 7 12 12 12 2 0 4-3 4-4l-6-3-3 2c-2-1-4-3-5-5l2-3-1-2z"/></svg>`,
    lead: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 14h40a5 5 0 0 1 5 5v23a5 5 0 0 1-5 5H25L12 57V19a5 5 0 0 1 5-5zm10 12h24v5H22v-5zm0 10h17v5H22v-5z"/></svg>`,
  };
  return icons[type] || icons.info;
}

function handleHotspotClick(_event, hotspot) {
  activeHotspotId = hotspot.id;
  if (!route.has("embed") && !route.has("preview")) {
    renderHotspots();
    renderHotspotEditor();
    refreshHotspotMarkers();
    return;
  }

  runHotspotAction(hotspot);
}

function runHotspotAction(hotspot) {
  if (hotspot.type === "scene" || hotspot.type === "floor") {
    if (hotspot.targetSceneId) {
      transitionToScene(hotspot.targetSceneId, true, hotspot);
    }
    return;
  }

  if (hotspot.type === "whatsapp") {
    const phone = (hotspot.content || "").replace(/[^\d]/g, "");
    if (phone) window.open(`https://wa.me/${phone}`, "_blank");
    return;
  }

  if (hotspot.type === "video" || hotspot.type === "drone") {
    openModal(hotspot.label || typeLabel[hotspot.type], renderVideoEmbed(hotspot));
    return;
  }

  if (hotspot.type === "surface_text") {
    return;
  }

  if (hotspot.type === "image") {
    openModal(hotspot.label, hotspot.content ? `<img src="${escapeAttribute(hotspot.content)}" alt="${escapeAttribute(hotspot.label)}">` : "Agrega la URL de una imagen en el editor.");
    return;
  }

  if (hotspot.type === "object") {
    openModal(hotspot.label, `<p>${escapeHtml(hotspot.content || "Aquí podríamos cargar un modelo GLB/GLTF 3D embebido.")}</p>`);
    return;
  }

  if (hotspot.type === "lead") {
    openModal(
      hotspot.label || "Solicitar contacto",
      `<form class="lead-form"><label>Nombre<input placeholder="Nombre"></label><label>Teléfono o email<input placeholder="Contacto"></label><button type="button">Enviar solicitud</button></form>`
    );
    return;
  }

  openModal(hotspot.label || "Información", `<p>${escapeHtml(hotspot.content || "Sin contenido todavía.")}</p>`);
}

function renderVideoEmbed(hotspot) {
  const url = (hotspot.content || "").trim();
  if (!url) {
    return `<p>Agrega una URL de video en el campo Contenido. Puede ser YouTube, Vimeo o un MP4 directo.</p>`;
  }
  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return `<div class="video-frame"><iframe src="https://www.youtube.com/embed/${youtubeId}" title="${escapeAttribute(hotspot.label || "Video")}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  const vimeoId = url.match(/vimeo\.com\/(\d+)/i)?.[1];
  if (vimeoId) {
    return `<div class="video-frame"><iframe src="https://player.vimeo.com/video/${vimeoId}" title="${escapeAttribute(hotspot.label || "Video")}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  return `<video class="hotspot-video" src="${escapeAttribute(url)}" controls playsinline></video>`;
}

function extractYoutubeId(url) {
  return (
    url.match(/[?&]v=([^&]+)/)?.[1] ||
    url.match(/youtu\.be\/([^?&]+)/)?.[1] ||
    url.match(/youtube\.com\/shorts\/([^?&]+)/)?.[1] ||
    ""
  );
}

function startMoveHotspot(id) {
  movingHotspotId = id;
  placementMode = false;
  els.placeHotspotBtn.textContent = "Haz clic en la nueva posición";
}

function startHotspotDrag(event, id) {
  const hotspot = getActiveScene().hotspots.find((item) => item.id === id);
  if (!hotspot || !viewer) return;
  event.preventDefault();
  event.stopPropagation();
  activeHotspotId = id;
  placementMode = false;
  movingHotspotId = id;
  renderHotspots();
  renderHotspotEditor();

  const marker = event.currentTarget;
  marker.classList.add("is-dragging");
  marker.setPointerCapture?.(event.pointerId);

  const move = (moveEvent) => {
    moveEvent.preventDefault();
    moveEvent.stopPropagation();
    const rect = els.panorama.getBoundingClientRect();
    marker.style.transform = `translate(${moveEvent.clientX - rect.left}px, ${moveEvent.clientY - rect.top}px) translateZ(9999px)`;
  };

  const finish = (upEvent) => {
    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("pointerup", finish, true);
    marker.releasePointerCapture?.(event.pointerId);
    marker.classList.remove("is-dragging");
    const coords = viewer.mouseEventToCoords(upEvent);
    moveHotspotTo(id, coords[1], coords[0]);
  };

  document.addEventListener("pointermove", move, true);
  document.addEventListener("pointerup", finish, true);
}

function moveHotspotTo(id, yaw, pitch) {
  const hotspot = getActiveScene().hotspots.find((item) => item.id === id);
  if (!hotspot) return;
  hotspot.yaw = yaw;
  hotspot.pitch = pitch;
  movingHotspotId = null;
  els.placeHotspotBtn.textContent = "Colocar hotspot";
  saveState();
  renderHotspots();
  refreshHotspotMarker(hotspot);
  viewer?.lookAt(hotspot.pitch, hotspot.yaw, viewer.getHfov());
}

function addHotspotAtCenter() {
  if (!viewer) return;
  addHotspot(viewer.getYaw(), viewer.getPitch());
}

function addHotspot(yaw, pitch) {
  const scene = getActiveScene();
  const hotspot = {
    id: crypto.randomUUID(),
    type: "scene",
    yaw,
    pitch,
    label: "Nuevo hotspot",
    targetSceneId: getActiveTour().scenes.find((item) => item.id !== scene.id)?.id || "",
    content: "",
    color: "#1f9d8a",
    style: "pin",
    transition: "push",
    meta: getDefaultHotspotMeta(),
  };
  scene.hotspots.push(hotspot);
  activeHotspotId = hotspot.id;
  saveState();
  renderScenes();
  renderHotspots();
  renderHotspotEditor();
  addOrRefreshHotspotMarker(hotspot);
  viewer?.lookAt(hotspot.pitch, hotspot.yaw, viewer.getHfov());
  showStatus("Hotspot creado. Puedes editarlo en el panel derecho.");
}

function syncHotspotFields() {
  const hotspot = getActiveHotspot();
  if (!hotspot) return;
  hotspot.type = els.hotspotType.value;
  hotspot.label = els.hotspotLabel.value;
  hotspot.targetSceneId = els.hotspotTarget.value;
  hotspot.content = els.hotspotContent.value;
  hotspot.color = els.hotspotColor.value;
  hotspot.style = els.hotspotStyle.value;
  hotspot.transition = els.hotspotTransition.value;
  hotspot.meta = {
    size: Number(els.hotspotSize.value),
    rotate: Number(els.hotspotRotate.value),
    tiltX: Number(els.hotspotTiltX.value),
    tiltY: Number(els.hotspotTiltY.value),
    opacity: Number(els.hotspotOpacity.value),
  };
  updateHotspotFieldVisibility(hotspot);
  saveState();
  renderHotspots();
  refreshHotspotMarker(hotspot);
}

function updateHotspotFieldVisibility(hotspot) {
  const type = hotspot?.type || els.hotspotType.value;
  const isSurfaceText = type === "surface_text";
  const isNavigation = type === "scene" || type === "floor";
  els.hotspotTarget.closest("label").classList.toggle("field-hidden", !isNavigation);
  els.hotspotTransition.closest("label").classList.toggle("field-hidden", !isNavigation);
  els.hotspotStyle.closest("label").classList.remove("field-hidden");
  els.transformGrid.classList.remove("field-hidden");
  els.hotspotContent.closest("label").querySelector("span")?.remove();
}

function getDefaultHotspotMeta() {
  return { size: 28, rotate: 0, tiltX: 0, tiltY: 0, opacity: 90 };
}

function refreshHotspotMarker(hotspot) {
  if (!viewer || !hotspot?.id) return;
  try {
    viewer.removeHotSpot(hotspot.id);
    viewer.addHotSpot(toPannellumHotspot(hotspot));
  } catch {
    renderViewer();
  }
}

function addOrRefreshHotspotMarker(hotspot) {
  if (!viewer || !hotspot?.id) return;
  try {
    viewer.removeHotSpot(hotspot.id);
  } catch {
    // Newly created hotspots are not in Pannellum yet.
  }
  viewer.addHotSpot(toPannellumHotspot(hotspot));
}

function refreshHotspotMarkers() {
  getActiveScene().hotspots.forEach(addOrRefreshHotspotMarker);
}

function getHotspotMeta(hotspot) {
  return { ...getDefaultHotspotMeta(), ...(hotspot.meta || {}) };
}

async function deleteActiveHotspot() {
  const scene = getActiveScene();
  if (db && currentUser && isUuid(activeHotspotId)) {
    await db.from("hotspots").delete().eq("id", activeHotspotId);
  }
  scene.hotspots = scene.hotspots.filter((hotspot) => hotspot.id !== activeHotspotId);
  activeHotspotId = null;
  saveState();
  render();
}

function syncTourFields() {
  const tour = getActiveTour();
  tour.title = els.tourTitle.value || "Tour sin nombre";
  tour.slug = slugify(els.tourSlug.value || tour.title);
  tour.access = els.tourAccess.value;
  tour.password = els.tourPassword.value;
  els.tourSlug.value = tour.slug;
  els.tourPassword.style.display = tour.access === "password" ? "block" : "none";
  renderTours();
}

function syncBrandFields() {
  const tour = getActiveTour();
  tour.brandName = els.brandName.value || "Perspective360";
  tour.brandLogoUrl = els.brandLogoUrl.value.trim();
  updateEditorBrand();
  saveState();
}

function updateEditorBrand() {
  const tour = getActiveTour();
  const brand = document.querySelector(".sidebar > .brand");
  if (!brand) return;
  const mark = brand.querySelector(".brand-mark");
  const name = brand.querySelector("strong");
  if (tour.brandLogoUrl) {
    mark.innerHTML = `<img src="${escapeAttribute(tour.brandLogoUrl)}" alt="">`;
  } else {
    mark.textContent = (tour.brandName || "P").trim().charAt(0).toUpperCase();
  }
  name.textContent = tour.brandName || "Perspective360";
}

async function handleLogoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const tour = getActiveTour();
    if (db && currentUser) {
      showStatus("Subiendo logo...");
      const extension = file.name.split(".").pop() || "png";
      const path = `${currentUser.id}/${tour.id}/brand-logo.${extension}`;
      const { error } = await db.storage.from("panoramas").upload(path, file, {
        contentType: file.type || "image/png",
        upsert: true,
      });
      if (error) throw error;
      const { data } = db.storage.from("panoramas").getPublicUrl(path);
      tour.brandLogoUrl = `${data.publicUrl}?v=${Date.now()}`;
    } else {
      tour.brandLogoUrl = await readFileAsDataUrl(file);
    }
    els.brandLogoUrl.value = tour.brandLogoUrl;
    updateEditorBrand();
    saveState();
    showStatus("Logo actualizado.");
  } catch (error) {
    showStatus(`No se pudo subir el logo: ${error.message}`, true);
  } finally {
    event.target.value = "";
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createTour() {
  syncTourFields();
  const id = crypto.randomUUID();
  const sceneId = crypto.randomUUID();
  state.tours.unshift({
    id,
    title: "Nuevo tour inmobiliario",
    slug: `tour-${state.tours.length + 1}`,
    access: "draft",
    password: "",
    brandName: "Perspective360",
    brandLogoUrl: "",
    activeSceneId: sceneId,
    scenes: [
      {
        id: sceneId,
        title: "Escena inicial",
        image: createDemoPanorama(),
        hfov: 100,
        yaw: 0,
        pitch: 0,
        hotspots: [],
      },
    ],
  });
  activeTourId = id;
  activeSceneId = sceneId;
  activeHotspotId = null;
  saveState();
  render();
}

async function handleSceneUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (db && currentUser) {
    try {
      showStatus("Optimizando panorama...");
      const tour = getActiveTour();
      const optimizedFile = await optimizePanoramaFile(file);
      showStatus(`Subiendo panorama optimizado (${formatBytes(optimizedFile.size)})...`);
      const safeName = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.jpg`;
      const path = `${currentUser.id}/${tour.id}/${safeName}`;
      const { error: uploadError } = await db.storage.from("panoramas").upload(path, optimizedFile, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data } = db.storage.from("panoramas").getPublicUrl(path);
      const scene = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, ""),
        image: data.publicUrl,
        imagePath: path,
        hfov: 100,
        yaw: 0,
        pitch: 0,
        hotspots: [],
      };
      tour.scenes.push(scene);
      activeSceneId = scene.id;
      activeHotspotId = null;
      saveState();
      render();
      event.target.value = "";
      showStatus("Panorama subido.");
    } catch (error) {
      showStatus(`No se pudo subir: ${error.message}`, true);
    }
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const scene = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, ""),
      image: reader.result,
      hfov: 100,
      yaw: 0,
      pitch: 0,
      hotspots: [],
    };
    const tour = getActiveTour();
    tour.scenes.push(scene);
    activeSceneId = scene.id;
    activeHotspotId = null;
    saveState();
    render();
    event.target.value = "";
  };
  reader.readAsDataURL(file);
}

async function optimizePanoramaFile(file) {
  const bitmap = await createImageBitmap(file);
  const sourceRatio = bitmap.width / bitmap.height;
  const maxWidth = sourceRatio > 1.8 ? 4096 : 3000;
  const width = Math.min(bitmap.width, maxWidth);
  const height = Math.round(width / sourceRatio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  bitmap.close?.();
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function saveInitialView() {
  const scene = getActiveScene();
  scene.yaw = viewer.getYaw();
  scene.pitch = viewer.getPitch();
  scene.hfov = viewer.getHfov();
  saveState();
  flashButton(els.centerStartBtn, "Vista guardada");
}

function updateShareFields() {
  const tour = getActiveTour();
  const link = `${location.origin}${location.pathname}?tour=${encodeURIComponent(tour.slug)}&preview=1`;
  const embedLink = `${location.origin}${location.pathname}?tour=${encodeURIComponent(tour.slug)}&embed=1`;
  els.publicLink.value = tour.access === "draft" ? "Tour en borrador privado" : link;
  els.iframeCode.value =
    tour.access === "draft"
      ? "Publica el tour para generar el iframe."
      : `<iframe src="${embedLink}" width="100%" height="640" style="border:0;" allowfullscreen loading="lazy"></iframe>`;
}

function renderPublicExperience() {
  const slug = route.get("tour");
  const tour = state.tours.find((item) => item.slug === slug) || state.tours[0];
  activeTourId = tour.id;
  activeSceneId = tour.activeSceneId || tour.scenes[0].id;

  document.body.innerHTML = `
    <main class="public-shell ${route.has("embed") ? "embedded" : ""}">
      <header class="public-bar">
        <div class="brand">
          <div class="brand-mark">${tour.brandLogoUrl ? `<img src="${escapeAttribute(tour.brandLogoUrl)}" alt="">` : escapeHtml((tour.brandName || "P").trim().charAt(0).toUpperCase())}</div>
          <div>
            <strong>${escapeHtml(tour.brandName || "Perspective360")}</strong>
            <span>${escapeHtml(tour.title)}</span>
          </div>
        </div>
        <nav id="publicScenes" class="public-scenes"></nav>
      </header>
      <section id="publicGate" class="public-gate" hidden>
        <div class="modal-card">
          <h2>Tour protegido</h2>
          <p class="hint">Ingresa la contraseña para ver este tour virtual.</p>
          <label>Contraseña<input id="gatePassword" type="password"></label>
          <button id="gateButton">Entrar</button>
          <p id="gateError" class="gate-error"></p>
        </div>
      </section>
      <section id="publicViewer" class="public-viewer">
        <div id="panorama"></div>
      </section>
      <div id="modal" class="modal" hidden>
        <div class="modal-card">
          <button id="closeModalBtn" class="modal-close">×</button>
          <h2 id="modalTitle"></h2>
          <div id="modalBody"></div>
        </div>
      </div>
    </main>
  `;
  document.documentElement.classList.add("public-route-ready");

  els.panorama = document.querySelector("#panorama");
  els.modal = document.querySelector("#modal");
  els.modalTitle = document.querySelector("#modalTitle");
  els.modalBody = document.querySelector("#modalBody");
  els.closeModalBtn = document.querySelector("#closeModalBtn");
  els.closeModalBtn.addEventListener("click", closeModal);

  if (tour.access === "draft") {
    document.querySelector("#publicViewer").innerHTML = `<div class="public-empty"><h1>Tour no publicado</h1><p>Este tour todavía está en borrador privado.</p></div>`;
    return;
  }

  const authKey = `tour-auth-${tour.id}`;
  if (tour.access === "password" && sessionStorage.getItem(authKey) !== "ok") {
    const gate = document.querySelector("#publicGate");
    gate.hidden = false;
    document.querySelector("#publicViewer").hidden = true;
    document.querySelector("#gateButton").addEventListener("click", () => {
      const value = document.querySelector("#gatePassword").value;
      if (value === tour.password) {
        sessionStorage.setItem(authKey, "ok");
        gate.hidden = true;
        document.querySelector("#publicViewer").hidden = false;
        renderPublicSceneNav();
        renderViewer();
      } else {
        document.querySelector("#gateError").textContent = "Contraseña incorrecta.";
      }
    });
    return;
  }

  renderPublicSceneNav();
  renderViewer();
}

function renderPublicSceneNav() {
  const container = document.querySelector("#publicScenes");
  const tour = getActiveTour();
  container.innerHTML = "";
  tour.scenes.forEach((scene) => {
    const button = document.createElement("button");
    button.innerHTML = `
      <span>${escapeHtml(scene.title)}</span>
      <span class="scene-preview">
        <img src="${escapeAttribute(scene.image)}" alt="">
        <strong>${escapeHtml(scene.title)}</strong>
      </span>
    `;
    button.className = scene.id === activeSceneId ? "active" : "";
    button.addEventListener("click", () => {
      transitionToScene(scene.id, false);
    });
    container.appendChild(button);
  });
}

function getActiveTour() {
  return state.tours.find((tour) => tour.id === activeTourId) || state.tours[0];
}

function getActiveScene() {
  const tour = getActiveTour();
  return tour.scenes.find((scene) => scene.id === activeSceneId) || tour.scenes[0];
}

function getActiveHotspot() {
  return getActiveScene().hotspots.find((hotspot) => hotspot.id === activeHotspotId) || null;
}

function accessText(access) {
  if (access === "password") return "con contraseña";
  if (access === "draft") return "borrador";
  return "público";
}

function openModal(title, body) {
  els.modalTitle.textContent = title || "Hotspot";
  els.modalBody.innerHTML = body;
  els.modal.hidden = false;
}

function closeModal() {
  els.modal.hidden = true;
}

function flashButton(button, text) {
  const previous = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = previous;
  }, 1200);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function createDemoPanorama() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#8fc7d4");
  sky.addColorStop(0.42, "#dce8dc");
  sky.addColorStop(0.43, "#b9c2ad");
  sky.addColorStop(1, "#5b6258");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 22; i += 1) {
    const x = (i / 22) * canvas.width;
    const width = 48 + (i % 5) * 26;
    const height = 90 + (i % 7) * 34;
    ctx.fillStyle = i % 2 ? "#5c6f74" : "#6f806f";
    ctx.fillRect(x, 420 - height, width, height);
  }

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(320, 180, 74, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#313a37";
  ctx.fillRect(0, 590, canvas.width, 160);
  ctx.fillStyle = "#c8a85e";
  for (let x = 0; x < canvas.width; x += 180) {
    ctx.fillRect(x + 30, 668, 80, 8);
  }

  ctx.fillStyle = "rgba(20,26,28,0.35)";
  ctx.fillRect(0, 750, canvas.width, 274);
  ctx.fillStyle = "#f4f0e8";
  ctx.font = "700 72px system-ui";
  ctx.fillText("Panorama demo 360", 90, 910);
  ctx.font = "32px system-ui";
  ctx.fillText("Sube una imagen equirectangular 2:1 desde Insta360 Studio o DJI", 90, 960);
  return canvas.toDataURL("image/jpeg", 0.9);
}
