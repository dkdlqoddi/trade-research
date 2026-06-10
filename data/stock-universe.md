# 미국 주식 종목 유니버스 — 주식 상위 200 + ETF 상위 100

반등 스크리너(`src/lib/screener`)가 읽는 **단일 진실**이다. 표 형식을 유지하라 — 파서가 `| 티커 | 이름 | 비고 |` 행을 읽고, 섹션 제목(`## `)이 카테고리가 된다. 레버리지·인버스 여부는 **비고의 배율 표기**(예: `3x`, `-2x`, `인버스`)로 판별된다.

큐레이션 기준 `[ASSUMED]`: 2026-06 시점의 시가총액(주식)·운용자산(ETF) 상위 — 원본 순위는 실시간 조회하지 않으며, 갱신은 이 파일 편집으로 한다. 부정확/폐지 티커는 조회 실패(R4)로 표면화된다.

## 주식 상위 200

| 티커 | 이름 | 비고 |
|---|---|---|
| AAPL | Apple | |
| MSFT | Microsoft | |
| NVDA | NVIDIA | |
| GOOGL | Alphabet A | |
| AMZN | Amazon | |
| META | Meta Platforms | |
| TSLA | Tesla | |
| AVGO | Broadcom | |
| BRK-B | Berkshire Hathaway B | |
| LLY | Eli Lilly | |
| WMT | Walmart | |
| JPM | JPMorgan Chase | |
| V | Visa | |
| XOM | Exxon Mobil | |
| UNH | UnitedHealth | |
| ORCL | Oracle | |
| MA | Mastercard | |
| HD | Home Depot | |
| PG | Procter & Gamble | |
| COST | Costco | |
| JNJ | Johnson & Johnson | |
| NFLX | Netflix | |
| ABBV | AbbVie | |
| BAC | Bank of America | |
| CRM | Salesforce | |
| CVX | Chevron | |
| KO | Coca-Cola | |
| AMD | AMD | |
| PEP | PepsiCo | |
| TMO | Thermo Fisher | |
| MRK | Merck | |
| CSCO | Cisco | |
| ACN | Accenture | |
| LIN | Linde | |
| MCD | McDonald's | |
| ADBE | Adobe | |
| WFC | Wells Fargo | |
| IBM | IBM | |
| GE | GE Aerospace | |
| ABT | Abbott | |
| TXN | Texas Instruments | |
| AXP | American Express | |
| QCOM | Qualcomm | |
| MS | Morgan Stanley | |
| NOW | ServiceNow | |
| PM | Philip Morris | |
| CAT | Caterpillar | |
| ISRG | Intuitive Surgical | |
| VZ | Verizon | |
| INTU | Intuit | |
| AMGN | Amgen | |
| GS | Goldman Sachs | |
| T | AT&T | |
| RTX | RTX | |
| PFE | Pfizer | |
| SPGI | S&P Global | |
| UBER | Uber | |
| DIS | Walt Disney | |
| LOW | Lowe's | |
| BKNG | Booking Holdings | |
| NEE | NextEra Energy | |
| UNP | Union Pacific | |
| HON | Honeywell | |
| BLK | BlackRock | |
| SYK | Stryker | |
| COP | ConocoPhillips | |
| TJX | TJX Companies | |
| PLTR | Palantir | |
| VRTX | Vertex Pharma | |
| BSX | Boston Scientific | |
| C | Citigroup | |
| SCHW | Charles Schwab | |
| PGR | Progressive | |
| ETN | Eaton | |
| MU | Micron | |
| BA | Boeing | |
| ANET | Arista Networks | |
| LMT | Lockheed Martin | |
| ADP | ADP | |
| DHR | Danaher | |
| PANW | Palo Alto Networks | |
| GILD | Gilead | |
| MDT | Medtronic | |
| FI | Fiserv | |
| SBUX | Starbucks | |
| BMY | Bristol Myers | |
| DE | Deere | |
| PLD | Prologis | |
| ADI | Analog Devices | |
| MMC | Marsh McLennan | |
| CB | Chubb | |
| LRCX | Lam Research | |
| KLAC | KLA | |
| AMAT | Applied Materials | |
| INTC | Intel | |
| SO | Southern Company | |
| MO | Altria | |
| ELV | Elevance Health | |
| REGN | Regeneron | |
| ICE | Intercontinental Exchange | |
| CME | CME Group | |
| DUK | Duke Energy | |
| SHW | Sherwin-Williams | |
| EQIX | Equinix | |
| PH | Parker Hannifin | |
| AON | Aon | |
| CTAS | Cintas | |
| WM | Waste Management | |
| MCK | McKesson | |
| MDLZ | Mondelez | |
| CI | Cigna | |
| ORLY | O'Reilly Automotive | |
| APH | Amphenol | |
| CL | Colgate-Palmolive | |
| TT | Trane Technologies | |
| ZTS | Zoetis | |
| CMG | Chipotle | |
| MSI | Motorola Solutions | |
| ITW | Illinois Tool Works | |
| PNC | PNC Financial | |
| TDG | TransDigm | |
| WELL | Welltower | |
| EMR | Emerson Electric | |
| FDX | FedEx | |
| NKE | Nike | |
| ECL | Ecolab | |
| NOC | Northrop Grumman | |
| CSX | CSX | |
| TGT | Target | |
| BDX | Becton Dickinson | |
| AJG | Arthur J. Gallagher | |
| MAR | Marriott | |
| USB | U.S. Bancorp | |
| CARR | Carrier Global | |
| ROP | Roper Technologies | |
| TFC | Truist Financial | |
| PCAR | PACCAR | |
| FCX | Freeport-McMoRan | |
| NSC | Norfolk Southern | |
| GM | General Motors | |
| SLB | SLB | |
| PSA | Public Storage | |
| AZO | AutoZone | |
| HLT | Hilton | |
| SRE | Sempra | |
| APD | Air Products | |
| AEP | American Electric Power | |
| GEV | GE Vernova | |
| ALL | Allstate | |
| CPRT | Copart | |
| OKE | ONEOK | |
| KMI | Kinder Morgan | |
| AFL | Aflac | |
| MET | MetLife | |
| DLR | Digital Realty | |
| O | Realty Income | |
| ROST | Ross Stores | |
| WMB | Williams Companies | |
| GD | General Dynamics | |
| NEM | Newmont | |
| URI | United Rentals | |
| PAYX | Paychex | |
| MNST | Monster Beverage | |
| CCI | Crown Castle | |
| TEL | TE Connectivity | |
| FICO | Fair Isaac | |
| PSX | Phillips 66 | |
| D | Dominion Energy | |
| AMP | Ameriprise | |
| COF | Capital One | |
| CMI | Cummins | |
| FAST | Fastenal | |
| KMB | Kimberly-Clark | |
| AIG | AIG | |
| LULU | Lululemon | |
| JCI | Johnson Controls | |
| MPC | Marathon Petroleum | |
| CTVA | Corteva | |
| TRV | Travelers | |
| BK | BNY Mellon | |
| PRU | Prudential | |
| PEG | Public Service Enterprise | |
| DOW | Dow | |
| HUM | Humana | |
| VLO | Valero Energy | |
| ODFL | Old Dominion Freight | |
| F | Ford | |
| LEN | Lennar | |
| A | Agilent | |
| KR | Kroger | |
| RSG | Republic Services | |
| IQV | IQVIA | |
| GEHC | GE HealthCare | |
| SYY | Sysco | |
| YUM | Yum! Brands | |
| CHTR | Charter Communications | |
| EXC | Exelon | |
| IDXX | IDEXX | |
| MRNA | Moderna | |
| CNC | Centene | |

