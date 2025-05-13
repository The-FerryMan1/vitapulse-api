export const googelSheetGetHelper = async (url: string) => {
    try {
        const res = await fetch(url, {
            method: "GET"
        });

        if (!res.ok) return {
            message: 'No data found'
        };
        const result = await res.text();



        const [dateStr, legacyDateTimeStr, systolic, diastolic, pulseRate] = result.split(',');
        const timeMatch = legacyDateTimeStr.match(/\d{2}:\d{2}:\d{2}/);
        const timeStr = timeMatch ? timeMatch[0] : null;



        const [day, month, year] = dateStr.split('/');
        const isoDate = new Date(`${year}-${month}-${day}T${timeStr}+08:00`).toISOString();



        return {
            date: isoDate,
            systolic: Number(systolic),
            diastolic: Number(diastolic),
            pulseRate: Number(pulseRate),
        };
    } catch (error) {
        console.log(error);
        return {
            message: 'Internal service error'
        };
    }
}