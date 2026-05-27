export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const { tipo, symbols, ids } = req.query;
  const resultado = {};

  try {
    if (tipo === 'cripto') {
      // Busca câmbio USD/BRL
      let usdBrl = 5.85;
      try {
        const fx = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        const fxd = await fx.json();
        usdBrl = parseFloat(fxd.USDBRL.bid) || 5.85;
      } catch(e) {}

      // Busca preços na Binance
      const symbolList = symbols ? symbols.split(',') : [];
      await Promise.all(symbolList.map(async sym => {
        const nome = sym.replace('USDT','');
        try {
          const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`);
          if (r.ok) {
            const d = await r.json();
            const precoUsd = parseFloat(d.lastPrice);
            const change = parseFloat(d.priceChangePercent);
            if (precoUsd > 0) {
              resultado[nome] = { p: parseFloat((precoUsd * usdBrl).toFixed(4)), c: parseFloat(change.toFixed(2)) };
            }
          }
        } catch(e) {}
      }));

      // Tenta CoinGecko pra IDs que a Binance não tem
      if (ids) {
        try {
          const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl&include_24hr_change=true`);
          if (r.ok) {
            const d = await r.json();
            Object.entries(d).forEach(([id, val]) => {
              if (val.brl) {
                // mapeia id -> nome
                const nomeMap = {
                  'hyperliquid':'HYPE','arbitrum':'ARB','optimism':'OP',
                  'hedera-hashgraph':'HBAR','gala':'GALA','bitcoin':'BTC',
                  'ethereum':'ETH','solana':'SOL','binancecoin':'BNB'
                };
                const nome = nomeMap[id] || id.toUpperCase();
                if (!resultado[nome]) {
                  resultado[nome] = { p: val.brl, c: parseFloat((val.brl_24h_change||0).toFixed(2)) };
                }
              }
            });
          }
        } catch(e) {}
      }

    } else if (tipo === 'rv') {
      // Busca cotações B3 via Brapi
      const syms = symbols ? symbols.split(',') : [];
      try {
        const r = await fetch(`https://brapi.dev/api/quote/${syms.join(',')}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (r.ok) {
          const d = await r.json();
          (d.results || []).forEach(q => {
            if (q.regularMarketPrice) {
              resultado[q.symbol] = {
                p: parseFloat(q.regularMarketPrice.toFixed(2)),
                c: parseFloat((q.regularMarketChangePercent||0).toFixed(2))
              };
            }
          });
        }
      } catch(e) {}
    }

    res.status(200).json({ ok: true, data: resultado, ts: Date.now() });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message, data: {} });
  }
}
