#include <iostream>
#include <string>
#include <fstream>
#include <thread>
#include <vector> // Для работы с массивом
#include <winsock2.h>
#include <windows.h>


#pragma comment (lib, "Ws2_32.lib")


#define DEFAULT_BUFLEN 512
#define DEFAULT_PORT "27015"
using namespace std;

vector<string> args;
int addUniqueArg(const string& arg) {
    // Проверка, есть ли уже аргумент в массиве
    for (const auto& existingArg : args) {
        if (existingArg == arg) {
            return 0; // Аргумент уже существует
        }
    }

    // Добавляем аргумент в массив
    args.push_back(arg);
    return 1; // Аргумент добавлен
}

// Функция запуска Node.js скрипта
int runNodeScript(const string& scriptName, const string& arg) {
    // Формирование команды для запуска скрипта
    string command = "node " + scriptName + " " + arg;

    // Создание дочернего процесса
    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    ZeroMemory(&pi, sizeof(pi));
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE; // Скрытие окна консоли

    // Запуск Node.js скрипта
    if (!CreateProcessA(NULL,  // Имя исполняемого файла
                        const_cast<char*>(command.c_str()), // Команда
                        NULL,  // Атрибуты безопасности процесса
                        NULL,  // Атрибуты безопасности потока
                        FALSE, // Наследовать дескрипторы
                        0,     // Флаги создания процесса
                        NULL,  // Указатель на окружение процесса
                        NULL,  // Путь к рабочему каталогу
                        &si,  // Информация о запуске процесса
                        &pi)) // Информация о процессе
    {
        cerr << "Ошибка запуска Node.js скрипта: " << scriptName << endl;
        return 1;
    }

    // Ожидание завершения дочернего процесса
    WaitForSingleObject(pi.hProcess, INFINITE);

    // Закрытие дескрипторов
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return 0;
}


// Функция обработки новых данных
void processData(const string& arg) {
    int result = addUniqueArg(arg);
    std :: cout << "Got " << arg << std :: endl;
    if (result){
    // Запуск scraper
    runNodeScript("scraper/puppeteer/index.js", arg);
    }
    // Запуск transformer
    else {
    runNodeScript("scraper/transformer/index.js", arg);
    }
}

int main() {
    std::cout << "START" << std :: endl;

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, 0);

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.S_un.S_addr = INADDR_ANY;
    serverAddr.sin_port = htons(3000);

    bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr));
    listen(serverSocket, 1);

    while (true) {
        SOCKET clientSocket = accept(serverSocket, NULL, NULL);

        char buffer[1024] = {0};
        recv(clientSocket, buffer, sizeof(buffer), 0);

        string arg(buffer); // Получаем строку из буфера

        if (!arg.empty()) {
            thread processThread(processData, arg);
            processThread.detach(); // Отсоединяем поток, чтобы не ждать его завершения
        }

        closesocket(clientSocket);
    }

    closesocket(serverSocket);
    WSACleanup();

    return 0;
}
