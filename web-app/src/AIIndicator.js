// --- Shared Helpers ---
const Helpers = {
    getSMA: (series, len, offset = 0) => {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < len; i++) {
            const val = series.get(i + offset);
            if (!isNaN(val)) { sum += val; count++; }
        }
        return count === len ? sum / len : NaN;
    },
    getMaxMin: (series, len, offset = 0) => {
        let maxVal = -Infinity;
        let minVal = Infinity;
        for (let i = 0; i < len; i++) {
            const val = series.get(i + offset);
            if (isNaN(val)) return { max: NaN, min: NaN };
            if (val > maxVal) maxVal = val;
            if (val < minVal) minVal = val;
        }
        return { max: maxVal, min: minVal };
    }
};

// --- RSI Indicator ---
export const AI_RSI_Indicator = {
    name: "CustomAI_RSI",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_RSI@tv-basicstudies-1",
        name: "CustomAI RSI",
        description: "CustomAI RSI",
        shortDescription: "AI RSI",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: {
            type: "price",
            precision: 2,
        },
        defaults: {
            min: 0,
            max: 100,
            styles: {
                plot_rsi_buy: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, trackPrice: false, transparency: 0, visible: true, color: "#00FF00", title: "RSI Buy" },
                plot_rsi_sell: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, trackPrice: false, transparency: 0, visible: true, color: "#FF0000", title: "RSI Sell" },
            },
            bands: [
                { color: "#888888", linestyle: 2, linewidth: 1, visible: true, value: 5 }, // Center approx
            ],
            inputs: {
                in_rsi_len: 14,
            }
        },
        plots: [
            { id: "plot_rsi_buy", type: "line" },
            { id: "plot_rsi_sell", type: "line" },
        ],
        styles: {
            plot_rsi_buy: { title: "RSI Buy", histogramBase: 0 },
            plot_rsi_sell: { title: "RSI Sell", histogramBase: 0 },
        },
        inputs: [
            { id: "in_rsi_len", name: "RSI Length", defval: 14, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;

            try {
                const rsiLen = this._input(0) || 14;
                const close = this._context.new_var(this._context.symbol.close);

                if (isNaN(close.get(rsiLen + 100))) {
                    return [NaN, NaN];
                }

                // Standard RMA RSI Calculation
                // Optimization: We could optimize with state, but keeping it simple for now. 
                // Removed all other unnecessary math which triggers the lag.

                const iterations = 100; // Lookback for stabilization
                const startIdx = iterations;

                // Calculate SMA seed at 'startIdx'
                let seedGain = 0;
                let seedLoss = 0;
                for (let i = 0; i < rsiLen; i++) {
                    const idx = startIdx + i;
                    const chg = close.get(idx) - close.get(idx + 1);
                    if (!isNaN(chg)) {
                        if (chg > 0) seedGain += chg;
                        else seedLoss += Math.abs(chg);
                    }
                }
                let avgGain = seedGain / rsiLen;
                let avgLoss = seedLoss / rsiLen;

                // Iterate forward to 0 (current)
                for (let i = startIdx - 1; i >= 0; i--) {
                    const chg = close.get(i) - close.get(i + 1);
                    if (isNaN(chg)) continue;

                    let currentGain = 0;
                    let currentLoss = 0;
                    if (chg > 0) currentGain = chg;
                    else currentLoss = Math.abs(chg);

                    avgGain = ((avgGain * (rsiLen - 1)) + currentGain) / rsiLen;
                    avgLoss = ((avgLoss * (rsiLen - 1)) + currentLoss) / rsiLen;
                }

                let rsiVal = 50;
                if (avgLoss === 0) {
                    rsiVal = avgGain === 0 ? 50 : 100;
                } else {
                    const rs = avgGain / avgLoss;
                    rsiVal = 100 - (100 / (1 + rs));
                }

                const isRsiBuy = rsiVal < 30;
                const isRsiSell = rsiVal > 70;

                // Return value 10 to keep the strip thin at bottom (0-10 range of 0-100)
                return [
                    isRsiBuy ? 10 : NaN,
                    isRsiSell ? 10 : NaN
                ];

            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- MFI Indicator ---
export const AI_MFI_Indicator = {
    name: "CustomAI_MFI",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_MFI@tv-basicstudies-1",
        name: "CustomAI MFI",
        description: "CustomAI MFI",
        shortDescription: "AI MFI",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: {
            type: "price",
            precision: 2,
        },
        defaults: {
            styles: {
                plot_mfi_line: {
                    linestyle: 0,
                    linewidth: 1,
                    plottype: 0,
                    trackPrice: false,
                    transparency: 0,
                    visible: true,
                    color: "#7E57C2",
                    title: "MFI"
                },
            },
            bands: [
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 20 },
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 80 },
            ],
            inputs: {
                in_mfi_len: 14,
            }
        },
        plots: [
            { id: "plot_mfi_line", type: "line" },
        ],
        styles: {
            plot_mfi_line: { title: "MFI", histogramBase: 0 },
        },
        inputs: [
            { id: "in_mfi_len", name: "MFI Length", defval: 14, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;

            try {
                // 1. Inputs
                let rawInput = this._input(0);
                const mfiLen = (Array.isArray(rawInput) ? rawInput[0] : parseInt(rawInput)) || 14;

                // 2. Data Access
                const close = this._context.new_var(this._context.symbol.close);
                const high = this._context.new_var(this._context.symbol.high);
                const low = this._context.new_var(this._context.symbol.low);
                const volume = this._context.new_var(this._context.symbol.volume);

                // 3. MFI Calculation - TradingView Standard Formula
                // Pine Script equivalent:
                // src = hlc3
                // upper = math.sum(volume * (change(src) <= 0 ? 0 : src), length)
                // lower = math.sum(volume * (change(src) >= 0 ? 0 : src), length)
                // mfi = 100 - 100 / (1 + upper / lower)

                let upper = 0;
                let lower = 0;
                let validBars = 0;

                for (let i = 0; i < mfiLen; i++) {
                    const h = high.get(i);
                    const l = low.get(i);
                    const c = close.get(i);
                    const v = volume.get(i);

                    const h_prev = high.get(i + 1);
                    const l_prev = low.get(i + 1);
                    const c_prev = close.get(i + 1);

                    // Skip if any data is invalid
                    if (isNaN(c) || isNaN(c_prev)) continue;

                    const hVal = isNaN(h) ? c : h;
                    const lVal = isNaN(l) ? c : l;
                    const vVal = isNaN(v) ? 0 : v;
                    const hPrevVal = isNaN(h_prev) ? c_prev : h_prev;
                    const lPrevVal = isNaN(l_prev) ? c_prev : l_prev;

                    const hlc3 = (hVal + lVal + c) / 3;
                    const hlc3_prev = (hPrevVal + lPrevVal + c_prev) / 3;
                    const change = hlc3 - hlc3_prev;

                    if (change > 0) {
                        upper += vVal * hlc3;
                    } else if (change < 0) {
                        lower += vVal * hlc3;
                    }
                    validBars++;
                }

                // Need at least some valid bars
                if (validBars < 2) {
                    return [NaN];
                }

                // 4. Calculate MFI
                let mfiVal = 50;
                if (lower === 0) {
                    mfiVal = upper === 0 ? 50 : 100;
                } else if (upper === 0) {
                    mfiVal = 0;
                } else {
                    const mfr = upper / lower;
                    mfiVal = 100 - (100 / (1 + mfr));
                }

                return [mfiVal];

            } catch (e) {
                return [NaN];
            }
        };
    }
};
