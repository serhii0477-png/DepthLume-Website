export const marketInputs = [
  { label: 'Order Flow', detail: 'Executed buying and selling pressure' },
  { label: 'Delta + CVD', detail: 'Aggressive flow across time' },
  { label: 'Open Interest', detail: 'Participation and positioning shifts' },
  { label: 'Funding', detail: 'Perpetual market imbalance' },
  { label: 'Liquidations', detail: 'Forced activity and stress events' },
  { label: 'Market Regime', detail: 'Context for changing conditions' },
  { label: 'Whale Activity', detail: 'Unusual size and behavior patterns' },
] as const;

export const features = [
  { icon: 'flow', title: 'Order Flow', text: 'Study executed market activity beyond price alone.' },
  { icon: 'ladder', title: 'DOM and Trade Tape', text: 'Inspect resting liquidity and the sequence of public trades.' },
  { icon: 'delta', title: 'Delta and CVD', text: 'Track aggressive participation and cumulative imbalance.' },
  { icon: 'pulse', title: 'Open Interest and Funding', text: 'Add derivatives positioning and perpetual-market pressure.' },
  { icon: 'whale', title: 'Whale Activity', text: 'Surface unusually large public-market behavior for review.' },
  { icon: 'ice', title: 'Iceberg and Absorption', text: 'Investigate iceberg-like behavior and defended price areas.' },
  { icon: 'context', title: 'Market Context', text: 'Bring evidence, conflicts, risks and quality into one view.' },
  { icon: 'history', title: 'Historical Bootstrap', text: 'Initialize research context from available historical data.' },
  { icon: 'scenario', title: 'Scenario Outcome Lab', text: 'Observe scenario lifecycles and review outcomes carefully.' },
  { icon: 'record', title: 'Dataset Recorder', text: 'Capture structured datasets for later analysis and research.' },
  { icon: 'journal', title: 'Signal Journal', text: 'Review context records without presenting them as trade advice.' },
  { icon: 'diagnostic', title: 'Diagnostics and Replay', text: 'Inspect data health and reproduce recorded behavior deterministically.' },
] as const;

export const faqs = [
  { q: 'Does DepthLume execute trades?', a: 'No. DepthLume is a market analytics and research application. It does not place or manage trades.' },
  { q: 'Does it require Binance API keys?', a: 'No trading-account connection is required. DepthLume is designed to analyze public market data; exact supported data sources will be confirmed for beta.' },
  { q: 'Is it a trading signal service?', a: 'No. DepthLume provides explainable market context for research. SETUP, WAIT, LONG or SHORT context labels are not instructions or guarantees.' },
  { q: 'Which markets are supported?', a: 'The initial focus is cryptocurrency futures markets. The confirmed exchange and symbol list will be published before beta access expands.' },
  { q: 'Which operating systems are supported?', a: 'DepthLume is a Windows desktop application. Other operating systems are not announced for this iteration.' },
  { q: 'Does it require Python?', a: 'Distributed Windows builds are intended not to require a separate Python installation.' },
  { q: 'Is historical data included?', a: 'Historical Bootstrap is part of the product scope. Availability, depth and source coverage will be documented before release.' },
  { q: 'What does Scenario Outcome Lab do?', a: 'It records scenario lifecycles, reviews outcomes and false positives, and supports comparison across market regimes using observed data.' },
  { q: 'Does DepthLume guarantee profitability?', a: 'No. Markets involve substantial risk. Analytics can be incomplete or wrong and cannot guarantee any result.' },
  { q: 'How will updates be delivered?', a: 'The update process will be confirmed before public release. No delivery channel is promised in this prototype.' },
] as const;

export const workflow = [
  ['01', 'Install DepthLume', 'Use the distributed Windows desktop build when beta access is available.'],
  ['02', 'Select a supported market', 'Choose from the markets and data sources confirmed for your build.'],
  ['03', 'Receive public market data', 'DepthLume organizes public real-time data locally for analysis.'],
  ['04', 'Evaluate the context', 'Review evidence, conflicts, risks, invalidation and data quality together.'],
  ['05', 'Make your own decision', 'Use the analysis as research input—not as financial advice or an instruction.'],
] as const;
