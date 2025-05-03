// randomBpPulse.ts
// This file contains a function to generate random blood pressure and pulse rate data
interface bgPulseData {
    id: string | number,
    systolic: number,
    diastolic: number,
    pulseRate: number,
    date: string,
}

//get Random Blood Pressure and Pulse Rate Data
// systolic: 110-130, diastolic: 70-85, pulseRate: 60-100 bpm
// returns a random blood pressure and pulse rate data object
const generateRandomBPData = (): bgPulseData => {
    const id = 1;
    const systolic = Math.floor(Math.random() * (130 - 110 + 1) + 110); // 110-130
    const diastolic = Math.floor(Math.random() * (85 - 70 + 1) + 70); // 70-85  
    const pulseRate = Math.floor(Math.random() * (100 - 60 + 1) + 60); // 60-100 bpm

    return { id, systolic, diastolic, pulseRate, date: String(new Date()) };
}

export default generateRandomBPData;