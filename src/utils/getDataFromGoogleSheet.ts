export const googelSheetGetHelper = async (url: string) => {
  try {
    const res = await fetch(url, {
      method: "GET",
    });
    if (!res.ok)
      return {
        message: "No data found",
      };

    const result = await res.text();
    console.log(result);
    if (!result) return { message: "No data found" };

    const part = result.trim().split(",");

    const datePart = `${part[0]}`;
    const timePart = `${part[1]}`;
    const systolic = Number(part[2]);
    const diastolic = Number(part[3]);
    const pulseRate = Number(part[4]);

    const finalDate = `${datePart} ${timePart}`;
    const formattedDate = new Date(finalDate);

    return {
      date: formattedDate.toISOString(),
      systolic: systolic,
      diastolic: diastolic,
      pulseRate: pulseRate,
    };
  } catch (error) {
    console.error("Google Sheet fetch error:", error);
    return {
      message: "Internal service error",
    };
  }
};
