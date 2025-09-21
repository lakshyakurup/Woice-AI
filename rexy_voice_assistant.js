// ✅ Updated to rename everything to "Woice" + inline image preview

// Create file input dynamically
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

// Add upload button near send button
const uploadButton = document.createElement("button");
uploadButton.textContent = "📎";
uploadButton.title = "Upload image for /vision";
uploadButton.style.marginLeft = "8px";
sendButton.parentNode.insertBefore(uploadButton, sendButton);

let uploadedImageBase64 = null;

// Convert uploaded image to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Show inline preview in chat
async function showImagePreview(file, source = "upload") {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.maxWidth = "200px";
  img.style.borderRadius = "10px";
  img.style.marginTop = "5px";

  const msg = document.createElement("div");
  msg.className = `message assistant`;
  msg.innerHTML = `📷 Image ${source}ed: ${file.name}`;
  msg.appendChild(img);
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

uploadButton.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  uploadedImageBase64 = await fileToBase64(file);
  await showImagePreview(file, "upload");
});

// ✅ Drag & Drop Support
chatArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  chatArea.style.border = "2px dashed #4cafef";
});

chatArea.addEventListener("dragleave", () => {
  chatArea.style.border = "none";
});

chatArea.addEventListener("drop", async (e) => {
  e.preventDefault();
  chatArea.style.border = "none";

  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) {
    await typeMessage("⚠️ Please drop an image file.", "assistant");
    return;
  }

  uploadedImageBase64 = await fileToBase64(file);
  await showImagePreview(file, "drop");
});

// ✅ Updated /vision to use uploaded/dragged image
async function processUserMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  await typeMessage(text, "user");
  userInput.value = "";

  if (text.startsWith("/vision")) {
    const description = text.replace("/vision", "").trim() || "What’s in this image?";

    if (!uploadedImageBase64) {
      await typeMessage("⚠️ Please upload or drag & drop an image first.", "woice");
      return;
    }

    await handleWoiceFeature("vision", { text: description, imageBase64: uploadedImageBase64 });
    return;
  }

  if (text.startsWith("/img")) {
    const prompt = text.replace("/img", "").trim();
    if (!prompt) {
      await typeMessage("⚠️ Please add a description after /img", "woice");
      return;
    }
    await handleWoiceFeature("image-gen", { prompt });
    return;
  }

  if (text.startsWith("/transcribe")) {
    if (!lastRecordedBlob) {
      await typeMessage("⚠️ No audio recorded yet.", "woice");
      return;
    }
    await handleWoiceFeature("audio-transcribe", { audioBlob: lastRecordedBlob });
    return;
  }

  const response = await callWoice(
    "https://generativelanguage.googleapis.com/v1beta/models/woice-pro:generateContent?key=" + WOICE_API_KEY,
    {
      contents: [{ role: "user", parts: [{ text }] }]
    }
  );
  const responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text || "...";
  await typeMessage(responseText, "woice");
}

// ✅ Ensure Woice introduces itself properly
async function typeMessage(text, sender = "woice") {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = sender === "woice" ? `🤖 Woice: ${text}` : text;
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}
