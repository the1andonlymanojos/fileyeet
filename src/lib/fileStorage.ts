import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, 'calls.json');

const readData = (): { [key: string]: any } => {

    if (!fs.existsSync(filePath)) {
        console.log("Creatign a file")
        fs.writeFileSync(filePath, JSON.stringify({}));
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
};

const writeData = (data: { [key: string]: any }): void => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const getCalls = (): { [key: string]: any } => {
    console.log("Getting calls");
    return readData();
};

export const saveCalls = (calls: { [key: string]: any }): void => {
    console.log("Save Call", calls);
    writeData(calls);
};
