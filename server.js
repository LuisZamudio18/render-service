const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "50mb" }));

app.post("/render", async (req, res) => {
  try {
    const { audioPath, videoPaths } = req.body;

    if (!audioPath || !videoPaths || !videoPaths.length) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const concatContent = videoPaths
      .map(v => `file '${v}'`)
      .join("\n");

    fs.writeFileSync("concat.txt", concatContent);

    const command = `
      ffmpeg -y \
      -f concat -safe 0 -i concat.txt \
      -i ${audioPath} \
      -c:v libx264 -c:a aac -shortest \
      output.mp4
    `;

    exec(command, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error renderizando video" });
      }

      res.download("output.mp4");
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

app.listen(3000, () => {
  console.log("Render service corriendo en puerto 3000");
});
