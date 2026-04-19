"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "pet";
  text: string;
};

type EquippedAccessory = {
  equipped_id: string;
  slot: string;
  accessory_owned: {
    accessory_id: string;
    accessory: {
      accessory_url: string;
      accessory_name: string;
    } | null;
  } | null;
};

type SlotRow = {
  slot_name: string;
  x: number;
  y: number;
};

export default function PetChatClient({
  petName,
  petType,
  moodName,
  petModel,
  equippedAccessories,
  slots,
}: {
  petName: string;
  petType: string;
  moodName: string;
  petModel: string;
  equippedAccessories: EquippedAccessory[];
  slots: SlotRow[];
}) {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "pet",
      text: `Hi, I'm ${petName} the ${petType}. I'm feeling ${moodName.toLowerCase()} today. What do you want to talk about?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setCooldownRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldownRemaining]);

  function buildHistory(nextUserMessage: Message) {
    return [...messages, nextUserMessage].slice(-8).map((message) => ({
      role: message.role === "pet" ? "assistant" : "user",
      content: message.text,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isSending || cooldownRemaining > 0) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmedInput,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);
    setCooldownRemaining(10);

    try {
      const history = buildHistory(userMessage);
      const response = await fetch("/api/pet-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedInput,
          history,
        }),
      });

      const responseText = await response.text();
      let payload:
        | { reply?: string; error?: string; retryAfterSeconds?: number | null }
        | null = null;

      try {
        payload = responseText
          ? ((JSON.parse(responseText) as {
              reply?: string;
              error?: string;
              retryAfterSeconds?: number | null;
            }) ?? null)
          : null;
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.reply) {
        if (
          typeof payload?.retryAfterSeconds === "number" &&
          payload.retryAfterSeconds > 0
        ) {
          setCooldownRemaining(payload.retryAfterSeconds);
        }

        throw new Error(
          payload?.error ||
            responseText ||
            `The pet could not reply right now. Request failed with status ${response.status}.`
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "pet",
          text: payload.reply,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The pet could not reply right now."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border-4 border-[#E4DCAB] bg-[#fef5ffbb] p-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="relative h-[220px] w-[220px] flex-shrink-0">
            <Image
              src={petModel}
              alt={petType}
              fill
              sizes="220px"
              className="object-contain"
              priority
            />
            {equippedAccessories.map((acc) => {
              const item = acc.accessory_owned?.accessory;
              if (!item) return null;

              const pos = slots.find((slot) => slot.slot_name === acc.slot);

              return (
                <Image
                  key={acc.equipped_id}
                  src={item.accessory_url}
                  alt={item.accessory_name}
                  width={305}
                  height={200}
                  className="absolute object-contain"
                  style={{
                    left: pos?.x ?? 0,
                    top: pos?.y ?? 0,
                  }}
                />
              );
            })}
          </div>

          <div>
            <h2 className="font-cherry text-4xl text-[#2E2805]">{petName}</h2>
            <p className="font-delius text-lg text-[#2E2805]">
              {petType} | feeling {moodName}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border-4 border-[#E4DCAB] bg-white/90 p-6">
        <div
          ref={messagesContainerRef}
          className="grid max-h-[420px] gap-4 overflow-y-auto pr-2"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-3xl px-4 py-3 font-delius text-[#2E2805] ${
                message.role === "user"
                  ? "ml-auto bg-[#ADD3EA]"
                  : "bg-[#FBF5D1]"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 font-delius text-sm text-[#9f2f2f]">{error}</p>
        )}

        {cooldownRemaining > 0 && (
          <p className="mt-2 font-delius text-sm text-[#6B5622]">
            You can send another message in {cooldownRemaining}s.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Say something to ${petName}`}
            className="min-w-0 flex-1 rounded-2xl border-2 border-[#E4DCAB] px-4 py-3 font-delius text-[#2E2805] outline-none"
            disabled={isSending || cooldownRemaining > 0}
          />
          <button
            type="submit"
            disabled={isSending || cooldownRemaining > 0 || !input.trim()}
            className="rounded-2xl bg-[#C17F9E] px-6 py-3 font-delius text-white disabled:opacity-50"
          >
            {isSending
              ? "Waiting..."
              : cooldownRemaining > 0
              ? `Wait ${cooldownRemaining}s`
              : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}
