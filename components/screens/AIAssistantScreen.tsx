"use client";

import { useState, useEffect, useRef } from "react";
import type { Navigate, Product, AIAssistantMessage, AuthUser } from "@/types";
import { YarnBall, CrochetFlower } from "../YarnDecor";

interface Props {
  navigate: Navigate;
  user: AuthUser | null;
  onRequireLogin: () => void;
}

const QUICK_PROMPTS = [
  "I need a cute birthday gift under â‚¹300",
  "Show me scrunchies in sage green",
  "What keychains do you have?",
  "I want a custom flower keychain",
  "Best sellers under â‚¹200",
  "Phone charms for graduation gift",
];

export default function AIAssistantPage({ navigate, user, onRequireLogin }: Props) {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! ðŸ‘‹ I'm your Campus Crochet shopping assistant. I can help you find the perfect handmade piece, check prices, or even submit a custom request. What are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage: AIAssistantMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowQuickPrompts(false);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          user_id: user?.id,
          conversation_history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: AIAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        suggestions: data.suggestions,
        needsFollowUp: data.needsFollowUp,
        followUpQuestion: data.followUpQuestion,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Assistant error:", error);
      const errorMessage: AIAssistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! ðŸ§¶",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function applyQuickPrompt(prompt: string) {
    setInput(prompt);
    sendMessage();
  }

  function handleAddToCart(product: Product, color: string) {
    navigate("cart");
    // The cart page will handle adding via the global addToCart
    // We'll need to trigger a custom event or use a global state
    window.dispatchEvent(
      new CustomEvent("ai-add-to-cart", {
        detail: { productId: product.id, color, quantity: 1 },
      })
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FFFDF8", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #EDD4D4", backgroundColor: "#FFFDF8", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate("home")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", cursor: "pointer" }}>
            <YarnBall size={24} color="#C97B63" />
            <span style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#2E1D15", fontSize: "1.1rem", fontWeight: 700 }}>Campus Crochet</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#7A6058" }}>AI Assistant</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#A8B8A0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "#FFFDF8" }}>âœ¨</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 800, margin: "0 auto", width: "100%", padding: "1.5rem" }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "1rem" }}>
          {/* Welcome / Quick Prompts */}
          {showQuickPrompts && messages.length === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", paddingTop: "2rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>ðŸ§¶</div>
                <h2 style={{ fontFamily: "Playfair Display, Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#2E1D15", marginBottom: "0.5rem" }}>How can I help?</h2>
                <p style={{ color: "#7A6058", fontSize: "0.95rem", maxWidth: 400 }}>Ask me about products, prices, colors, or tell me what you need â€” I'll find the best match from our handmade collection.</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", maxWidth: 600 }}>
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => applyQuickPrompt(prompt)}
                    style={{ backgroundColor: "#F7F3EC", color: "#5A4238", padding: "0.6rem 1rem", borderRadius: 50, border: "1.5px solid #EDD4D4", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500, transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C97B63"; e.currentTarget.style.backgroundColor = "#FDF0EC"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#EDD4D4"; e.currentTarget.style.backgroundColor = "#F7F3EC"; }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", maxWidth: "85%", alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", backgroundColor: msg.role === "user" ? "#C97B63" : "#F7F3EC", color: msg.role === "user" ? "#FFFDF8" : "#C97B63" }}>
                {msg.role === "user" ? <span style={{ fontSize: "0.7rem" }}>ðŸ‘¤</span> : <CrochetFlower size={18} color="#C97B63" />}
              </div>
              <div style={{ backgroundColor: msg.role === "user" ? "#C97B63" : "#F7F3EC", color: msg.role === "user" ? "#FFFDF8" : "#2E1D15", padding: "0.85rem 1rem", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", border: msg.role === "user" ? "none" : "1px solid #EDD4D4", boxShadow: "0 2px 8px rgba(46,29,21,0.08)" }}>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                
                {/* Product Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {msg.suggestions.map((product, i) => (
                      <button
                        key={product.id}
                        onClick={() => navigate("product", { id: product.id })}
                        style={{ display: "flex", gap: "0.75rem", padding: "0.5rem", backgroundColor: msg.role === "user" ? "rgba(255,253,248,0.15)" : "#FFFDF8", borderRadius: 12, border: "1px solid", borderColor: msg.role === "user" ? "rgba(255,253,248,0.2)" : "#EDD4D4", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                      >
                        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, backgroundColor: "#EDD4D4" }}>
                          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: "0.85rem", color: msg.role === "user" ? "#FFFDF8" : "#2E1D15", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</p>
                          <p style={{ fontSize: "0.75rem", color: msg.role === "user" ? "rgba(255,253,248,0.7)" : "#7A6058", marginTop: 2 }}>{product.category} â€¢ {product.colors.slice(0, 2).join(", ")}{product.colors.length > 2 ? "..." : ""}</p>
                          <p style={{ fontWeight: 700, fontSize: "0.85rem", color: msg.role === "user" ? "#FFFDF8" : "#C97B63", marginTop: 4 }}>â‚¹{product.price}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product, product.colors[0]); }}
                          style={{ flexShrink: 0, padding: "0.35rem 0.75rem", borderRadius: 50, fontSize: "0.7rem", fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: msg.role === "user" ? "#FFFDF8" : "#C97B63", color: msg.role === "user" ? "#C97B63" : "#FFFDF8" }}
                        >
                          Add
                        </button>
                      </button>
                    ))}
                  </div>
                )}

                {/* Follow-up prompt */}
                {msg.needsFollowUp && msg.followUpQuestion && (
                  <button
                    onClick={() => { setInput(msg.followUpQuestion!); sendMessage(); }}
                    style={{ marginTop: "0.75rem", padding: "0.5rem 0.85rem", backgroundColor: "transparent", border: "1.5px dashed", borderColor: msg.role === "user" ? "rgba(255,253,248,0.4)" : "#C97B63", borderRadius: 50, color: msg.role === "user" ? "#FFFDF8" : "#C97B63", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <span>âœ¨</span> {msg.followUpQuestion}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", backgroundColor: "#F7F3EC", color: "#C97B63" }}>
                <CrochetFlower size={18} color="#C97B63" />
              </div>
              <div style={{ backgroundColor: "#F7F3EC", padding: "0.85rem 1rem", borderRadius: "18px 18px 18px 4px", border: "1px solid #EDD4D4" }}>
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C97B63", animation: "bounce 1.4s infinite ease-in-out" }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C97B63", animation: "bounce 1.4s infinite ease-in-out 0.2s" }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C97B63", animation: "bounce 1.4s infinite ease-in-out 0.4s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ borderTop: "1px solid #EDD4D4", paddingTop: "1rem" }}>
          {!user && (
            <div style={{ backgroundColor: "#FDF5EC", borderRadius: 12, padding: "0.75rem 1rem", border: "1px solid #EDD4D4", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#7A6058", fontSize: "0.82rem" }}>Sign in to save your conversation and track custom requests</span>
              <button onClick={onRequireLogin} style={{ color: "#C97B63", fontWeight: 600, fontSize: "0.82rem", background: "none", border: "none", cursor: "pointer" }}>Sign in â†’</button>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... e.g., 'Birthday gift under â‚¹300' or 'Show me sage green scrunchies'"
                rows={1}
                style={{
                  width: "100%",
                  padding: "0.75rem 3rem 0.75rem 1rem",
                  borderRadius: 50,
                  border: "1.5px solid #EDD4D4",
                  backgroundColor: "#FFFDF8",
                  color: "#2E1D15",
                  fontSize: "0.9rem",
                  outline: "none",
                  fontFamily: "DM Sans, system-ui, sans-serif",
                  resize: "none",
                  minHeight: 48,
                  maxHeight: 120,
                }}
                onFocus={(e) => { e.target.style.borderColor = "#C97B63"; }}
                onBlur={(e) => { e.target.style.borderColor = "#EDD4D4"; }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: input.trim() && !isLoading ? "#C97B63" : "#EDD4D4",
                color: input.trim() && !isLoading ? "#FFFDF8" : "#B88080",
                border: "none",
                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (input.trim() && !isLoading) e.currentTarget.style.backgroundColor = "#A86248"; }}
              onMouseLeave={(e) => { if (input.trim() && !isLoading) e.currentTarget.style.backgroundColor = "#C97B63"; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p style={{ textAlign: "center", color: "#B88080", fontSize: "0.7rem", marginTop: "0.75rem", fontFamily: "Caveat, cursive" }}>
            Only Aditya students, Surampalem ðŸŒ¸ Â· Powered by Campus Crochet AI
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </main>
  );
}