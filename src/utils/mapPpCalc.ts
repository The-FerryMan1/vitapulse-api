// Pulse Pressure = Systolic - Diastolic
//MAP = (2 × Diastolic + Systolic) ÷ 3
interface Readings {
    id: number;
    diastolic: number;
    systolic: number;
    bpStatus: string;
    pulseStatus: string;
    pulse: number;
    timestamp: string;
}

export const ppMapCalculate = (reading: Readings[])=>{


    const readingWithPP = reading.map((record)=>{
        const pp = record.systolic - record.diastolic;
        const map = (2 * record.diastolic + record.systolic) / 3;

        const ppStatus = pp < 30 ? 'Low' : pp > 50 ? 'High' : 'Normal'
        const mapStatus = map < 70 ? 'Low' : map > 100 ? 'High' : 'Normal'

        return {
            ...record,
            pulsePressure: parseFloat(pp.toFixed(1)),
            ppStatus:ppStatus, 
            map: parseFloat(map.toFixed(1)),
            mapStatus: mapStatus,

        }
    });
    return readingWithPP;
}