import { ArrowUpRight, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { UnderstandingLoader } from "@/components/ui/understanding-loader";
import { askInterviewQuestion } from "@/features/insights/api";
import type { InterviewAnswer } from "@/features/insights/types";

interface Exchange {
  question: string;
  answer: InterviewAnswer;
}

export function InterviewCoach({
  owner,
  name,
  path,
  onSelectFile,
}: {
  owner: string;
  name: string;
  path: string;
  onSelectFile: (path: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function ask(text: string): Promise<void> {
    if (loading || text.trim().length < 3) return;
    setLoading(true);
    setError(null);
    controller.current = new AbortController();
    try {
      const answer = await askInterviewQuestion(owner, name, path, text.trim(), controller.current.signal);
      setExchanges((previous) => [...previous, { question: text.trim(), answer }]);
      setQuestion("");
    } catch (cause) {
      if (!controller.current.signal.aborted)
        setError(cause instanceof Error ? cause.message : "Could not answer that question. Try again.");
    } finally {
      if (!controller.current.signal.aborted) setLoading(false);
    }
  }
  function submit(event: FormEvent): void {
    event.preventDefault();
    void ask(question);
  }
  const suggestions = exchanges.at(-1)?.answer.followUpQuestions ?? [
    "How should I explain this file in an interview?",
    "What design tradeoffs are visible here?",
    "What could fail, and how would I test it?",
  ];

  return (
    <section className="rounded-[1.5rem] border border-violet-200/70 bg-[#f1edf9] p-5 dark:border-violet-800 dark:bg-violet-950/25">
      <h3 className="flex items-center gap-2 font-semibold">
        <Sparkles className="size-4 text-violet-600 dark:text-violet-300" /> Your interview coach
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask about this file or its role in the project. Stay right here in the story.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading}
            onClick={() => void ask(suggestion)}
            className="rounded-full bg-white/80 px-3 py-2 text-left text-xs font-medium transition hover:bg-white disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/20"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="mt-4 flex max-h-[480px] flex-col gap-4 overflow-auto">
        {exchanges.map((exchange, index) => (
          <article key={index} className="rounded-2xl bg-white/80 p-4 dark:bg-white/5">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
              You asked · {exchange.question}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{exchange.answer.answer}</p>
            {exchange.answer.points.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {exchange.answer.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden="true">✦</span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
            {exchange.answer.evidence.length > 0 ? (
              <div className="mt-3 border-t pt-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Evidence from the code</p>
                {exchange.answer.evidence.map((evidence) => (
                  <button
                    key={evidence.path}
                    type="button"
                    onClick={() => onSelectFile(evidence.path)}
                    className="mb-2 flex w-full items-center justify-between gap-3 text-left text-xs"
                  >
                    <span>
                      <code className="font-semibold text-teal-700 dark:text-teal-300">{evidence.path}</code>
                      <span className="mt-1 block text-muted-foreground">{evidence.note}</span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0" />
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {loading ? (
        <div className="mt-4">
          <UnderstandingLoader compact label="Finding an answer in your project…" />
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form onSubmit={submit} className="mt-4 flex items-end gap-2 rounded-2xl bg-white p-2 dark:bg-black/20">
        <textarea
          aria-label="Ask your interview coach"
          placeholder="Why is this built this way?"
          maxLength={1200}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={2}
          className="min-w-0 flex-1 resize-none bg-transparent p-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading || question.trim().length < 3}
          aria-label="Ask question"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#303438] text-white disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </section>
  );
}
