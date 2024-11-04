import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import userAgent from 'user-agents';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prDataDir = path.join(__dirname, '..', '..', 'data', 'processed');
const rawIDataDir = path.join(__dirname, '..', '..', 'data', 'raw', 'inst');
const inst_p = "inst.txt";

export async function GetInst(instPath = path.join(prDataDir, inst_p), rawPath = rawIDataDir) {
    try {
     // Читаем inst.txt
     const instFile = await fs.promises.readFile(instPath, 'utf8');
     const instList = instFile.split('\n').map(Number).filter(Boolean);
   
     // Проверяем наличие новых файлов в raw
     const rawFiles = await readdir(rawPath);
     const newRawFiles = rawFiles.filter(file => !instList.includes(parseInt(file.slice(0, -4))));
   
     // Обрабатываем новые файлы
     for (const file of newRawFiles) {
      const rawNumber = parseInt(file.slice(0, -4)); 
      if (!instList.includes(rawNumber)) {
       console.log(`Номер ${rawNumber} отсутствует в inst.txt`);
       await fs.promises.appendFile(instPath, `\n${rawNumber}`);
       return rawNumber; // возвращаем инст
      }
     }
    } catch (error) {
     console.error('Ошибка:', error);
    }
   }

export function GetData(filePath, deleteFile = false) {
 try {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (deleteFile) {
   fs.unlinkSync(filePath); // Удаление файла
  }

  return data; // Возврат данных в виде объекта

 } catch (error) {
  console.error(`Ошибка чтения файла ${filePath}: ${error}`);
  return null; // Возврат null в случае ошибки
 }
}