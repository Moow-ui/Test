"use client";

import { useState } from "react";
import { addOwnedCert, removeOwnedCert, type OwnedCert } from "@/lib/storage";
import type { ProfileCert } from "./ProfileView";

/**
 * 등급별 칭호 모양. 등급이 높을수록 별이 많고 색이 달라진다.
 * (동 → 은 → 금 → 보라 → 진홍, 직접 적은 자격증은 파랑)
 */
const TIERS: Record<string, { stars: string; style: string }> = {
  기능사: { stars: "★", style: "border-[#b45309] bg-[linear-gradient(135deg,#fde4c8,#d9955a)] text-[#3b1d06]" },
  산업기사: { stars: "★★", style: "border-[#64748b] bg-[linear-gradient(135deg,#ffffff,#b6c2d1)] text-[#0f172a]" },
  기사: { stars: "★★★", style: "border-[#b45309] bg-[linear-gradient(135deg,#fef3c7,#f5b301)] text-[#3b2a00]" },
  기능장: { stars: "★★★★", style: "border-[#6d28d9] bg-[linear-gradient(135deg,#ede9fe,#a78bfa)] text-[#2e1065]" },
  "2급": { stars: "★", style: "border-[#0f766e] bg-[linear-gradient(135deg,#e0f7f3,#7fd1c5)] text-[#06302b]" },
  "1급": { stars: "★★", style: "border-[#0f766e] bg-[linear-gradient(135deg,#ccfbf1,#2dd4bf)] text-[#042f2e]" },
  기술사: { stars: "★★★★★", style: "border-[#9f1239] bg-[linear-gradient(135deg,#ffe4e6,#fb7185)] text-[#4c0519]" },
};
const CUSTOM_TIER = { stars: "◆", style: "border-[#1d4ed8] bg-[linear-gradient(135deg,#dbeafe,#93c5fd)] text-[#172554]" };

/** 보유 자격증 하나를 칭호처럼 보여 주는 배지 */
export function TitleBadge({ cert }: { cert: OwnedCert }) {
  const tier = (cert.grade && TIERS[cert.grade]) || CUSTOM_TIER;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-[1.05rem] font-extrabold ${tier.style}`}
    >
      <span aria-hidden="true" className="text-[0.8em]">
        {tier.stars}
      </span>
      {cert.name}
      {cert.year && <span className="text-[0.75em] font-bold">{cert.year}</span>}
    </span>
  );
}

const CUSTOM = "__custom__";

/** 딴 자격증을 등록·삭제한다 */
export function OwnedCertManager({ certs, owned }: { certs: ProfileCert[]; owned: OwnedCert[] }) {
  const [selected, setSelected] = useState(certs[0]?.id ?? CUSTOM);
  const [customName, setCustomName] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    setError(null);
    const yearNumber = year.trim() === "" ? null : Number(year);
    if (yearNumber !== null && (!Number.isInteger(yearNumber) || yearNumber < 1960 || yearNumber > 2100)) {
      return setError("취득 연도는 숫자 4자리로 적어 주세요. (예: 2024)");
    }
    if (selected === CUSTOM) {
      const name = customName.trim();
      if (!name) return setError("자격증 이름을 적어 주세요.");
      addOwnedCert({ key: `custom:${name}`, name, grade: null, year: yearNumber });
      setCustomName("");
    } else {
      const cert = certs.find((c) => c.id === selected);
      if (!cert) return;
      addOwnedCert({ key: cert.id, name: cert.name, grade: cert.grade, year: yearNumber });
    }
    setYear("");
  };

  const fieldClass = "mt-1 block h-12 w-full rounded-lg border-2 border-line bg-surface px-3 text-ink";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
        <div>
          <label htmlFor="owned-cert" className="font-bold">
            자격증
          </label>
          <select
            id="owned-cert"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className={fieldClass}
          >
            {certs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={CUSTOM}>목록에 없음 (직접 입력)</option>
          </select>
        </div>
        <div>
          <label htmlFor="owned-year" className="font-bold">
            취득 연도
          </label>
          <input
            id="owned-year"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="예: 2024"
            className={fieldClass}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={add}>
          등록
        </button>
      </div>

      {selected === CUSTOM && (
        <div>
          <label htmlFor="owned-custom" className="font-bold">
            자격증 이름
          </label>
          <input
            id="owned-custom"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            maxLength={30}
            className={fieldClass}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="font-bold text-bad">
          {error}
        </p>
      )}

      {owned.length > 0 && (
        <ul className="space-y-2 border-t border-line-soft pt-3">
          {owned.map((cert) => (
            <li key={cert.key} className="flex flex-wrap items-center justify-between gap-2">
              <TitleBadge cert={cert} />
              <button
                type="button"
                className="btn min-h-10 px-3 py-1 text-[0.85rem]"
                onClick={() => removeOwnedCert(cert.key)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
