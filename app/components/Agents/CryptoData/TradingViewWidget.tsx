import React, { useEffect, useRef, memo } from "react";

interface TradingViewWidgetProps {
  symbol: string;
}

const TradingViewWidget = memo(({ symbol }: TradingViewWidgetProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = container.current;
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    if (currentContainer) {
      currentContainer.appendChild(script);
    }

    return () => {
      if (currentContainer) {
        const scriptElement = currentContainer.querySelector("script");
        if (scriptElement) {
          currentContainer.removeChild(scriptElement);
        }
      }
    };
  }, [symbol]);

  return (
    <div style={{ height: "100%", width: "100%" }} ref={container}>
      <div className="tradingview-widget-copyright">
        <a
          href="https://www.tradingview.com/"
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="text-blue-500">
            Track all markets on TradingView
          </span>
        </a>
      </div>
    </div>
  );
});

TradingViewWidget.displayName = "TradingViewWidget";

export default TradingViewWidget;
