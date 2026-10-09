"use client";

import { useEffect, useState } from "react";
import { dailyDateKey, dailyEntryFor, type DailyEntry } from "../daily";
import type { Country, PoolItem, Question } from "../types";
import { publicDailyPath, publicDataUrl, publicPoolPath, publicQuestionsPath } from "./paths";

/**
 * 브라우저에서 문제 불러오기.
 *
 * 문제는 페이지에 실어 보내지 않고 정적 파일(/data/…)로 배포한다.
 *   1) 문제 목록(pool.json): 뽑기에 필요한 값만 담은 가벼운 파일
 *   2) 문제 파일(questions.json): 자격증의 문제 전체. 자격증마다 1개라 한 번 받으면 다른 단원도 다시 받지 않는다
 */

const requests = new Map<string, Promise<unknown>>();

/** 같은 파일은 한 번만 받는다. 실패하면 다음에 다시 시도할 수 있게 지운다 */
function fetchJson<T>(relative: string): Promise<T> {
  const url = publicDataUrl(relative);
  let request = requests.get(url);
  if (!request) {
    request = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url} ${r.status}`);
      return r.json() as Promise<unknown>;
    });
    request.catch(() => requests.delete(url));
    requests.set(url, request);
  }
  return request as Promise<T>;
}

/** 자격증의 문제 목록 (출제 중단 문제 포함) */
export function fetchPool(certId: string): Promise<PoolItem[]> {
  return fetchJson<PoolItem[]>(publicPoolPath(certId));
}

/** 문제 id 로 문제 내용을 가져온다 (ids 순서대로. 없는 문제는 뺀다) */
export async function fetchQuestions(certId: string, ids: readonly string[]): Promise<Question[]> {
  if (ids.length === 0) return [];
  const all = await fetchJson<Question[]>(publicQuestionsPath(certId));
  const byId = new Map(all.map((q) => [q.id, q]));
  return ids.map((id) => byId.get(id)).filter((q): q is Question => !!q);
}

/** key 가 바뀔 때마다 다시 불러온다. 불러오는 중이면 null */
function useLoaded<T>(key: string, load: () => Promise<T>): T | null {
  const [state, setState] = useState<{ key: string; value: T } | null>(null);
  useEffect(() => {
    let cancelled = false;
    load()
      .then((value) => {
        if (!cancelled) setState({ key, value });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // load 는 key 로 정해진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state?.key === key ? state.value : null;
}

/** 지금 출제되는 문제 목록 (불러오는 중이면 null) */
export function useQuestionPool(certId: string): PoolItem[] | null {
  const pool = useLoaded(`pool:${certId}`, () => fetchPool(certId));
  return pool ? pool.filter((p) => !p.retired) : null;
}

const NO_QUESTIONS: Question[] = [];

/** 문제 id 목록의 문제 내용 (불러오는 중이면 null) */
export function useQuestions(certId: string, ids: readonly string[]): Question[] | null {
  const loaded = useLoaded(`questions:${certId}:${ids.join(",")}`, () => fetchQuestions(certId, ids));
  return ids.length === 0 ? NO_QUESTIONS : loaded;
}

/** 홈 "오늘의 1문제": 그 나라 오늘 날짜의 문제 (불러오는 중이면 null, 없으면 "none") */
export interface DailyQuestion {
  entry: DailyEntry;
  question: Question;
  /** 그 나라 날짜 YYYY-MM-DD */
  date: string;
}

async function fetchDailyQuestion(country: Country): Promise<DailyQuestion | "none"> {
  const date = dailyDateKey(country);
  const schedule = await fetchJson<DailyEntry[]>(publicDailyPath(country)).catch(() => []);
  const entry = dailyEntryFor(schedule, date);
  if (!entry) return "none";
  const file = await fetchJson<Question[]>(publicQuestionsPath(entry.certId)).catch(() => []);
  const question = file.find((q) => q.id === entry.id);
  return question ? { entry, question, date } : "none";
}

export function useDailyQuestion(country: Country): DailyQuestion | "none" | null {
  return useLoaded(`daily:${country}`, () => fetchDailyQuestion(country));
}
