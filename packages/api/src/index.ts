import { ParseGpxRequestSchema } from "@roadtrip/shared";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { handleParseGpx } from "./router/routes";
import { processPost } from "./utils/route-handler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/api/gpx", processPost(ParseGpxRequestSchema, handleParseGpx));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
