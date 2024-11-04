import { HTMLToJSON } from 'html-to-json-parser';
import fs from 'fs';            // | хз   чем         , они      пугают
import fsh from 'fs/promises';  // |    в     разница       меня           
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rawDataDir = path.join(__dirname, '..', '..', 'data', 'raw');
const prDataDir = path.join(__dirname, '..', '..', 'data', 'processed');


async function ToJSON(inst) {
 try {
  const path_h = path.join(rawDataDir,`scraped${inst}.html`);
  // Читаем HTML-файл
  const html = await fsh.readFile(path_h, 'utf8');
  
  // Преобразуем HTML в JSON
  const json = await HTMLToJSON(html);

  console.log(`HTML преобразован в JSON.`);
  return json;
 } catch (error) {
  console.error('Ошибка при преобразовании HTML в JSON:', error);
 }
}

async function toTxt(jsonData, inst) {
    const dateClass = 'MuiTypography-root MuiTypography-body1 diary-emotion-cache-5p2wtf';
    const subjectClass = 'MuiTypography-root MuiTypography-body1 diary-emotion-cache-ffz7zu';
    const timeClass = 'MuiTypography-root MuiTypography-body1 diary-emotion-cache-1to8prz';
    const homeworkClass = 'MuiTypography-root MuiTypography-body1 diary-emotion-cache-choxs';
   
    let outputText = 'Домашние задания: \n\n';
    let currentDay = '';
   
    for (const item of jsonData) { // Use a for...of loop for iterating arrays
     if (item.attributes.class === dateClass) {
      // Начало нового дня
      outputText += `${item.content}\n`;
     } else if (item.attributes.class === subjectClass) {
      outputText += `\`\`\`\n${item.content}\n`;
     } else if (item.attributes.class === timeClass) {
      outputText += `${item.content}\n`;
     } else if (item.attributes.class === homeworkClass) {
      outputText += `${item.content}\n\`\`\`\n\n`;
     }
    }
   
    fs.writeFileSync(path.join(prDataDir,`homework${inst}.txt`), outputText);
    console.log('Записано в homework.txt');
   }

   function extractParagraphs(data) {
    const paragraphs = [];
   
    function traverse(node) {
     if (node.type === 'p') {
      // Обработка случая, когда node.content - строка
      if (typeof node.content === 'string') {
       paragraphs.push({
        content: node.content,
        attributes: node.attributes,
       });
      } else if (Array.isArray(node.content)) {
       paragraphs.push({
        content: node.content.join(''),
        attributes: node.attributes,
       });
      } else {
       console.warn(`Warning: Found 'p' node with unexpected content: ${JSON.stringify(node)}`);
      }
     } else if (node.content) {
      if (Array.isArray(node.content)) {
       node.content.forEach(traverse);
      } else {
       console.warn(`Warning: Found node with non-array content: ${JSON.stringify(node)}`);
      }
     }
    }
   
    traverse(data);
    return paragraphs;
   }

async function transform (inst) {
    // HTML to json для удобного парсинга
    const jsonData = await ToJSON(inst);
    // Преобразовываем в более читаемый с рел инфой
    const extractedParagraphs = extractParagraphs(jsonData);
    console.log(extractedParagraphs);
    // Записываем результат в txt:
    await toTxt(extractedParagraphs, inst);
    }
    const args = process.argv.slice(2); // Удаляем первые два элемента: 'node' и имя файла

    if (args.length > 0) {
      transform(args[0]); // Передаем первый аргумент функции main
      } else {
      console.log("Аргумент не передан.");
      }