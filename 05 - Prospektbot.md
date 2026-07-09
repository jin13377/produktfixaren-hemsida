# Prospektbot

Jag har lagt en prospektbot i:

`verktyg/prospektbot.py`

Den kan:

- soka efter smaforetag i Sverige
- oppna deras hemsidor
- hitta kontaktmail nar det finns publikt
- ge en enkel behovspoang
- skriva personliga mailutkast
- spara allt i `prospekt/rapport.md` och `prospekt/kandidater.csv`

## Viktig grans

Botten skickar inte mail automatiskt.

Det ar medvetet. Oombedda massutskick kan skada fortroendet for Produktfixaren. Battre ordning ar:

1. hitta kandidater
2. valj de 3-5 basta
3. lasa mailutkasten
4. skapa Gmail-utkast
5. skicka bara de du godkanner

## Korning

Sok brett i Sverige:

`python verktyg/prospektbot.py --max 20`

Sok bara vissa stader:

`python verktyg/prospektbot.py --locations "Vaxjo,Kalmar,Jönköping" --max 15`

Sok vissa branscher:

`python verktyg/prospektbot.py --sectors "cykelbutik,blomsterbutik,cafe,salong" --max 15`

## Filer som skapas

- `prospekt/rapport.md` - lasbar rapport med mailutkast
- `prospekt/kandidater.csv` - lista som kan oppnas i Excel
- `prospekt/kandidater.json` - data om vi vill bygga vidare senare

## Nasta smarta steg

Kor botten pa 10-20 kandidater forst.

Valj sedan max 3 mail att skicka. Hellre fa kontakt med fa bra foretag an att skicka manga svaga mail.

