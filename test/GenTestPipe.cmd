@echo About to run %1.rgl with %2
@node ..\bin\rgl.js ..\examples\%1.rgl < .\in\%2.in > test.out
@diff test.out .\out\%1%2.out --brief
@fc test.out .\out\%1%2.out > nul
@if errorlevel 1 goto different
@echo Success
@goto out
:different
@echo Test Failed
@echo Expected:
@cat .\out\%1%2.out
@echo Result:
@cat test.out
@echo Difference:
@diff test.out .\out\%1%2.out
:out