import socket
import json
import os
import random
import io

HOST = 'localhost' # Стандартный хост для локальной связи
PORT = 3000    # Порт, который использует сервер
i = random.randint(1024, 9999)
current_dir = os.path.dirname(os.path.abspath(__file__)) # Получение абсолютного пути к текущей директории
data_raw_dir = os.path.join(current_dir, '..', '..', 'data', 'raw') # Получение пути к директории data/raw
data_pr_dir = os.path.join(current_dir, '..', '..', 'data', 'processed') # Получение пути к директории data/raw
file_name = f'homework{i}.txt'
file_path = os.path.join(data_pr_dir, file_name)

stat = 0

def ToProc():
  global HOST, PORT, i
  i_str = str(i)
  i_bytes = i_str.encode()
  with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    try:
      sock.connect((HOST, PORT))
      sock.sendall(i_bytes) # Отправка 'n' в байтовом формате
    except ConnectionRefusedError:
      print(f"Ошибка: Не удалось подключиться к серверу на {HOST}:{PORT}")
    finally:
      sock.close()

 
def fStart():
  global i, data_raw_dir
  print("Привет! Дай мне свой логин и пароль от сайта mos.ru! =)=))):")
  login = input('login: ')
  pwd = input('pass: ')

  # Генерирование имени файла
  file_name = f"lP{i}.json" # Замените 'i' на нужный номер файла

  # Создание пути к файлу
  file_path = os.path.join(data_raw_dir, file_name)

  # Создание данных в формате JSON
  data = {
    "login": login,
    "pass": pwd
  }

  # Запись данных в файл
  with open(file_path, 'w') as f:
    json.dump(data, f, indent=4)
  
  print(f"Данные записаны в файл: {file_path}")
  ToProc()
  main()

def main():
  global i, stat, file_path
  if stat == 0:
    stat = 1
    fStart()
  else:
    command = input(f"Ваш i: {i}. Получить дз на неделю? Y/n: ")
    if command == "y":
      ToProc()
      if os.path.exists(file_path):
        with io.open(file_path, 'r', encoding='utf-8') as f:
          print(f"Содержимое файла {file_name}:\n")
          for line in f:
            print(line)
      else:
        print(f"Файл {file_name} не найден. ДЗ еще не получено...")
        main()
    else:
      main()


main()

