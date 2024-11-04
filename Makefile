all: main

main: processor/cpp/main.cpp
	g++ -o main processor/cpp/main.cpp -lws2_32

clean:
	rm -f main