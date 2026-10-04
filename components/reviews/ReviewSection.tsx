"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/lib/i18n";
import { fetchReviews, flagReview } from "@/lib/review-client";
import type { ReviewItem, ReviewPage } from "@/lib/review-rules";
import { useMessages } from "@/lib/use-messages";
import { ReviewForm } from "./ReviewForm";

/** 결과 화면의 "이 자격증 후기 남기기" 버튼이 이 id 로 온다 */
export const REVIEWS_ANCHOR = "reviews";

/**
 * 자격증 페이지 맨 아래의 이용자 후기란.
 * 이용자가 직접 쓴 후기만 보여 준다 (운영진 학습 팁은 바로 위의 별도 상자).
 * 페이지는 빌드 때 만든 정적 HTML 이라 후기는 화면이 열린 뒤 서버에서 받아 그린다.
 * 별점 구조화 데이터(Review·AggregateRating)는 넣지 않는다.
 */
export function ReviewSection({ certId, certName }: { certId: string; certName: string }) {
  const { locale, m: all } = useMessages();
  const m = all.reviews;
  const [page, setPage] = useState<ReviewPage | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchReviews(certId).then((first) => {
      if (!alive) return;
      if (!first) return setFailed(true);
      setPage(first);
      setItems(first.reviews);
    });
    return () => {
      alive = false;
    };
  }, [certId]);

  const loadMore = async () => {
    setBusy(true);
    const next = await fetchReviews(certId, items[items.length - 1]?.createdAt);
    setBusy(false);
    if (!next) return setFailed(true);
    setPage(next);
    setItems((current) => [...current, ...next.reviews.filter((r) => !current.some((c) => c.id === r.id))]);
  };

  /** 새 후기를 맨 위에 넣고, 후기 수·평균은 서버에서 다시 받는다 */
  const onSaved = async (review: ReviewItem) => {
    setWriting(false);
    setSaved(true);
    setItems((current) => [review, ...current]);
    const fresh = await fetchReviews(certId);
    if (fresh) setPage((current) => (current ? { ...fresh, hasMore: current.hasMore } : fresh));
  };

  const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" });

  return (
    <section id={REVIEWS_ANCHOR} aria-labelledby="reviews-title" className="scroll-mt-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reviews-title" className="text-xl font-bold">
          {fmt(m.title, { name: certName })}
        </h2>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-sm font-bold text-ink-sub">{m.byUsers}</span>
      </div>

      {page && (page.weekSolves !== null || page.total > 0) && (
        <p className="font-bold">
          {page.average !== null && (
            <span className="mr-4">
              <span className="text-accent">★</span> {fmt(m.average, { avg: page.average.toFixed(1) })}
            </span>
          )}
          {page.total > 0 && <span className="mr-4">{fmt(m.count, { n: page.total })}</span>}
          {page.weekSolves !== null && <span>{fmt(m.activity, { n: page.weekSolves })}</span>}
        </p>
      )}

      {!page && !failed && <p className="card p-4 text-ink-sub">{m.loading}</p>}
      {failed && (
        <p role="alert" className="card p-4 font-bold">
          {m.loadFailed}
        </p>
      )}
      {page && items.length === 0 && <p className="card p-4">{m.empty}</p>}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((review) => (
            <ReviewCard key={review.id} review={review} date={date.format(review.createdAt)} />
          ))}
        </ul>
      )}

      {page?.hasMore && (
        <button type="button" disabled={busy} className="btn w-full" onClick={() => void loadMore()}>
          {m.more}
        </button>
      )}

      {saved && (
        <p role="status" className="rounded-lg bg-ok-soft p-4 font-bold">
          {m.saved}
        </p>
      )}

      {page &&
        (writing ? (
          <ReviewForm certId={certId} onSaved={onSaved} onClose={() => setWriting(false)} />
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-lg w-full"
            onClick={() => {
              setSaved(false);
              setWriting(true);
            }}
          >
            {m.write}
          </button>
        ))}
    </section>
  );
}

function ReviewCard({ review, date }: { review: ReviewItem; date: string }) {
  const m = useMessages().m.reviews;
  const [flag, setFlag] = useState<"idle" | "busy" | "done" | "failed">("idle");

  const report = async () => {
    setFlag("busy");
    setFlag((await flagReview(review.id)) ? "done" : "failed");
  };

  return (
    <li className="card space-y-2 p-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-bold">
        <span
          role="img"
          aria-label={fmt(m.starsLabel, { n: review.rating })}
          className="whitespace-nowrap tracking-tight text-accent"
        >
          {"★".repeat(review.rating)}
          {"☆".repeat(5 - review.rating)}
        </span>
        <span className="rounded-full bg-surface-2 px-2">{m.statuses[review.status]}</span>
        <span>{review.nickname}</span>
        <span className="text-ink-sub">{date}</span>
      </p>
      <p className="break-words">{review.body}</p>
      <p className="text-right text-sm">
        {flag === "done" ? (
          <span role="status" className="font-bold text-ink-sub">
            {m.flagged}
          </span>
        ) : (
          <button
            type="button"
            disabled={flag === "busy"}
            className="min-h-10 px-2 font-bold text-ink-sub underline underline-offset-2"
            onClick={() => void report()}
          >
            {flag === "failed" ? m.flagFailed : m.flag}
          </button>
        )}
      </p>
    </li>
  );
}
