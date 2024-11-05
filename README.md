# ParseMRZ
 Парсинг сайта МЭШ, построенного на ReactJS.


## Структура проекта
```
├── scraper
│   ├── puppeteer
│   │   ├── index.js <------------------------ Запуск Puppeteer / парс
│   │   └── utils.js <------------------------  Утилиты для index
│   └── transformer
│       └── index.js <------------------------ Преобразование HTML в JSON в TXT
├── data
│   ├── raw
│   │   └── example{i}.json <------------------------ Исходный HTML->JSON
|   |   └── capcha{i}.png <------------------------ Капча по необходимости
│   │   └── example{i}.html <------------------------ Исходный HTML
│   └── processed
│       └── homework{i}.txt <------------------------ Преобразованный HTML->JSON->TXT 
|       └── inst.txt <------------------------ Фиксация запущенных процессов // на будущее если будет доп запрос кроме INST( по поводу передачи между шлюзами )
├── processor
│   └── cpp
│       └── main.cpp <------------------------ C++ шлюз между парсером и TG
├── sender
│   └── python
│       └── main.py <------------------------ Python обработчик данных и отправка в TG / ...
├── config
│   └── config.json <------------------------ Конфигурационные данные // будут обновлены в будущем (переменные и пути)
├── README.md
└── requirements.txt
```

## Алгоритм взаимодействий:
```
C++ <—Получение новой задачи (к примеру arg=2288)— main.py
C++ —Запуск+arg=2288—-> index.js
C++ <--Возврат arg=2288—— index.js
C++ —-Запуск+arg2288——-> transf.js (index.js в transformer)
C++ <---Возврат arg=2288—— transf.js (index.js в transformer)
C++ —-Передача статуса—--> main.py (о том, что получен новый файл (обновление файла))

* arg = inst
```

## Установка зависимостей и сборка:

```bash
cd /scraper/puppeteer
npm install
cd ../transformer
npm install
cd ../.. 
make
```

## Запуск
```bash
run
```

p.s. Во всех файлах из scraper headless = false. Для большей скорости желательно установить headless = true.
