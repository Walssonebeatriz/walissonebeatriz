const supabaseUrl = "https://bpimpktebkbflmyphpxk.supabase.co";
const supabaseKey = "sb_publishable_XsHR57ojGapxQ23W6ef6Ug_kuhts2pv";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const filterButtons = document.querySelectorAll("[data-filter]");
const galleryGrid = document.getElementById("galleryGrid");
const mediaUpload = document.getElementById("mediaUpload");
const backgroundUpload = document.getElementById("backgroundUpload");
const clearBackgroundBtn = document.getElementById("clearBackgroundBtn");
const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightboxContent");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const musicUpload = document.getElementById("musicUpload");
const musicPlayer = document.getElementById("musicPlayer");
const contadorDias = document.getElementById("contadorDias");
const heartsContainer = document.getElementById("hearts");

let allGalleryData = [];
let currentFilter = "all";
let currentLightboxIndex = 0;

function getFilteredGalleryData() {
  if (currentFilter === "all") return allGalleryData;
  return allGalleryData.filter((item) => item.type === currentFilter);
}

function updateFilterButtons(selectedFilter) {
  const allButtons = document.querySelectorAll("[data-filter]");
  allButtons.forEach((btn) => {
    if (btn.dataset.filter === selectedFilter) {
      btn.classList.add("active");
      if (!btn.classList.contains("btn-principal")) {
        btn.classList.remove("btn-secundario");
        btn.classList.add("btn-principal");
      }
    } else {
      btn.classList.remove("active");
      if (btn.classList.contains("btn-principal")) {
        btn.classList.remove("btn-principal");
        btn.classList.add("btn-secundario");
      }
    }
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons(currentFilter);
    renderGallery();
  });
});

function applyBackground(url) {
  if (url) {
    document.body.style.backgroundImage =
      `linear-gradient(rgba(255, 244, 248, 0.62), rgba(255, 228, 237, 0.74)), url('${url}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  } else {
    document.body.style.backgroundImage =
      "linear-gradient(rgba(255, 244, 248, 0.84), rgba(255, 228, 237, 0.90)), linear-gradient(180deg, #fff7fa 0%, #fdebf1 100%)";
  }
}

async function loadSharedBackground() {
  const { data, error } = await supabase
    .from("site_config")
    .select("background_url")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Erro ao carregar fundo:", error);
    return;
  }

  applyBackground(data?.background_url || null);
}

async function uploadBackground(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `background-casal-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("galeria")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error("Erro no upload do fundo:", uploadError);
    alert("Não foi possível enviar o plano de fundo.");
    return;
  }

  const { data: publicData } = supabase.storage
    .from("galeria")
    .getPublicUrl(fileName);

  const publicUrl = publicData.publicUrl;

  const { error: updateError } = await supabase
    .from("site_config")
    .upsert({
      id: 1,
      background_url: publicUrl
    });

  if (updateError) {
    console.error("Erro ao salvar URL do fundo:", updateError);
    alert("Não foi possível salvar o plano de fundo.");
    return;
  }

  applyBackground(publicUrl);
}

async function clearSharedBackground() {
  const { error } = await supabase
    .from("site_config")
    .upsert({
      id: 1,
      background_url: null
    });

  if (error) {
    console.error("Erro ao remover fundo:", error);
    alert("Não foi possível remover o fundo.");
    return;
  }

  applyBackground(null);
}

function openLightboxByIndex(index) {
  const filteredItems = getFilteredGalleryData();
  if (!filteredItems.length) return;

  if (index < 0) {
    currentLightboxIndex = filteredItems.length - 1;
  } else if (index >= filteredItems.length) {
    currentLightboxIndex = 0;
  } else {
    currentLightboxIndex = index;
  }

  const item = filteredItems[currentLightboxIndex];
  if (!item || !lightboxContent || !lightbox) return;

  if (item.type === "foto") {
    lightboxContent.innerHTML = `<img src="${item.file_url}" alt="${item.name}">`;
  } else {
    lightboxContent.innerHTML = `
      <video controls autoplay>
        <source src="${item.file_url}" type="video/mp4">
      </video>
    `;
  }

  lightbox.classList.add("open");
}

function closeLightbox() {
  if (!lightbox || !lightboxContent) return;
  lightbox.classList.remove("open");
  lightboxContent.innerHTML = "";
}

