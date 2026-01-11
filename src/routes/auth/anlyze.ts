import { Hono } from "hono";
import { anlyzeForAbnormalities } from "../../utils/abnoymalDetect";
import { getTheAge } from "../../utils/getAge";
import { handleError } from "../../utils/errorHandler";

interface Readings {
  diastolic: number;
  id: number;
  status: string;
  systolic: number;
  bpStatus: string;
  pulseStatus: string;
  pulse: number;
  message: string;
  timestamp: string;
}

const app = new Hono();

app.post("/", async (c) => {
  const { birthday } = await c.get("jwtPayload");
  const { sampleData } = await c.req.json();
  const age = getTheAge(birthday);

  try {
    const res = anlyzeForAbnormalities(sampleData, age);
    return c.json({ res }, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ message }, statusCode);
  }
});

export { app as analyzeRoute };