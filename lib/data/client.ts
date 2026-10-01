"use client";

import { useEffect, useState } from "react";
import type { PoolItem, Question } from "../types";
import { publicDataUrl, publicPoolPath, publicQuestionsPath } from "./paths";

/**
 * 브라우저에서 문제 불러오기.
 *
 * 문제는 페이지에 실어 보내지 않고 정적 파일(/data/…)로 배포한다.
 *   1) 문제 목록(pool.json): 뽑기에 필요한 값만 담은 가벼운 파일
 *   2) 단원별 문제 파일: 실제로 보여 줄 문제가 들어 있는 단원 것만 받는다
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
  const wanted = new Set(ids);
  const pool = await fetchPool(certId);
  const stems = Array.from(new Set(pool.filter((p) => wanted.has(p.id)).map((p) => p.file)));
  const files = await Promise.all(
    stems.map((stem) => fetchJson<Question[]>(publicQuestionsPath(certId, stem))),
  );
  const byId = new Map(files.flat().map((q) => [q.id, q]));
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
