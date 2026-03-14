const supabaseUrl = "https://bpimpktebkbfImyphpkx.supabase.co";
const supabaseKey = "SUA_CHAVE_AQUI";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const galleryGrid = document.getElementById("galleryGrid");
const mediaUpload = document.getElementById("mediaUpload");

async function loadGallery() {
  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  galleryGrid.innerHTML = "";

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "gallery-item";

    if (item.type === "foto") {
      div.innerHTML = `<img src="${item.file_url}" />`;
    } else {
      div.innerHTML = `<video controls src="${item.file_url}"></video>`;
    }

    galleryGrid.appendChild(div);
  });
}

mediaUpload.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = Date.now() + "_" + file.name;

  const { error } = await supabase.storage
    .from("galeria")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    alert("Erro ao enviar arquivo");
    return;
  }

  const { data } = supabase.storage
    .from("galeria")
    .getPublicUrl(fileName);

  const type = file.type.startsWith("video") ? "video" : "foto";

  await supabase.from("gallery_items").insert([
    {
      name: file.name,
      type: type,
      file_url: data.publicUrl
    }
  ]);

  loadGallery();
});

loadGallery();
