import { Hono } from "hono";
import { googelSheetGetHelper } from "../utils/getDataFromGoogleSheet";

const app = new Hono();

const googleSheetURl =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjjY9ad1RWnzfHErHYoC40-z9i85wqOe8wt3JA4q7PXqtJGMXj1Zlg3b_d0n_zTC5YiElEbb31dzpKJhp-pI-nz69XyadmLIR0QbthQZaAMjmaCdVRx1glkhPOW95pw1s5LW17bYHj6dlBmMNQo6WexCsuOskzqi5ZDX06_E7U2e-_bY4Ze_yAORX9hlqm67Zuk_aDn-W9AWLdMwvhQTYlxIPBn0egtF6LFLa-fnJCucqkxhkRBV3Ne8KDJhZK6wlLlQOwfqa6Lf1qNGAr0U16sWprLa3CVBrGfsjBs4FE5Y2JAV5Q&lib=MfUMAu43yfO2fKjBdhRibWzwPPqT7M8tq";

app.get("/", async (c) => {
  try {
    const data = await googelSheetGetHelper(googleSheetURl);

    if (data.message) {
      return c.json({ message: data.message }, data.message === "No data found" ? 404 : 400);
    }

    return c.json(data, 200);
  } catch (error) {
    console.log(error);
    return c.json(
      {
        message: "Internal service error",
      },
      500
    );
  }
});

export { app as getRoute };
