# Trechos do código-fonte

Arquivos reais do motor da GLOSA, publicados como amostra de código:

| Arquivo | O que mostra |
|---|---|
| `types.ts` | Modelo de domínio. Cada termo contratual carrega a evidência de onde veio (`OBSERVED` / `INFERRED` / `CONFIRMED`). |
| `indices.ts` | Snapshot versionado do IPCA e do IGP-M oficiais (BCB SGS) e o acumulado de 12 meses que **nunca extrapola** um mês não publicado. |
| `pricing.ts` | Preço contratual devido em cada competência: aniversários, teto, variação negativa sem redução, arredondamento e a explicação passo a passo. |
| `util.ts` | Competências, arredondamento monetário e formatação pt-BR. |

As regras de auditoria, o verificador de citações, os prompts e o gerador do gabarito ficam no repositório privado.
