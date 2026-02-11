import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import dotenv from "dotenv";
import { parseGpxFile, sampleRoutePoints } from "./services/gpx-parser";
import { fetchWeatherForPoint } from "./services/weather";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(
    "/trpc",
    createExpressMiddleware({
        router: appRouter,
    }),
);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
});

app.post("/gpx", async (req, res) => {
    const parsed = parseGpxFile(req.body.gpxContent);

    // Sample points along the route
    const samplePoints = sampleRoutePoints(parsed.coordinates);

    // Fetch weather for each sample point
    const weatherPromises = samplePoints.map((point) =>
        fetchWeatherForPoint(point.lat, point.lon),
    );

    const weatherData = await Promise.all(weatherPromises);

    res.json({ route: parsed, weather: weatherData });
});
