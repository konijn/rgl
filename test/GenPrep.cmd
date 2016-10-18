@echo ** Running %1 **
@node ..\bin\rgl.js ..\examples\%1.rgl %2 %3 %4 %5 %6 %7 %8 %9 > .\out\%1.out
@cat .\out\%1.out