## ETF 상위 100

⚠️ 레버리지·인버스 ETF는 일일 수익률의 배수를 추적한다 — 변동성 잠식(volatility decay)으로 장기 보유 시 기초지수 배수와 괴리가 커진다. 반등 통계 해석에 특히 주의.

| 티커 | 이름 | 비고 |
|---|---|---|
| SPY | SPDR S&P 500 | S&P 500 |
| IVV | iShares Core S&P 500 | S&P 500 |
| VOO | Vanguard S&P 500 | S&P 500 |
| VTI | Vanguard Total Stock Market | 전체 시장 |
| QQQ | Invesco QQQ | 나스닥 100 |
| VEA | Vanguard FTSE Developed | 선진국 |
| IEFA | iShares Core MSCI EAFE | 선진국 |
| VTV | Vanguard Value | 가치주 |
| BND | Vanguard Total Bond | 채권 |
| AGG | iShares Core US Aggregate Bond | 채권 |
| IWF | iShares Russell 1000 Growth | 성장주 |
| VUG | Vanguard Growth | 성장주 |
| IJH | iShares Core S&P Mid-Cap | 중형주 |
| VIG | Vanguard Dividend Appreciation | 배당 |
| IJR | iShares Core S&P Small-Cap | 소형주 |
| VWO | Vanguard FTSE Emerging | 신흥국 |
| IWM | iShares Russell 2000 | 소형주 |
| VXUS | Vanguard Total International | 해외 전체 |
| EFA | iShares MSCI EAFE | 선진국 |
| VO | Vanguard Mid-Cap | 중형주 |
| XLK | Technology Select | 기술 섹터 |
| GLD | SPDR Gold Shares | 금 |
| VB | Vanguard Small-Cap | 소형주 |
| SCHD | Schwab US Dividend Equity | 배당 |
| XLF | Financial Select | 금융 섹터 |
| IEMG | iShares Core MSCI Emerging | 신흥국 |
| VYM | Vanguard High Dividend Yield | 배당 |
| ITOT | iShares Core S&P Total | 전체 시장 |
| VCIT | Vanguard Intermediate Corp Bond | 회사채 |
| RSP | Invesco S&P 500 Equal Weight | 동일가중 |
| BNDX | Vanguard Total International Bond | 해외 채권 |
| VCSH | Vanguard Short-Term Corp Bond | 회사채 |
| IVW | iShares S&P 500 Growth | 성장주 |
| SCHX | Schwab US Large-Cap | 대형주 |
| QUAL | iShares MSCI USA Quality | 퀄리티 |
| XLV | Health Care Select | 헬스케어 섹터 |
| LQD | iShares Investment Grade Corp | 회사채 |
| MUB | iShares National Muni Bond | 지방채 |
| IWD | iShares Russell 1000 Value | 가치주 |
| VEU | Vanguard FTSE All-World ex-US | 해외 전체 |
| USMV | iShares MSCI USA Min Vol | 저변동 |
| SCHF | Schwab International Equity | 선진국 |
| JEPI | JPMorgan Equity Premium Income | 커버드콜 |
| VV | Vanguard Large-Cap | 대형주 |
| TLT | iShares 20+ Year Treasury | 장기 국채 |
| IAU | iShares Gold Trust | 금 |
| XLE | Energy Select | 에너지 섹터 |
| DIA | SPDR Dow Jones | 다우 30 |
| SHY | iShares 1-3 Year Treasury | 단기 국채 |
| MBB | iShares MBS | MBS |
| IWB | iShares Russell 1000 | 대형주 |
| JPST | JPMorgan Ultra-Short Income | 초단기 |
| VGT | Vanguard Information Technology | 기술 섹터 |
| SCHB | Schwab US Broad Market | 전체 시장 |
| IUSB | iShares Core Total USD Bond | 채권 |
| DGRO | iShares Core Dividend Growth | 배당 성장 |
| SDY | SPDR S&P Dividend | 배당 |
| MDY | SPDR S&P MidCap 400 | 중형주 |
| EEM | iShares MSCI Emerging | 신흥국 |
| XLY | Consumer Discretionary Select | 임의소비재 |
| IXUS | iShares Core MSCI Total Intl | 해외 전체 |
| VTEB | Vanguard Tax-Exempt Bond | 지방채 |
| BIL | SPDR 1-3 Month T-Bill | 초단기 국채 |
| HYG | iShares High Yield Corp | 하이일드 |
| GOVT | iShares US Treasury Bond | 국채 |
| VHT | Vanguard Health Care | 헬스케어 섹터 |
| XLI | Industrial Select | 산업재 섹터 |
| VNQ | Vanguard Real Estate | 리츠 |
| IEF | iShares 7-10 Year Treasury | 중기 국채 |
| SPLG | SPDR Portfolio S&P 500 | S&P 500 |
| SOXX | iShares Semiconductor | 반도체 |
| SMH | VanEck Semiconductor | 반도체 |
| DVY | iShares Select Dividend | 배당 |
| VGSH | Vanguard Short-Term Treasury | 단기 국채 |
| BSV | Vanguard Short-Term Bond | 단기 채권 |
| NOBL | ProShares S&P 500 Dividend Aristocrats | 배당 귀족 |
| SCHG | Schwab US Large-Cap Growth | 성장주 |
| SCHA | Schwab US Small-Cap | 소형주 |
| XLC | Communication Services Select | 통신 섹터 |
| SGOV | iShares 0-3 Month Treasury | 초단기 국채 |
| USHY | iShares Broad USD High Yield | 하이일드 |
| XLP | Consumer Staples Select | 필수소비재 |
| XLU | Utilities Select | 유틸리티 |
| KRE | SPDR S&P Regional Banking | 지방은행 |
| XBI | SPDR S&P Biotech | 바이오 |
| ARKK | ARK Innovation | 혁신 |
| JEPQ | JPMorgan Nasdaq Equity Premium | 커버드콜 |
| IBIT | iShares Bitcoin Trust | 비트코인 |
| FBTC | Fidelity Wise Origin Bitcoin | 비트코인 |
| COWZ | Pacer US Cash Cows 100 | 현금흐름 |
| TQQQ | ProShares UltraPro QQQ | 나스닥100 3x |
| SQQQ | ProShares UltraPro Short QQQ | 나스닥100 -3x |
| SOXL | Direxion Semiconductor Bull | 반도체 3x |
| SOXS | Direxion Semiconductor Bear | 반도체 -3x |
| UPRO | ProShares UltraPro S&P 500 | S&P500 3x |
| SSO | ProShares Ultra S&P 500 | S&P500 2x |
| QLD | ProShares Ultra QQQ | 나스닥100 2x |
| TNA | Direxion Small Cap Bull | 러셀2000 3x |
| NVDL | GraniteShares 2x Long NVDA | NVDA 2x |
| TSLL | Direxion Daily TSLA Bull | TSLA 2x |
