const supabaseUrl = "https://bpimpktebkbflmyphpxk.supabase.co";
const supabaseKey = "sb_publishable_XsHR57ojGapxQ23W6ef6Ug_kuhts2pv";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const galleryGrid = document.getElementById("galleryGrid");
const mediaUpload = document.getElementById("mediaUpload");
const backgroundUpload = document.getElementById("backgroundUpload");
const clearBackgroundBtn = document.getElementById("clearBackgroundBtn");
const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightboxContent");
const lightboxClose = document.getElementById("lightboxClose");
const musicUpload = document.getElementById("musicUpload");
const musicPlayer = document.getElementById("musicPlayer");
const contadorDias = document.getElementById("contadorDias");

function createItem(item){

const div = document.createElement("div")
div.className="gallery-item"

let media=""

if(item.type==="foto"){
media=`<img class="gallery-media" src="${item.file_url}">`
}else{
media=`<video class="gallery-media" controls>
<source src="${item.file_url}">
</video>`
}

div.innerHTML=`

${media}

<div class="gallery-caption">
<h4>${item.name}</h4>
</div>

<div class="gallery-actions">
<button class="mini-btn delete">Excluir</button>
</div>

`

galleryGrid.appendChild(div)

div.querySelector(".gallery-media").onclick=()=>{
lightboxContent.innerHTML=media
lightbox.classList.add("open")
}

div.querySelector(".delete").onclick=async()=>{

await supabase
.from("gallery_items")
.delete()
.eq("id",item.id)

div.remove()

}

}

async function loadGallery(){

const {data}=await supabase
.from("gallery_items")
.select("*")
.order("created_at",{ascending:false})

galleryGrid.innerHTML=""

data.forEach(createItem)

}

async function uploadFile(file){

let type=null

if(file.type.startsWith("image")) type="foto"
if(file.type.startsWith("video")) type="video"

if(!type) return

const fileName=Date.now()+"-"+file.name

await supabase.storage
.from("galeria")
.upload(fileName,file,{upsert:true})

const {data:publicData}=supabase.storage
.from("galeria")
.getPublicUrl(fileName)

const publicUrl=publicData.publicUrl

const {data}=await supabase
.from("gallery_items")
.insert({
name:file.name,
type:type,
file_url:publicUrl
})
.select()
.single()

createItem(data)

}

mediaUpload.onchange=async e=>{
for(const file of e.target.files){
await uploadFile(file)
}
}

lightboxClose.onclick=()=>{
lightbox.classList.remove("open")
lightboxContent.innerHTML=""
}

const start=new Date("2025-01-01")
const now=new Date()
const diff=Math.floor((now-start)/(1000*60*60*24))

contadorDias.textContent=diff+" dias juntos"

const savedMusic=localStorage.getItem("musicaRomantica")

if(savedMusic) musicPlayer.src=savedMusic

musicUpload.onchange=e=>{

const file=e.target.files[0]

const reader=new FileReader()

reader.onload=e2=>{
localStorage.setItem("musicaRomantica",e2.target.result)
musicPlayer.src=e2.target.result
musicPlayer.play()
}

reader.readAsDataURL(file)

}

const hearts=document.getElementById("hearts")

const symbols=["❤","💖","💕","💗"]

if(hearts){

for(let i=0;i<20;i++){

const heart=document.createElement("span")

heart.className="heart-fall"
heart.textContent=symbols[Math.floor(Math.random()*symbols.length)]

heart.style.left=Math.random()*100+"vw"
heart.style.animationDuration=6+Math.random()*6+"s"

hearts.appendChild(heart)

}

}

loadGallery()
