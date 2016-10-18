@rem Note to self, if suddenly regexes step working, resave the code files as ANSI
@rem The register variables Ò,Ó,Ô,Õ, and Ö drive Nodes nuts in UTF-8 mode
@del .\out\*.out
@call GenPrep HelloWorld
@call GenPrep CountDown
@call GenPrep 5bottles
@call GenPrepPipe Echo Echo
@call GenPrepPipe EchoTwice EchoTwice
@call GenPrepPipe R01IntegerComparison R01_LT
@call GenPrepPipe R01IntegerComparison R01_GT
@call GenPrepPipe R01IntegerComparison R01_EQ
@call GenPrepPipe R02IntegerOperations R02
@call GenPrep ChessBoard
@call GenPrep R03Factors 60
@call GenPrep EWithE "7,2,+,|,-"
@call GenPrep KangarooSequence 10