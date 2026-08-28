"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../ascent/types";
import { cannedAnswers, chatSuggestions } from "../ascent/data";

const FALLBACK_REPLY =
  "Here's what stands out related to that: your data shows the clearest signal around Tuesday consistency and the emergency-fund goal right now. In the full build, I'll pull this straight from your live sheet instead of a canned answer.";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `msg-${idCounter}`;
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      who: "ai",
      html:
        "Hey — I've read through your Week 34 sheet. Ask me about a specific goal, a weak day, or how something's trending over time, and I'll pull the numbers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  function lookupAnswer(userText: string): string {
    const key = userText.trim().toLowerCase().replace(/[?.!]+$/, "");
    const matchKey = Object.keys(cannedAnswers).find(
      (k) => key.includes(k.replace(/[?.!]+$/, "")) || k.includes(key)
    );
    return matchKey ? cannedAnswers[matchKey] : FALLBACK_REPLY;
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { id: nextId(), who: "user", html: escapeHtml(trimmed) }]);
    setInput("");
    setTyping(true);

    // Replace this timeout with a real API call, e.g.:
    // const reply = await fetch("/api/ascent-assistant", { method: "POST", body: JSON.stringify({ q: trimmed }) })
    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { id: nextId(), who: "ai", html: lookupAnswer(trimmed) }]);
    }, 900);
  }

  return (
    <div className="asc-chat-shell">
      <div className="asc-chat-intro">
        <h3>Ask about your data</h3>
        <p>I can dig into specific weeks, categories, or trends across your whole growth log.</p>
        <div className="asc-chat-chips">
          {chatSuggestions.map((prompt) => (
            <div key={prompt} className="asc-chat-chip" onClick={() => send(prompt)}>
              {prompt}
            </div>
          ))}
        </div>
      </div>

      <div className="asc-chat-messages" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className={`asc-msg ${m.who}`}>
            <div className="asc-msg-avatar">{m.who === "ai" ? "A" : "Y"}</div>
            <div className="asc-msg-bubble" dangerouslySetInnerHTML={{ __html: m.html }} />
          </div>
        ))}
        {typing && (
          <div className="asc-msg ai">
            <div className="asc-msg-avatar">A</div>
            <div className="asc-msg-bubble">
              <div className="asc-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="asc-chat-input-row">
        <input
          type="text"
          className="asc-chat-input"
          placeholder="Ask about a metric, week, or trend…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
        />
        <button className="asc-chat-send" onClick={() => send(input)}>
          Send
        </button>
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
