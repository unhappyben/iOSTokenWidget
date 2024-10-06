# Altcoin Price Widget
Taking inspiration from the Stock iOS widget and using publicly available RPCs and DefiLlama API to return price, 24 hour trend, 24 hour change, and wallet token amount. 

## Features
- Track token prices and price changes over past 24 hours 
- Optionally display personal wallet balances 
- Dynamic chart generation showing price trends
- Currently Supports :
  - Ethereum
  - Arbitrum
  - BSC
  - Polygon
  - Optimism
  - Avalanche
  - Base
  - Mode

## Requirements
1. Download Scriptable from the iOS App Store

## Installation
1. Download Scriptable - https://scriptable.app/
2. Open Scriptable and create a new script.
3. Copy and paste  `token-tracker-widget.js` file into your new Scriptable script.
4. Customize the user configuration section at the top of the script:
   - Set `tokenAddress` to the address of the token you want to track.
   - Set `chain` to the blockchain you're using (e.g., "arbitrum", "ethereum", "bsc").
   - Set `walletAddress` to your wallet address (or leave it as an empty string if you don't want to track balance).

## Usage
1. Run the script in Scriptable to test it.
2. Add a new Scriptable widget to your home screen.
3. Choose the Token Tracker script for the widget.
4. The widget will update periodically with the latest token price and your balance (if configured).

## Sample Output
![IMG_2740](https://github.com/user-attachments/assets/7a6374cf-7d47-43a4-b99e-b609c3009297)
![IMG_2741](https://github.com/user-attachments/assets/d39193b7-eac1-4849-b889-ec9077b07026)

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
