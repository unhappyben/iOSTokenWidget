// Chain to RPC Mappings
const chainRPCMappings = {
  "arbitrum": "https://arb1.arbitrum.io/rpc",
  "ethereum": "https://ethereum.publicnode.com",
  "polygon": "https://polygon-rpc.com",
  "optimism": "https://mainnet.optimism.io",
  "avalanche": "https://api.avax.network/ext/bc/C/rpc",
  "bsc": "https://bsc-dataseed.binance.org",
  "base": "https://mainnet.base.org",
  "mode": "https://mainnet.mode.network"
};

// User Configuration - Modify these values
const tokenAddress = "0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83"; // The address of the token you want to track 
const chain = "ethereum"; // Ethereum, Arbitrum, BSC, Polygon, Optimism, Avalanche, Base, Mode - not case sensitive
const walletAddress = ""; // Your wallet address (leave as empty string if not tracking balance)

// Constants
const fm = FileManager.local();
const cachePath = fm.joinPath(fm.documentsDirectory(), "tokenData.json");

// Device scale factor
const deviceScale = Device.screenScale();

// Main function
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#000000");
  widget.setPadding(16, 16, 16, 16);

  try {
    const data = await fetchTokenData();
    
    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    
    addTopRow(mainStack, data);
    mainStack.addSpacer(8);
    await addChart(mainStack, data);
    mainStack.addSpacer(8);
    addFooter(mainStack, data);
    
  } catch (error) {
    const errorText = widget.addText(`Error: ${error.message}`);
    errorText.font = Font.systemFont(12);
    errorText.textColor = Color.red();
  }

  return widget;
}

function addTopRow(stack, data) {
  const topRow = stack.addStack();
  topRow.layoutHorizontally();
  
  addLeftColumn(topRow, data);
  topRow.addSpacer();
  addRightColumn(topRow, data);
}

function addLeftColumn(stack, data) {
  const leftColumn = stack.addStack();
  leftColumn.layoutVertically();
  
  const symbolText = leftColumn.addText(data.symbol.toUpperCase());
  symbolText.font = Font.boldSystemFont(24);
  symbolText.textColor = Color.white();
  
  if (walletAddress) {
    const balanceText = leftColumn.addText(`${data.balance.toFixed(4)} tokens`);
    balanceText.font = Font.systemFont(12);
    balanceText.textColor = new Color("#888888");
    
    const valueText = leftColumn.addText(`$${data.totalValue.toFixed(2)}`);
    valueText.font = Font.systemFont(12);
    valueText.textColor = new Color("#888888");
  }
}

function addRightColumn(stack, data) {
  const rightColumn = stack.addStack();
  rightColumn.layoutVertically();
  
  const priceText = rightColumn.addText(`$${data.currentPrice.toFixed(2)}`);
  priceText.font = Font.boldSystemFont(24);
  priceText.textColor = Color.white();
  priceText.rightAlignText();
  
  const changeColor = data.priceChange >= 0 ? new Color("#4CAF50") : new Color("#f44336");
  const changeText = rightColumn.addText(`${data.priceChange >= 0 ? '+' : ''}$${Math.abs(data.priceChange).toFixed(2)} (${data.percentChange.toFixed(2)}%)`);
  changeText.font = Font.systemFont(12);
  changeText.textColor = changeColor;
  changeText.rightAlignText();
}

async function addChart(stack, data) {
  const changeColor = data.priceChange >= 0 ? new Color("#4CAF50") : new Color("#f44336");
  const chartImage = await createChartImage(data.priceHistory, changeColor);
  const chartImageElement = stack.addImage(chartImage);
  chartImageElement.imageSize = new Size(300, 50);
}

function addFooter(stack, data) {
  const lastTimestamp = data.priceHistory[data.priceHistory.length - 1].timestamp;
  const lastUpdatedDate = new Date(lastTimestamp * 1000);
  const lastUpdatedLocal = lastUpdatedDate.toLocaleString();
  
  const footerText = stack.addText(`Last updated: ${lastUpdatedLocal} UTC`);
  footerText.font = Font.systemFont(10);
  footerText.textColor = new Color("#888888");
  footerText.centerAlignText();
}

async function fetchTokenData() {
  const now = Date.now();
  const timePoints = Array.from({length: 7}, (_, i) => Math.floor(now / 1000) - i * 4 * 3600);
  
  const url = `https://coins.llama.fi/batchHistorical?coins=${encodeURIComponent(JSON.stringify({
    [`${chain}:${tokenAddress}`]: timePoints
  }))}&searchWidth=4h`;

  const request = new Request(url);
  const response = await request.loadJSON();
  
  const tokenData = response.coins[`${chain}:${tokenAddress}`];
  
  if (!tokenData || !tokenData.prices || tokenData.prices.length === 0) {
    throw new Error("Failed to fetch token data");
  }

  let priceHistory = tokenData.prices;

  priceHistory.sort((a, b) => a.timestamp - b.timestamp);

  const currentPrice = priceHistory[priceHistory.length - 1].price;
  const earliestPrice = priceHistory[0].price;
  const priceChange = currentPrice - earliestPrice;
  const percentChange = (priceChange / earliestPrice) * 100;
  const lastUpdated = now;

  let balance = 0;
  let totalValue = 0;

  if (walletAddress) {
    balance = await fetchBalance();
    totalValue = balance * currentPrice;
  }

  const data = {
    symbol: tokenData.symbol,
    currentPrice,
    priceChange,
    percentChange,
    priceHistory,
    balance,
    totalValue,
    lastUpdated
  };

  fm.writeString(cachePath, JSON.stringify(data));

  return data;
}

async function fetchBalance() {
  if (!walletAddress) return 0;

  const rpcUrl = chainRPCMappings[chain];
  if (!rpcUrl) {
    throw new Error(`No RPC URL found for chain: ${chain}`);
  }

  const data = {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [
      {
        to: tokenAddress,
        data: `0x70a08231000000000000000000000000${walletAddress.slice(2)}`
      },
      "latest"
    ],
    id: 1
  };

  const request = new Request(rpcUrl);
  request.method = "POST";
  request.headers = {
    "Content-Type": "application/json"
  };
  request.body = JSON.stringify(data);

  const response = await request.loadJSON();

  if (response.error) {
    throw new Error(`RPC Error: ${response.error.message}`);
  }

  const balance = parseInt(response.result, 16) / 1e18; // Assuming 18 decimals, adjust if different
  return balance;
}

async function createChartImage(priceHistory, color) {
  const baseWidth = 300;
  const baseHeight = 50;
  const width = baseWidth * deviceScale;
  const height = baseHeight * deviceScale;
  
  const context = new DrawContext();
  context.size = new Size(width, height);
  context.opaque = false;
  context.respectScreenScale = true;
  
  const prices = priceHistory.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  const buffer = (max - min) * 0.1;
  const adjustedMin = min - buffer;
  const adjustedMax = max + buffer;
  
  const path = new Path();
  priceHistory.forEach((price, index) => {
    const x = (index / (priceHistory.length - 1)) * width;
    const y = height - ((price.price - adjustedMin) / (adjustedMax - adjustedMin)) * height;
    if (index === 0) {
      path.move(new Point(x, y));
    } else {
      path.addLine(new Point(x, y));
    }
  });
  
  context.addPath(path);
  context.setStrokeColor(color);
  context.setLineWidth(2 * deviceScale);
  context.strokePath();
  
  return context.getImage();
}

// Widget setup
(async () => {
  const widget = await createWidget();
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    widget.presentMedium();
  }
  Script.complete();
})();
