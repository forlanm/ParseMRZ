import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import userAgent from 'user-agents';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

import { GetInst } from './utils.js';
import { GetData } from './utils.js';

const inst = GetInst();
let browser; // Глобальная переменная для браузера
let page;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rawDataDir = path.join(__dirname, '..', '..', 'data', 'raw');

async function initBrowser() {
    if (!browser) {
      puppeteer.use(StealthPlugin());
      browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    }
  }

async function initPage(rl) {
    if (!page | rl) {
        page = await browser.newPage();
    }
  }

async function login(username, password) {
    await initBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(userAgent.toString());

    // Заход на мос ру с помощью гугла (иначе детект)
    await page.goto('https://www.google.com/search?q=mos+ru', { waitUntil: 'networkidle2' }); 
    // Ждем, пока div с Mos.ru появится
    await page.waitForSelector('div[class="BNeawe vvjwJb AP7Wnd"]'); // хз откуда берутся эти символы, мб протобаф или чето другое

    // Нажимаем на div
    await page.click('div[class="BNeawe vvjwJb AP7Wnd"]');
    await new Promise(r => setTimeout(r, 3000));
    // Переход на страницу входа
    await page.waitForSelector('button[aria-label="Вход/Регистрация"]');
    await page.click('button[aria-label="Вход/Регистрация"]', {delay: 200});
    // Ввод логина и пароля
    await page.waitForSelector('input[name="login"]')
    await new Promise(r => setTimeout(r, 4000));
    await page.evaluate(val => document.querySelector('input[name="login"]').value = val, username, { delay: 100 })
    await new Promise(r => setTimeout(r, 4000));
    await page.evaluate(val => document.querySelector('input[name="password"]').value = val, password, { delay: 100 })
    // Нажатие кнопки входа
    await new Promise(r => setTimeout(r, 6000));
    await page.keyboard.press('Enter');
    // await page.click('button[class="form-login__submit"]'); // можно и так
    
    // Проверка успешного входа
    let returnTable = {
        stat: '',
        capchaMt: '',
    };
    const successMessage = await page.waitForSelector('button[aria-label="Меню пользователя"]');
    if (successMessage) {
     console.log('Вход выполнен успешно.');
     returnTable.stat = 1;
    } else {
     console.error('Ошибка входа.'); 
     returnTable.stat = 0;
    }
    const checkCapcha = await page.waitForSelector('img[class="formCaptcha__secret hidden"]') // проверка на селектор капчи
    if (checkCapcha) {
     // Получение ссылки на изображение капчи
    const captchaImgSrc = await page.evaluate(() => {
        const img = document.querySelector('img[class="formCaptcha__secret hidden"]');
        return img ? img.src : null; // такое редко случается, но капча необходима порой бывает для входа в систему, как нибудь потом реализуем ее переброс пользователю в тг
    });

    // Загрузка изображения с помощью fetch
    const response = await fetch(captchaImgSrc);
    const imageBuffer = await response.buffer();

    // Сохранение изображения в файл
    io = Math.floor(Math.random() * (2**14));
    cPath = `captha${io}.png`;
    fs.writeFileSync(path.join(rawDataDir, cPath), imageBuffer);

    console.log(`Капча сохранена в файл ${cPath} (check raw)`);
    returnTable.capchaMt = 1;
    } else {
    returnTable.capchaMt = 0;
    }
    return returnTable;
   }

async function fetchProductList(url, rl, inst) {
    await initBrowser();
    await initPage(rl);
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.setUserAgent(userAgent.toString());
    await new Promise(r => setTimeout(r, 6000));
    await page.click('div[class="style_btn__3lIWs"]', { delay: 100 })
        
    await page.waitForSelector('p[class^="MuiTypography-root MuiTypography-body1 MuiTypography-alignCenter diary-emotion-cache-"]', { timeout: 120000 });
    await page.click('a[href="/diary/homeworks"]', {delay: 200});
    
    await new Promise(r => setTimeout(r, 3000));
    const htmlContent = await page.$eval(
        'div[class="diary-emotion-cache-1kkx4gx"]',
        (element) => element.outerHTML
      ); // Извлечение outerHTML 
    
    path_h = `scraped${inst}.html`;
    fs.writeFileSync(path.join(rawDataDir, path_h), htmlContent);
    console.log(`HTML document saved to ${path_h}`);
    const client = new net.Socket();
      client.connect(3000, 'localhost', () => {
      client.write(inst); // Отправляем 'n' по сокету
      client.end();
    });
    await new Promise(r => setTimeout(r, 900000)); // перезагрузка каждые 15 минут
    await page.reload({ waitUntil: 'networkidle2' }); 
    fetchProductList(url, 0, inst); // рекурсия до потери пульса
}

async function m_Parse(inst) {
    let startTime = Date.now();
    let GLOBAL_TIMEOUT = 604800*(10**3); // неделя
    const lP = `lP${inst}.json`;
    try {
     await waitForFile(path.join(rawDataDir, lP), GLOBAL_TIMEOUT);
     console.log(`Файл ${lP} обнаружен, начинаю парсинг...`);
    
     const dL = GetData(path.join(rawDataDir, lP), 1); // Получение данных из файла
     if (dL) {
      if (login(dL.login, dL.pass).stat){ // Вызов функции login с данными из файла
      console.log(fetchProductList('https://school.mos.ru', 1, inst)); // Вызов функции fetchProductList
      } 
     } else {
      console.error('Ошибка получения данных из lP.json');
     }
   
    } catch (error) {
     console.error(error);
    } finally {
     console.log('Time: ', (Date.now() - startTime) / 1000, 's');
    }
   }
   
   function waitForFile(filePath, timeout) {
    return new Promise((resolve, reject) => {
     const timer = setTimeout(() => {
      reject(new Error(`Файл ${lP} не появился в течение ${timeout / 1000} секунд`));
     }, timeout);
   
     const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
       clearInterval(interval);
       clearTimeout(timer);
       resolve();
      }
     }, 100);
    });
   }
const args = process.argv.slice(2); // Удаляем первые два элемента: 'node' и имя файла

if (args.length > 0) {
  m_Parse(args[0]); // Передаем первый аргумент функции main
  } else {
  console.log("Аргумент не передан.");
  }