function createGalleryItem(itemData, filteredIndex) {
  const item = document.createElement("div");
  item.className = `gallery-item ${itemData.type === "foto" ? "foto-card" : "video-card"}`;
  item.dataset.type = itemData.type;
  item.dataset.id = itemData.id;
  item.dataset.url = itemData.file_url;

  let media = "";

  if (itemData.type === "foto") {
    media = `<img class="gallery-media" src="${itemData.file_url}" alt="${itemData.name}">`;
  } else {
    media = `
      <video class="gallery-media" controls>
        <source src="${itemData.file_url}" type="video/mp4">
      </video>
    `;
  }

  item.innerHTML = `
    ${media}
    <div class="gallery-caption">
      <h4>${itemData.name}</h4>
      <span>${itemData.type === "foto" ? "Arquivo de foto" : "Arquivo de vídeo"}</span>
    </div>
    <div class="gallery-actions">
      <button class="mini-btn nav prev-btn" type="button">◀ Anterior</button>
      <button class="mini-btn nav next-btn" type="button">Próximo ▶</button>
      <button class="mini-btn delete" type="button">Excluir</button>
    </div>
  `;

  const mediaElement = item.querySelector(".gallery-media");
  const prevBtn = item.querySelector(".prev-btn");
  const nextBtn = item.querySelector(".next-btn");

  if (mediaElement) {
    mediaElement.addEventListener("click", () => {
      openLightboxByIndex(filteredIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      openLightboxByIndex(filteredIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      openLightboxByIndex(filteredIndex + 1);
    });
  }

  attachCloudDelete(item, itemData.id, itemData.file_url);

  return item;
}

function renderEmptyState() {
  if (!galleryGrid) return;

  galleryGrid.innerHTML = `
    <div class="vazio">
      Ainda não tem nada arquivado aqui.<br>
      Envie uma foto ou vídeo para começar 💕
    </div>
  `;
}

function renderGallery() {
  if (!galleryGrid) return;

  const filteredItems = getFilteredGalleryData();
  galleryGrid.innerHTML = "";

  if (!filteredItems.length) {
    renderEmptyState();
    return;
  }

  filteredItems.forEach((item, index) => {
    const card = createGalleryItem(item, index);
    galleryGrid.appendChild(card);
  });
}

async function uploadGalleryFile(file, type) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("galeria")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error("Erro ao enviar mídia:", uploadError);
    alert("Não foi possível enviar a mídia.");
    return null;
  }

  const { data: publicData } = supabase.storage
    .from("galeria")
    .getPublicUrl(fileName);

  const publicUrl = publicData.publicUrl;

  const { data, error: insertError } = await supabase
    .from("gallery_items")
    .insert({
      name: file.name,
      type: type,
      file_url: publicUrl
    })
    .select()
    .single();

  if (insertError) {
    console.error("Erro ao salvar mídia no banco:", insertError);
    alert("Não foi possível registrar a mídia.");
    return null;
  }

  return data;
}

async function loadGalleryFromSupabase() {
  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar galeria:", error);
    renderEmptyState();
    return;
  }

  allGalleryData = data || [];
  renderGallery();
}

async function deleteFileFromStorage(fileUrl) {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/object/public/galeria/");
    if (pathParts.length < 2) return;

    const filePath = decodeURIComponent(pathParts[1]);

    await supabase.storage
      .from("galeria")
      .remove([filePath]);
  } catch (error) {
    console.error("Erro ao remover do storage:", error);
  }
}

function attachCloudDelete(itemElement, id, fileUrl) {
  const deleteBtn = itemElement.querySelector(".mini-btn.delete");
  if (!deleteBtn) return;

  deleteBtn.addEventListener("click", async () => {
    const confirmDelete = confirm("Deseja excluir este item?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("gallery_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir item:", error);
      alert("Não foi possível excluir.");
      return;
    }

    if (fileUrl) {
      await deleteFileFromStorage(fileUrl);
    }

    allGalleryData = allGalleryData.filter((item) => item.id !== id);
    renderGallery();
    closeLightbox();
  });
}

async function handleFiles(files) {
  for (const file of [...files]) {
    let type = null;

    if (file.type.startsWith("image/")) {
      type = "foto";
    } else if (file.type.startsWith("video/")) {
      type = "video";
    }

    if (!type) continue;

    const savedItem = await uploadGalleryFile(file, type);
    if (savedItem) {
      allGalleryData.unshift(savedItem);
      renderGallery();
    }
  }
}

if (mediaUpload) {
  mediaUpload.addEventListener("change", async (event) => {
    await handleFiles(event.target.files);
    event.target.value = "";
  });
}

if (backgroundUpload) {
  backgroundUpload.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await uploadBackground(file);
    event.target.value = "";
  });
}

if (clearBackgroundBtn) {
  clearBackgroundBtn.addEventListener("click", async () => {
    await clearSharedBackground();
  });
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (lightboxPrev) {
  lightboxPrev.addEventListener("click", () => {
    openLightboxByIndex(currentLightboxIndex - 1);
  });
}

if (lightboxNext) {
  lightboxNext.addEventListener("click", () => {
    openLightboxByIndex(currentLightboxIndex + 1);
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (!lightbox || !lightbox.classList.contains("open")) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") openLightboxByIndex(currentLightboxIndex - 1);
  if (event.key === "ArrowRight") openLightboxByIndex(currentLightboxIndex + 1);
});

const dataInicio = new Date("2025-01-01");
const hoje = new Date();
const diffMs = hoje.getTime() - dataInicio.getTime();
const dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

if (contadorDias) {
  contadorDias.textContent = `${dias} dias juntos`;
}

const savedMusic = localStorage.getItem("musicaRomantica");
if (savedMusic && musicPlayer) {
  musicPlayer.src = savedMusic;
}

if (musicUpload) {
  musicUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      localStorage.setItem("musicaRomantica", e.target.result);
      if (musicPlayer) {
        musicPlayer.src = e.target.result;
        musicPlayer.play().catch(() => {});
      }
    };
    reader.readAsDataURL(file);
  });
}

const simbolos = ["❤", "💖", "💕", "💗"];

if (heartsContainer) {
  for (let i = 0; i < 18; i++) {
    const heart = document.createElement("span");
    heart.className = "heart-fall";
    heart.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = 6 + Math.random() * 8 + "s";
    heart.style.animationDelay = Math.random() * 5 + "s";
    heart.style.fontSize = 14 + Math.random() * 18 + "px";
    heartsContainer.appendChild(heart);
  }
}

loadSharedBackground();
loadGalleryFromSupabase();
