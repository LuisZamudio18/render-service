const express = require("express");
const { execSync } = require("child_process");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "50mb" }));

app.post("/render", async (req, res) => {
  try {
    const { audioPath, videoPaths } = req.body;

    if (!audioPath || !videoPaths || !videoPaths.length) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // 1️⃣ Obtener duración real del audio
    const duration = execSync(
      `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`
    ).toString().trim();

    const audioDuration = parseFloat(duration);

    // 2️⃣ Crear archivo concat.txt
    const concatContent = videoPaths
      .map(v => `file '${v}'`)
      .join("\n");

    fs.writeFileSync("concat.txt", concatContent);

    // 3️⃣ Renderizar exactamente la duración del audio
    const command = `
      ffmpeg -y \
      -f concat -safe 0 -i concat.txt \
      -i "${audioPath}" \
      -t ${audioDuration} \
      -map 0:v:0 -map 1:a:0 \
      -c:v libx264 -c:a aac \
      -pix_fmt yuv420p \
      output.mp4
    `;

    execSync(command);

    res.download("output.mp4");

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error renderizando video" });
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Render service corriendo en puerto ${PORT}`);
});
