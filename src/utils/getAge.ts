export const getTheAge = (bday:string)=>{
    const birthday = new Date(bday);
    const today = new Date
    return today.getFullYear() - birthday.getFullYear();
}