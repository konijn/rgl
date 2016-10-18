@call GenTest 5bottles
@call GenTest ChessBoard
@call GenTest CountDown
@call GenTestPipe Echo Echo
@call GenTestPipe EchoTwice EchoTwice
@call GenTest EWithE "7,2,+,|,-"
@call GenTest HelloWorld
@call GenTest KangarooSequence 10
@call GenTestPipe R01IntegerComparison R01_LT
@call GenTestPipe R01IntegerComparison R01_GT
@call GenTestPipe R01IntegerComparison R01_EQ
@call GenTestPipe R02IntegerOperations R02
@call GenTest R03Factors 60
@echo Cleaning up..
@del test.out