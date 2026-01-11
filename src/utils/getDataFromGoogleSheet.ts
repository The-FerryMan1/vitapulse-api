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
    if (!result) return { message: "No data found" };

    const part = result.trim().split(",");

    if (part.length !== 5) {
      return { message: "Invalid data format" };
    }

    const datePart = `${part[0]}`;
    const timePart = `${part[1]}`;
    const systolic = Number(part[2]);
    const diastolic = Number(part[3]);
    const pulseRate = Number(part[4]);

    // Validate data ranges
    if (isNaN(systolic) || systolic < 80 || systolic > 250) {
      return { message: "Invalid systolic value" };
    }
    if (isNaN(diastolic) || diastolic < 50 || diastolic > 150) {
      return { message: "Invalid diastolic value" };
    }
    if (isNaN(pulseRate) || pulseRate < 40 || pulseRate > 200) {
      return { message: "Invalid pulse rate value" };
    }

    const finalDate = `${datePart} ${timePart}`;
    const formattedDate = new Date(finalDate);

    if (isNaN(formattedDate.getTime())) {
      return { message: "Invalid date format" };
    }

    return {
      date: formattedDate.toISOString(),
      systolic: systolic,
      diastolic: diastolic,
      pulseRate: pulseRate,
      validated: true,
    };
  } catch (error) {
    // Error logging should be handled by the calling function
    return {
      message: "Internal service error",
    };
  }
};
