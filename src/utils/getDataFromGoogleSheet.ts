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


        const date = new Date(part[0]);
        const time = new Date(part[1]);

        const combineDatetime = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            time.getHours(),
            time.getMinutes(),
            time.getSeconds()
        )
        return {
            date: combineDatetime.toISOString(),
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