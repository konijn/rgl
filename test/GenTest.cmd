@echo About to run %1.rgl
@node ..\bin\rgl.js ..\examples\%1.rgl %2 %3 %4 %5 %6 %7 %8 %9 > test.out
@diff test.out .\out\%1.out --brief
@fc test.out .\out\%1.out > nul
@if errorlevel 1 goto different
@echo Success
@goto out
:different
@echo Test Failed
@echo Expected:
@cat .\out\%1.out
@echo Result:
@cat test.out
@echo Difference:
@diff test.out .\out\%1.out
:out