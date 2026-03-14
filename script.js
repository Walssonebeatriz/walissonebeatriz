// 1) Dados do seu projeto no Supabase
const supabaseUrl = "https://bpimpktebkbflmyphpxk.supabase.co";
const supabaseKey = "sb_publishable_XsHR57ojGapxQ23W6ef6Ug_kuhts2pv";

// 2) Cria a conexão com o Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 3) Pega os elementos do HTML
const galleryGrid = document.getElementById("galleryGrid");
const mediaUpload = document.getElementById("mediaUpload");

// 4) Função para mostrar mensagem quando não há itens
function renderEmptyState() {
  galleryGrid.innerHTML = `
    <div style="padding:20px;text-align:center;">
      Nenhuma foto ou vídeo ainda.
    </div>
  `;
}

// 5) Função que desenha a galeria na tela
function renderGallery(items) {
  galleryGrid.innerHTML = "";

  if (!items || items.length === 0) {
    renderEmptyState();
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "gallery-item";

    if (item.type === "foto") {
      card.innerHTML = `
        <img
          src="${item.file_url}"
          alt="${item.name}"
          class="gallery-media"
          style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;"
        >
        <div style="padding:10px;">
          <strong>${item.name}</strong>
        </div>
      `;
    } else {
      card.innerHTML = `
        <video
          src="${item.file_url}"
          controls
          class="gallery-media"
          style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;"
        ></video>
        <div style="padding:10px;">
          <strong>${item.name}</strong>
        </div>
      `;
    }

    galleryGrid.appendChild(card);
  });
}

// 6) Função para buscar os itens salvos no banco
async function loadGallery() {
  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("GALERIA:", data, error);

  if (error) {
    console.error("Erro ao carregar galeria:", error);
    renderEmptyState();
    return;
  }

  renderGallery(data);
}

// 7) Função para enviar o arquivo ao Storage
async function uploadFileToStorage(file) {
  // Cria um nome único
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  // Envia para o bucket "galeria"
  const { error } = await supabase.storage
    .from("galeria")
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error("Erro no upload do storage:", error);
    return null;
  }

  // Pega a URL pública do arquivo enviado
  const { data } = supabase.storage
    .from("galeria")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// 8) Função para salvar o item na tabela gallery_items
async function saveFileInDatabase(file, publicUrl) {
  // Descobre se é foto ou vídeo
  let type = null;

  if (file.type.startsWith("image/")) {
    type = "foto";
  } else if (file.type.startsWith("video/")) {
    type = "video";
  }

  if (!type) {
    return null;
  }

  const { data, error } = await supabase
    .from("gallery_items")
    .insert([
      {
        name: file.name,
        type: type,
        file_url: publicUrl
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar no banco:", error);
    return null;
  }

  return data;
}

// 9) Quando o usuário escolhe arquivo
if (mediaUpload) {
  mediaUpload.addEventListener("change", async (event) => {
    const files = [...event.target.files];

    for (const file of files) {
      // Primeiro envia para o Storage
      const publicUrl = await uploadFileToStorage(file);

      if (!publicUrl) {
        alert("Erro ao enviar arquivo para o storage.");
        continue;
      }

      // Depois salva no banco
      const savedItem = await saveFileInDatabase(file, publicUrl);

      if (!savedItem) {
        alert("Erro ao salvar item na tabela.");
        continue;
      }
    }

    // Limpa o input
    event.target.value = "";

    // Recarrega a galeria
    await loadGallery();
  });
}

// 10) Carrega a galeria assim que abrir o site
loadGallery();
