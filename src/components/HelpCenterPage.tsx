import React from "react";
import { BookOpen, Mail, MessageCircle, Search } from "lucide-react";

export function HelpCenterPage({
  helpSearch,
  setHelpSearch,
}: {
  helpSearch: string;
  setHelpSearch: React.Dispatch<React.SetStateAction<string>>;
}) {
  const helpFaqs = [
    {
      question: "What is SellSmart?",
      answer:
        "SellSmart is an AI-powered risk intelligence platform that helps retail investors understand when a position may need attention.",
    },
    {
      question: "Is SellSmart financial advice?",
      answer:
        "No. SellSmart provides model-based risk signals for decision support only. It is not financial advice.",
    },
    {
      question: "What does the risk score mean?",
      answer:
        "The risk score estimates short-term downside risk. Higher scores mean the position may require closer review.",
    },
    {
      question: "What do Hold, Watch, Reduce, and Exit mean?",
      answer:
        "These are risk-oriented action labels based on the current model signal. They help summarize the suggested level of caution.",
    },
    {
      question: "Why can predictions change?",
      answer:
        "Signals may change when new market data, volatility, price movement, or news sentiment becomes available.",
    },
  ];

  const filteredHelpFaqs = helpFaqs.filter((faq) =>
    `${faq.question} ${faq.answer}`
      .toLowerCase()
      .includes(helpSearch.toLowerCase())
  );

  return (
    <section className="help-page">
      <div className="help-hero">
        <div>
          <p className="eyebrow">Support</p>
          <h2>How can we help?</h2>
          <p>
            Find answers about portfolio risk, alerts, insights, reports, and
            SellSmart’s AI risk scoring.
          </p>
        </div>

        <div className="help-search">
          <Search size={18} />
          <input
            value={helpSearch}
            onChange={(event) => setHelpSearch(event.target.value)}
            placeholder="Search help topics..."
          />
        </div>
      </div>

      <div className="help-grid">
        <article className="help-card">
          <BookOpen size={22} />
          <h3>Getting started</h3>
          <p>
            Add positions to your portfolio, review risk scores, and check
            insights for each ticker.
          </p>
        </article>

        <article className="help-card">
          <MessageCircle size={22} />
          <h3>Understanding signals</h3>
          <p>
            Risk scores combine market behavior, volatility, trend, and news
            sentiment where available.
          </p>
        </article>

        <article className="help-card">
          <Mail size={22} />
          <h3>Contact support</h3>
          <p>
            For feedback, bugs, or pilot access questions, contact the SellSmart
            team directly.
          </p>
          <a href="mailto:sellsmart.asia@gmail.com">sellsmart.asia@gmail.com</a>
        </article>
      </div>

      <div className="faq-panel">
        <div className="section-heading">
          <h2>Frequently asked questions</h2>
          <p>Quick answers to common SellSmart questions.</p>
        </div>

        <div className="faq-list">
          {filteredHelpFaqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
