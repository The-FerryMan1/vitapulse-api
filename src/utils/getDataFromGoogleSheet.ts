export const googelSheetGetHelper = async (url: string) => {
    try {
        const res = await fetch(url, {
            method: "GET"
        });

        if (!res.ok) return {
            message: 'No data found'
        };
        const result = await res.text();

        const part = result.split(',')
        return {
            date: part[0],
            timestamp: part[1],
            systolic: Number(part[2]),
            diastolic: Number(part[3]),
            pulseRate: Number(part[4]),
        };
    } catch (error) {
        console.log(error);
        return {
            message: 'Internal service error'
        };
    }
}