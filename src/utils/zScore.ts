type resultWithPpAndMap ={

    id: number;
    diastolic: number;
    systolic: number;
    bpStatus: string;
    pulseStatus: string;
    pulse: number;
    timestamp: string;
}[]

export const calculateZScores = (data: resultWithPpAndMap) => {
    const keys: (keyof typeof data[number])[] = ['systolic', 'diastolic', 'pulse'];

    const zScores = data.map((entry) => {
        const result: any = { ...entry };

        keys.forEach((key) => {
            const values = data.map(item => item[key] as number);
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

            result[`${key}Z`] = stdDev === 0 ? 0 : parseFloat(((entry[key] as number - mean) / stdDev).toFixed(2));
        });

        return result;
    });

    return zScores;
};
