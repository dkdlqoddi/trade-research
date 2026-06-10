# 미국 주식 종목 유니버스

반등 스크리너(`src/lib/screener`)가 읽는 **단일 진실**이다. 표 형식을 유지하라 — 파서가 `| 티커 | 이름 | 비고 |` 행을 읽는다(섹션 제목 = 카테고리). 종목 추가/삭제는 이 파일 수정만으로 반영된다.

## 대형주

| 티커 | 이름 | 비고 |
|---|---|---|
| AAPL | Apple | |
| MSFT | Microsoft | |
| NVDA | NVIDIA | |
| GOOGL | Alphabet (Class A) | |
| AMZN | Amazon | |
| META | Meta Platforms | |
| TSLA | Tesla | |
| AVGO | Broadcom | |
| BRK-B | Berkshire Hathaway (Class B) | |
| JPM | JPMorgan Chase | |
| V | Visa | |
| MA | Mastercard | |
| UNH | UnitedHealth | |
| XOM | Exxon Mobil | |
| LLY | Eli Lilly | |
| JNJ | Johnson & Johnson | |
| WMT | Walmart | |
| PG | Procter & Gamble | |
| HD | Home Depot | |
| COST | Costco | |
| ORCL | Oracle | |
| NFLX | Netflix | |
| AMD | AMD | |
| CRM | Salesforce | |
| KO | Coca-Cola | |

## 지수 ETF

| 티커 | 이름 | 비고 |
|---|---|---|
| SPY | SPDR S&P 500 | S&P 500 |
| VOO | Vanguard S&P 500 | S&P 500 |
| QQQ | Invesco QQQ | 나스닥 100 |
| DIA | SPDR Dow Jones | 다우 30 |
| IWM | iShares Russell 2000 | 소형주 |
| VTI | Vanguard Total Market | 전체 시장 |

## 섹터 ETF

| 티커 | 이름 | 비고 |
|---|---|---|
| XLK | Technology Select | 기술 |
| XLF | Financial Select | 금융 |
| XLE | Energy Select | 에너지 |
| XLV | Health Care Select | 헬스케어 |
| XLI | Industrial Select | 산업재 |
| XLY | Consumer Discretionary | 임의소비재 |
| XLP | Consumer Staples | 필수소비재 |
| SMH | VanEck Semiconductor | 반도체 |

## 레버리지·인버스 ETF

⚠️ 레버리지 ETF는 일일 수익률의 배수를 추적한다 — 변동성 잠식(volatility decay)으로 장기 보유 시 기초지수 배수와 괴리가 커진다. 반등 통계 해석에 특히 주의.

| 티커 | 이름 | 비고 |
|---|---|---|
| TQQQ | ProShares UltraPro QQQ | 나스닥100 3x |
| SQQQ | ProShares UltraPro Short QQQ | 나스닥100 -3x |
| SOXL | Direxion Semiconductor Bull 3X | 반도체 3x |
| SOXS | Direxion Semiconductor Bear 3X | 반도체 -3x |
| UPRO | ProShares UltraPro S&P 500 | S&P500 3x |
| SPXU | ProShares UltraPro Short S&P 500 | S&P500 -3x |
| SSO | ProShares Ultra S&P 500 | S&P500 2x |
| SDS | ProShares UltraShort S&P 500 | S&P500 -2x |
| QLD | ProShares Ultra QQQ | 나스닥100 2x |
| TNA | Direxion Small Cap Bull 3X | 러셀2000 3x |
| TZA | Direxion Small Cap Bear 3X | 러셀2000 -3x |
| TECL | Direxion Technology Bull 3X | 기술 3x |
| NVDL | GraniteShares 2x Long NVDA | NVDA 2x |
| TSLL | Direxion Daily TSLA Bull 2X | TSLA 2x |
